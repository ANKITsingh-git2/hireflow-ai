import PDFDocument from 'pdfkit';

/**
 * Generate a professional PDF report for an interview
 * @param {Object} interviewData - Interview data from database
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateInterviewPDF(interviewData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc
        .fontSize(24)
        .fillColor('#2563eb')
        .text('HireFlow AI', { align: 'center' })
        .fontSize(16)
        .fillColor('#64748b')
        .text('Technical Interview Report', { align: 'center' })
        .moveDown(2);

      // Candidate Information
      doc
        .fontSize(18)
        .fillColor('#1e293b')
        .text('Candidate Information')
        .moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#475569')
        .text(`Name: ${interviewData.candidateName || 'Anonymous'}`)
        .text(`Candidate ID: ${interviewData.candidateId}`)
        .text(`Interview Date: ${new Date(interviewData.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`)
        .moveDown(2);

      // Performance Scores
      doc
        .fontSize(18)
        .fillColor('#1e293b')
        .text('Performance Scores')
        .moveDown(0.5);

      const { feedback } = interviewData;

      // Technical Score
      doc
        .fontSize(14)
        .fillColor('#475569')
        .text('Technical Score:', { continued: true })
        .fontSize(16)
        .fillColor(feedback?.technicalScore >= 70 ? '#16a34a' : feedback?.technicalScore >= 50 ? '#eab308' : '#dc2626')
        .text(` ${feedback?.technicalScore || 0}/100`)
        .moveDown(0.5);

      // Communication Score
      doc
        .fontSize(14)
        .fillColor('#475569')
        .text('Communication Score:', { continued: true })
        .fontSize(16)
        .fillColor(feedback?.communicationScore >= 70 ? '#16a34a' : feedback?.communicationScore >= 50 ? '#eab308' : '#dc2626')
        .text(` ${feedback?.communicationScore || 0}/100`)
        .moveDown(0.5);

      // Verdict
      doc
        .fontSize(14)
        .fillColor('#475569')
        .text('Final Verdict:', { continued: true })
        .fontSize(16)
        .fillColor(
          feedback?.verdict === 'Hire' ? '#16a34a' :
          feedback?.verdict === 'No Hire' ? '#dc2626' : '#eab308'
        )
        .text(` ${feedback?.verdict || 'Review'}`)
        .moveDown(2);

      // Summary
      if (feedback?.summary) {
        doc
          .fontSize(18)
          .fillColor('#1e293b')
          .text('Summary')
          .moveDown(0.5);

        doc
          .fontSize(12)
          .fillColor('#475569')
          .text(feedback.summary, { align: 'justify' })
          .moveDown(2);
      }

      // Strengths
      if (feedback?.strengths && feedback.strengths.length > 0) {
        doc
          .fontSize(18)
          .fillColor('#1e293b')
          .text('Strengths')
          .moveDown(0.5);

        feedback.strengths.forEach((strength, index) => {
          doc
            .fontSize(12)
            .fillColor('#16a34a')
            .text(`✓ `, { continued: true })
            .fillColor('#475569')
            .text(strength)
            .moveDown(0.3);
        });
        doc.moveDown(1);
      }

      // Weaknesses
      if (feedback?.weaknesses && feedback.weaknesses.length > 0) {
        doc
          .fontSize(18)
          .fillColor('#1e293b')
          .text('Areas for Improvement')
          .moveDown(0.5);

        feedback.weaknesses.forEach((weakness, index) => {
          doc
            .fontSize(12)
            .fillColor('#dc2626')
            .text(`• `, { continued: true })
            .fillColor('#475569')
            .text(weakness)
            .moveDown(0.3);
        });
        doc.moveDown(1);
      }

      // Interview Transcript (condensed)
      if (interviewData.messages && interviewData.messages.length > 0) {
        doc.addPage();
        doc
          .fontSize(18)
          .fillColor('#1e293b')
          .text('Interview Transcript')
          .moveDown(0.5);

        // Show first 10 messages to keep PDF reasonable
        const messagesToShow = interviewData.messages.slice(0, 10);
        messagesToShow.forEach((msg, index) => {
          const role = msg.role === 'user' ? 'Candidate' : 'AI Interviewer';
          doc
            .fontSize(11)
            .fillColor('#2563eb')
            .text(`${role}:`, { continued: true })
            .fillColor('#475569')
            .text(` ${msg.content}`)
            .moveDown(0.5);
        });

        if (interviewData.messages.length > 10) {
          doc
            .fontSize(10)
            .fillColor('#94a3b8')
            .text(`... and ${interviewData.messages.length - 10} more messages`)
            .moveDown(1);
        }
      }

      // Footer
      doc
        .fontSize(10)
        .fillColor('#94a3b8')
        .text(
          `Generated by HireFlow AI on ${new Date().toLocaleDateString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}
