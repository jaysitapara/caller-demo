const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');


router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/', fileController.getAllFiles);
router.get('/:id', fileController.getFileById);
router.get('/download/:id', fileController.downloadFile);
router.delete('/:id', fileController.deleteFile);
router.get('/demo', fileController.getDemo);

module.exports = router;