const FileModel = require('../models/File');
const fs = require('fs');
const XLSX = require('xlsx');

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 1. File Upload
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let excelData = [];
    const excelMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
    ];

    if (excelMimeTypes.includes(req.file.mimetype) || req.file.originalname.match(/\.(xlsx?|xls)$/i)) {
      try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length > 0) {
          const worksheet = workbook.Sheets[sheetNames[0]]; // Use first sheet
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          });

          if (jsonData.length > 0) {
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);
            excelData = dataRows.map((row, index) => {
              const rowObject = {};
              headers.forEach((header, colIndex) => {
                rowObject[header || `Column_${colIndex + 1}`] = row[colIndex] || '';
              });
              return rowObject;
            });
          }
        }
      } catch (excelError) {
        console.error('Excel parsing error:', excelError);
      }
    }

    const fileDoc = new FileModel({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      data: excelData
    });

    await fileDoc.save();

    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        id: fileDoc._id,
        originalName: fileDoc.originalName,
        filename: fileDoc.filename,
        mimetype: fileDoc.mimetype,
        size: fileDoc.size,
        uploadDate: fileDoc.uploadDate,
        hasExcelData: excelData.length > 0,
        totalRows: excelData.length
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Get all files
const getAllFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };
    const total = await FileModel.countDocuments(query);

    const files = await FileModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ uploadDate: -1 });

    res.status(200).json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalFiles: total,
      files,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. Get single file
const getFileById = async (req, res) => {
  try {
    const { id: fileId } = req.params;

    const file = await FileModel.findOne({
      _id: fileId,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or has been deleted' });
    }

    res.status(200).json({ file });
  } catch (error) {
    console.error('Get file error:', error);

    // Handle invalid ObjectId errors
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// 4. Download file
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileModel.findOne({ _id: id, isDeleted: false }).select('-data');

    if (!file) {
      return res.status(404).json({ error: 'File not found or has been deleted' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    return res.download(file.path, file.originalName);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 5. Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id).select('-data');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    file.deletedBy = req.userId;

    await file.save();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 6. Demo 
const getDemo = async (req, res) => {
  try {
    res.send("Server is running...")
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadFile,
  getAllFiles,
  getFileById,
  downloadFile,
  deleteFile,
  getDemo
};