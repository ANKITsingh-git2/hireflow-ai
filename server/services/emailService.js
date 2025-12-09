import nodemailer from 'nodemailer';

/**
 * Create email transporter
 * Uses Gmail by default, can be configured for other providers
 */
function createTransporter() {
  // For development: use ethereal email (fake SMTP)
  // For production: use real SMTP credentials from environment variables
  
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE, // 'gmail', 'outlook', etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development: Log to console instead of sending
    console.warn('⚠️ Email credentials not configured. Emails will be logged to console.');
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
}

/**
 * Send interview completion email to candidate
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.candidateName - Candidate's name
 * @param {Object} options.feedback - Interview feedback data
 * @param {Buffer} options.pdfAttachment - PDF report buffer (optional)
 * @returns {Promise<Object>} Email send result
 */
export async function sendInterviewCompletionEmail({ to, candidateName, feedback, pdfAttachment }) {
  try {
    const transporter = createTransporter();

    const verdictColor = 
      feedback.verdict === 'Hire' ? '#16a34a' :
      feedback.verdict === 'No Hire' ? '#dc2626' : '#eab308';

    const verdictEmoji =
      feedback.verdict === 'Hire' ? '✅' :
      feedback.verdict === 'No Hire' ? '❌' : '⏳';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f8fafc;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .score-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .score {
      font-size: 32px;
      font-weight: bold;
      color: ${verdictColor};
    }
    .verdict {
      display: inline-block;
      padding: 10px 20px;
      background: ${verdictColor};
      color: white;
      border-radius: 20px;
      font-weight: bold;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 HireFlow AI</h1>
    <p>Technical Interview Results</p>
  </div>
  
  <div class="content">
    <h2>Hi ${candidateName || 'Candidate'},</h2>
    
    <p>Thank you for completing your technical interview with HireFlow AI. Here are your results:</p>
    
    <div class="score-card">
      <h3>Performance Scores</h3>
      <p><strong>Technical Skills:</strong> <span class="score">${feedback.technicalScore || 0}/100</span></p>
      <p><strong>Communication:</strong> <span class="score">${feedback.communicationScore || 0}/100</span></p>
      <p><strong>Final Verdict:</strong> <span class="verdict">${verdictEmoji} ${feedback.verdict || 'Under Review'}</span></p>
    </div>
    
    ${feedback.summary ? `
    <div class="score-card">
      <h3>Summary</h3>
      <p>${feedback.summary}</p>
    </div>
    ` : ''}
    
    ${feedback.strengths && feedback.strengths.length > 0 ? `
    <div class="score-card">
      <h3>✅ Strengths</h3>
      <ul>
        ${feedback.strengths.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${feedback.weaknesses && feedback.weaknesses.length > 0 ? `
    <div class="score-card">
      <h3>📈 Areas for Improvement</h3>
      <ul>
        ${feedback.weaknesses.map(w => `<li>${w}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <p>A detailed PDF report is attached to this email for your records.</p>
    
    <p>Best of luck with your job search!</p>
    
    <p>Best regards,<br><strong>HireFlow AI Team</strong></p>
  </div>
  
  <div class="footer">
    <p>This is an automated email from HireFlow AI Interview Platform</p>
    <p>© ${new Date().getFullYear()} HireFlow AI. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hireflow.ai',
      to: to,
      subject: `Interview Results - ${feedback.verdict || 'Completed'} ${verdictEmoji}`,
      html: htmlContent,
      attachments: pdfAttachment ? [{
        filename: `Interview_Report_${candidateName?.replace(/\s+/g, '_') || 'Candidate'}.pdf`,
        content: pdfAttachment,
        contentType: 'application/pdf'
      }] : []
    };

    const info = await transporter.sendMail(mailOptions);
    
    // If using development transporter, log the email
    if (!process.env.EMAIL_USER) {
      console.log('📧 Email Preview (Development Mode):');
      console.log('To:', to);
      console.log('Subject:', mailOptions.subject);
      console.log('Message sent:', info.messageId);
    }

    return {
      success: true,
      messageId: info.messageId,
      preview: !process.env.EMAIL_USER
    };

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to HR when a new interview is completed
 * @param {Object} options - Email options
 * @param {string} options.candidateName - Candidate's name
 * @param {Object} options.feedback - Interview feedback
 * @param {string} options.interviewId - Interview ID
 * @returns {Promise<Object>} Email send result
 */
export async function sendHRNotification({ candidateName, feedback, interviewId }) {
  try {
    const transporter = createTransporter();

    const hrEmail = process.env.HR_EMAIL || 'hr@company.com';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
    .content { background: #f8fafc; padding: 20px; margin-top: 20px; border-radius: 8px; }
    .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 New Interview Completed</h2>
    </div>
    <div class="content">
      <p><strong>Candidate:</strong> ${candidateName || 'Anonymous'}</p>
      <p><strong>Technical Score:</strong> ${feedback.technicalScore}/100</p>
      <p><strong>Communication Score:</strong> ${feedback.communicationScore}/100</p>
      <p><strong>Verdict:</strong> ${feedback.verdict}</p>
      
      <div class="highlight">
        <p><strong>Quick Summary:</strong> ${feedback.summary || 'No summary available'}</p>
      </div>
      
      <p>View full details in your HireFlow AI dashboard.</p>
      <p><small>Interview ID: ${interviewId}</small></p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@hireflow.ai',
      to: hrEmail,
      subject: `New Interview: ${candidateName} - ${feedback.verdict}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ HR notification failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
