const mongoose = require('mongoose');

// File schema with Excel data storage
const fileSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  mimetype: String,
  size: Number,
  path: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  data: [mongoose.Schema.Types.Mixed] // Store Excel data as flat objects with dynamic keys
});

fileSchema.set('versionKey', false);

const File = mongoose.model('File', fileSchema);

module.exports = File;