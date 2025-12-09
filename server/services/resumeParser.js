import { generateResponse } from './ai.js';

/**
 * Parse resume text and extract structured information using AI
 * @param {string} resumeText - Raw text extracted from PDF
 * @returns {Promise<Object>} Parsed resume data with skills, experience, etc.
 */
export async function parseResume(resumeText) {
  try {
    const parsePrompt = `
You are a resume parser. Extract structured information from the following resume text.

RESUME TEXT:
${resumeText}

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "name": "candidate full name",
  "email": "email if found, else null",
  "phone": "phone if found, else null",
  "skills": {
    "languages": ["JavaScript", "Python", etc.],
    "frameworks": ["React", "Node.js", etc.],
    "tools": ["Git", "Docker", etc.],
    "databases": ["MongoDB", "PostgreSQL", etc.]
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jan 2020 - Dec 2022",
      "description": "Brief description"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Technology",
      "field": "Computer Science",
      "year": "2023"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["React", "Node.js"]
    }
  ],
  "summary": "2-3 sentence professional summary",
  "yearsOfExperience": 2.5
}

If any field is not found, use null or empty array. Be accurate and extract all relevant information.
`;

    const aiResponse = await generateResponse(parsePrompt);
    
    // Clean up response (remove markdown code fences if present)
    const cleanJson = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsedData = JSON.parse(cleanJson);
    
    // Validate and return
    return {
      success: true,
      data: parsedData,
      extractedSkills: [
        ...(parsedData.skills?.languages || []),
        ...(parsedData.skills?.frameworks || []),
        ...(parsedData.skills?.tools || []),
        ...(parsedData.skills?.databases || [])
      ]
    };
    
  } catch (error) {
    console.error('❌ Resume parsing failed:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Generate interview questions based on parsed resume data
 * @param {Object} resumeData - Parsed resume information
 * @returns {Promise<Array>} Array of tailored interview questions
 */
export async function generateTailoredQuestions(resumeData) {
  try {
    const { skills, experience, projects } = resumeData;
    
    const questionPrompt = `
Based on this candidate's profile, generate 5 technical interview questions.

CANDIDATE PROFILE:
- Skills: ${skills?.languages?.join(', ') || 'General programming'}
- Frameworks: ${skills?.frameworks?.join(', ') || 'None specified'}
- Experience: ${experience?.[0]?.role || 'Entry level'} at ${experience?.[0]?.company || 'N/A'}
- Notable Project: ${projects?.[0]?.name || 'N/A'}

Return ONLY valid JSON array (no markdown):
[
  {
    "question": "Question text here",
    "category": "technical|behavioral|project-based",
    "difficulty": "easy|medium|hard",
    "expectedSkills": ["skill1", "skill2"]
  }
]

Make questions specific to their background, progressive in difficulty.
`;

    const aiResponse = await generateResponse(questionPrompt);
    const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleanJson);
    
    return questions;
    
  } catch (error) {
    console.error('❌ Question generation failed:', error);
    return [];
  }
}

/**
 * Calculate skill match percentage between resume and job requirements
 * @param {Array} resumeSkills - Skills from parsed resume
 * @param {Array} requiredSkills - Required skills for the position
 * @returns {Object} Match analysis
 */
export function calculateSkillMatch(resumeSkills, requiredSkills) {
  if (!resumeSkills || !requiredSkills || requiredSkills.length === 0) {
    return { matchPercentage: 0, matchedSkills: [], missingSkills: requiredSkills || [] };
  }
  
  const normalizedResumeSkills = resumeSkills.map(s => s.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());
  
  const matchedSkills = normalizedRequiredSkills.filter(skill => 
    normalizedResumeSkills.some(resumeSkill => 
      resumeSkill.includes(skill) || skill.includes(resumeSkill)
    )
  );
  
  const missingSkills = normalizedRequiredSkills.filter(skill => 
    !matchedSkills.includes(skill)
  );
  
  const matchPercentage = Math.round((matchedSkills.length / normalizedRequiredSkills.length) * 100);
  
  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    totalRequired: normalizedRequiredSkills.length,
    totalMatched: matchedSkills.length
  };
}
