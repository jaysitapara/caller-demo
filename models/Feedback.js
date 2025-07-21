const mongoose = require('mongoose');

// Feedback schema linked to files
const feedbackSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  startCallTime: {
    type: Date,
    required: true
  },
  endCallTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in seconds
    required: true
  },
  feedbackMessage: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add virtual for formatted duration
feedbackSchema.virtual('formattedDuration').get(function() {
  if (this.duration) {
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return `${minutes}m ${seconds}s`;
  }
  return '0m 0s';
});

// Ensure virtual fields are serialized
feedbackSchema.set('toJSON', { virtuals: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;