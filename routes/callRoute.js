const express = require('express');
const router = express.Router();
const CallController = require('../controllers/callController');

router.post('/start', CallController.startCall);
router.post('/end', CallController.endCall);
router.get('/getAll', CallController.getAllCalls);
router.get('/getChart', CallController.chartData);

module.exports = router;
