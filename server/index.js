import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import { Interview } from './models/Interview.js';
import { requireAuth } from './middleware/auth.js';


// Services
import { generateResponse } from './services/ai.js';
import { addResumeToVectorDB, queryVectorDB } from './services/rag.js';
import { extractTextFromPDF } from './services/pdf.js';
import { generateInterviewPDF } from './services/pdfGenerator.js';
import { sendInterviewCompletionEmail, sendHRNotification } from './services/emailService.js';

// Load environment variables
// On Render, env vars come from dashboard, not .env file
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Multer: Keep file in memory for immediate extraction and embedding
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow all Vercel preview and production URLs
    if (origin.includes('vercel.app')) return callback(null, true);
    
    // Allow specific production domain if you have one
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://hireflow-ai-alpha.vercel.app'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
})); // Enable frontend → backend access
app.use(express.json()); // Parse JSON in request body

/* ----------------------------------------
  ROUTES
-----------------------------------------*/

// 1️⃣ Health Check → used by Render to keep server alive
app.get("/", (req, res) => {
  res.send({
    status: "Active",
    message: "HireFlow AI Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// 2️⃣ Resume Upload → Extract text → Parse with AI → Store embeddings in Vector DB
app.post("/api/upload", upload.single("resume"), async (req, res) => {
  try {
    const { file } = req;
    const { candidateId } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📄 Received file: ${file.originalname}`);

    // Extract text from PDF buffer
    const text = await extractTextFromPDF(file.buffer);
    console.log(`📝 Extracted ${text.length} characters`);

    // 🆕 Parse resume with AI to extract structured data
    const { parseResume } = await import('./services/resumeParser.js');
    const parseResult = await parseResume(text);
    
    if (!parseResult.success) {
      console.warn('⚠️ Resume parsing failed, continuing with text only');
    }

    // Use candidateId OR filename as unique vector ID
    const id = candidateId || file.originalname;
    await addResumeToVectorDB(text, id);

    res.json({
      success: true,
      message: "Resume processed and stored in memory.",
      id: id,
      // 🆕 Return parsed data
      parsedData: parseResult.success ? parseResult.data : null,
      skills: parseResult.success ? parseResult.extractedSkills : [],
      textLength: text.length
    });

  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: "Failed to process resume" });
  }
});

// 3️⃣ AI Chat → RAG powered interview question generation
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Get resume-based context from Vector DB
    const context = await queryVectorDB(message);

    // Your EXACT system prompt — NOT modified
    const systemPrompt = `
      You are an AI Technical Recruiter named "HireFlow".
      
      Your Goal: Conduct a technical screening interview for a Software Engineering role.
      
      CONTEXT FROM CANDIDATE'S RESUME:
      "${context || "No specific resume context found. Ask general technical questions."}"
      
      INSTRUCTIONS:
      1. Use the Context above to ask specific questions about their experience.
      2. Keep your responses concise (max 2-3 sentences).
      3. Be professional but conversational.
      4. Do not reveal that you were given this context text directly.
      5. If the candidate answers correctly, move to a harder topic.
      
      USER'S LATEST MESSAGE: "${message}"
      
      Generate the next interview question or response:
    `;

    const aiReply = await generateResponse(systemPrompt);

    res.json({
      reply: aiReply,
      contextUsed: context ? "Found relevant resume info" : "No context found",
    });

  } catch (error) {
    console.error("❌ Chat Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// 4️⃣ End Interview → Generate Final Score + Save to MongoDB + Send Emails
app.post("/api/interview/end", requireAuth, async (req, res) => {
  const { messages, candidateId, candidateName, candidateEmail } = req.body;

  try {
    // Combine chat messages into a readable transcript
    const transcript = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // Your EXACT evaluation prompt — NOT modified  
    const analysisPrompt = `
      Analyze this technical interview transcript.
      TRANSCRIPT:
      ${transcript}
      
      Generate a JSON summary of the candidate's performance.
      Strictly follow this JSON format (no markdown, just raw json):
      {
        "technicalScore": (0-100),
        "communicationScore": (0-100),
        "summary": "2 sentence summary",
        "strengths": ["point 1", "point 2"],
        "weaknesses": ["point 1", "point 2"],
        "verdict": "Hire" or "No Hire" or "Review"
      }
    `;

    const rawAnalysis = await generateResponse(analysisPrompt);

    // Remove accidental code fences
    const cleanJson = rawAnalysis.replace(/```json|```/g, "").trim();
    const feedback = JSON.parse(cleanJson);

    // Save interview record
    const interview = new Interview({ 
      candidateId, 
      candidateName: candidateName || 'Anonymous',
      messages, 
      feedback 
    });
    await interview.save();

    // 🆕 Generate PDF report
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInterviewPDF(interview);
      console.log('✅ PDF report generated');
    } catch (pdfError) {
      console.error('⚠️ PDF generation failed:', pdfError);
    }

    // 🆕 Send email to candidate (if email provided)
    if (candidateEmail) {
      try {
        await sendInterviewCompletionEmail({
          to: candidateEmail,
          candidateName: candidateName || 'Candidate',
          feedback,
          pdfAttachment: pdfBuffer
        });
        console.log('✅ Email sent to candidate');
      } catch (emailError) {
        console.error('⚠️ Email sending failed:', emailError);
      }
    }

    // 🆕 Send notification to HR
    try {
      await sendHRNotification({
        candidateName: candidateName || 'Anonymous',
        feedback,
        interviewId: interview._id
      });
      console.log('✅ HR notification sent');
    } catch (hrError) {
      console.error('⚠️ HR notification failed:', hrError);
    }

    res.json({ success: true, interviewId: interview._id, feedback });

  } catch (error) {
    console.error("❌ End Interview Error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 6️⃣ Export Interview as PDF
app.get("/api/interviews/:id/export", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch interview from database
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    // Generate PDF
    const pdfBuffer = await generateInterviewPDF(interview);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Interview_Report_${interview.candidateName.replace(/\s+/g, '_')}.pdf"`
    );

    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ PDF Export Error:", error);
    res.status(500).json({ error: "Failed to export PDF" });
  }
});

// 5️⃣ Fetch All Interviews → Dashboard display
app.get("/api/interviews", requireAuth ,async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ date: -1 });
    res.json(interviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fetch failed" });
  }
});

/* ----------------------------------------
  SERVER + DATABASE INITIALIZATION
-----------------------------------------*/

async function startServer() {
  try {
    // Verify environment variables are loaded
    if (!process.env.MONGO_URI) {
      console.error("🔴 ERROR: MONGO_URI environment variable is not set!");
      console.error("Available env vars:", Object.keys(process.env).filter(k => !k.includes('SECRET')).join(', '));
      process.exit(1);
    }
    
    console.log("🔵 Attempting MongoDB connection...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 MongoDB Connected Successfully");

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("🔴 MongoDB Connection Failed:", err);
    process.exit(1);
  }
}

// Initialize Server + DB
startServer();
