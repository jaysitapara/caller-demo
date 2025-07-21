const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const feedbackController = require('../controllers/feedbackController');


router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/files', fileController.getAllFiles);
router.get('/files/:id', fileController.getFileById);
router.put('/files/:id', upload.single('file'), fileController.updateFile);
router.get('/download/:id', fileController.downloadFile);
router.get('/excel/:id', fileController.getExcelData);
router.delete('/files/:id', fileController.deleteFile);

// feedback
router.post('/feedback/:id', feedbackController.createFeedback);

module.exports = router;