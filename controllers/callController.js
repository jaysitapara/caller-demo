const CallModel = require("../models/call")

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

const chartData = async (req, res) => {
    try {
        const now = new Date();

        const startOfThisWeek = new Date(now);
        startOfThisWeek.setHours(0, 0, 0, 0);
        startOfThisWeek.setDate(now.getDate() - now.getDay());

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

        const endOfLastWeek = new Date(startOfThisWeek);
        endOfLastWeek.setMilliseconds(-1);

        const thisWeekCalls = await CallModel.aggregate([
            {
                $match: {
                    duration: { $gt: 60 },
                    createdAt: { $gte: startOfThisWeek }
                }
            },
            {
                $addFields: {
                    localDayOfWeek: {
                        $dayOfWeek: {
                            date: "$createdAt",
                            timezone: "Asia/Kolkata"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$localDayOfWeek",
                    count: { $sum: 1 }
                }
            }
        ]);

        const [thisWeekCount, lastWeekCount] = await Promise.all([
            CallModel.countDocuments({
                duration: { $gt: 60 },
                createdAt: { $gte: startOfThisWeek }
            }),
            CallModel.countDocuments({
                duration: { $gt: 60 },
                createdAt: {
                    $gte: startOfLastWeek,
                    $lte: endOfLastWeek
                }
            })
        ]);

        let changePercent = 0;
        if (lastWeekCount === 0 && thisWeekCount > 0) changePercent = 100;
        else if (lastWeekCount > 0)
            changePercent = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;

        const perDay = Math.round(thisWeekCount / 7);

        const daysMap = {
            1: "Sun",
            2: "Mon",
            3: "Tue",
            4: "Wed",
            5: "Thu",
            6: "Fri",
            7: "Sat"
        };

        const dailyCounts = Object.entries(daysMap).map(([num, name]) => ({
            day: name,
            count: num === "0" ? 0 : 0
        }));

        thisWeekCalls.forEach(({ _id, count }) => {
            const dayName = daysMap[_id];
            const target = dailyCounts.find((d) => d.day === dayName);
            if (target) {
                target.count = count;
            }
        });

        res.json({
            totalCalls: thisWeekCount,
            changePercent: Math.round(changePercent),
            perDay,
            dailyCounts
        });
    } catch (err) {
        console.error("chartData error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    startCall,
    endCall,
    getAllCalls,
    chartData
};