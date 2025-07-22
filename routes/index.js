const express = require('express');
const router = express.Router();
const CallCRouter = require('./callRoute');
const fileRouter = require('./fileRoutes');

router.use('/files', fileRouter);
router.use('/calls', CallCRouter);

module.exports = router;
