const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.post('/feedback/:id', feedbackController.createFeedback);

module.exports = router;