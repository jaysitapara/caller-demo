const Feedback = require('../models/Feedback');
const File = require('../models/File');

const createFeedback = async (req, res) => {
  try {
    const fileId = req.params.id;
    const { startCallTime, endCallTime, feedbackMessage } = req.body;

    if (!startCallTime || !endCallTime || !feedbackMessage) {
      return res.status(400).json({ 
        error: 'All fields are required: startCallTime, endCallTime, feedbackMessage' 
      });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const startDate = new Date(startCallTime);
    const endDate = new Date(endCallTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use ISO 8601 format (e.g., 2025-01-20T10:00:00Z)' 
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ 
        error: 'End call time must be after start call time' 
      });
    }

    const durationSeconds = Math.floor((endDate - startDate) / 1000);

    const feedback = new Feedback({
      fileId,
      startCallTime: startDate,
      endCallTime: endDate,
      duration: durationSeconds,
      feedbackMessage: feedbackMessage.trim()
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      feedback: {
        id: feedback._id,
        fileId: feedback.fileId,
        fileName: file.originalName,
        startCallTime: feedback.startCallTime,
        endCallTime: feedback.endCallTime,
        duration: feedback.duration,
        formattedDuration: feedback.formattedDuration,
        feedbackMessage: feedback.feedbackMessage,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createFeedback
};