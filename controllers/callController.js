const CallModel = require('../models/Call');

const startCall = async (req, res) => {
    try {
        const { fileId } = req.body;

        const newCall = await CallModel.create({
            fileId,
            startCallTime: new Date()
        });

        res.status(201).json({
            message: 'Call started',
            callId: newCall._id,
            startCallTime: newCall.startCallTime,
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const endCall = async (req, res) => {
    try {
        const { callId, feedbackMessage } = req.body;

        const call = await CallModel.findById(callId);
        if (!call || call.endCallTime) {
            return res.status(400).json({ error: 'Call not found or already ended' });
        }

        const endTime = new Date();
        const durationInSeconds = Math.floor((endTime - call.startCallTime) / 1000);

        call.endCallTime = endTime;
        call.duration = durationInSeconds;
        call.feedbackMessage = feedbackMessage;
        await call.save();

        res.status(200).json({
            message: 'Call ended',
            duration: call.duration,
            endCallTime: call.endCallTime
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllCalls = async (req, res) => {
    try {
        const calls = await CallModel.find().sort({ createdAt: -1 });
        res.status(200).json(calls);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    startCall,
    endCall,
    getAllCalls
};