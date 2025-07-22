const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const callSchema = new Schema(
    {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            default: null
        },
        startCallTime: {
            type: Date,
            default: Date.now
        },
        endCallTime: {
            type: Date,
            default: null
        },
        duration: {
            type: Number,
            default: 0
        },
        feedbackMessage: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const CallModel = model('Call', callSchema);

module.exports = CallModel;
