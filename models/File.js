const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const fileSchema = new Schema(
  {
    originalName: {
      type: String,
      default: '',
    },
    filename: {
      type: String,
      default: '',
    },
    mimetype: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    path: {
      type: String,
      default: '',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    data: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isUpdated: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

const FileModel = model('File', fileSchema);

module.exports = FileModel;
