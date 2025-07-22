const File = require('../models/File');
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

    // Check if the file is an Excel file
    if (excelMimeTypes.includes(req.file.mimetype) || req.file.originalname.match(/\.(xlsx?|xls)$/i)) {
      try {
        // Read the Excel file
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
        // Continue with file upload even if Excel parsing fails
      }
    }

    // Save file information and Excel data to database
    const fileDoc = new File({
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

    // Get total count for pagination
    const totalFiles = await File.countDocuments();
    const totalPages = Math.ceil(totalFiles / limit);

    // Get files with pagination including Excel data
    const files = await File.find({})
      .sort({ uploadDate: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude only version field, include data

    // Format file information with Excel data
    const formattedFiles = files.map(file => {
      const headers = file.data && file.data.length > 0 ? Object.keys(file.data[0]) : [];
      
      return {
        id: file._id,
        originalName: file.originalName,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        uploadDate: file.uploadDate,
        path: file.path,
        hasExcelData: file.data && file.data.length > 0,
        totalRows: file.data ? file.data.length : 0,
        headers: headers,
        excelData: file.data || []
      };
    });

    res.status(200).json({
      success: true,
      data: {
        files: formattedFiles,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalFiles: totalFiles,
          filesPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. Get single file
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).select('-__v');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    const fileExists = fs.existsSync(file.path);

    // Extract headers from Excel data
    const headers = file.data && file.data.length > 0 ? Object.keys(file.data[0]) : [];

    res.status(200).json({
      success: true,
      data: {
        id: file._id,
        originalName: file.originalName,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        uploadDate: file.uploadDate,
        path: file.path,
        fileExists: fileExists,
        hasExcelData: file.data && file.data.length > 0,
        totalRows: file.data ? file.data.length : 0,
        headers: headers,
        excelData: file.data || []
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 4. Download file
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).select('-data');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 5. Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).select('-data');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 6. pagination
const getExcelData = async (req, res) => {
  try {
    const fileId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Find the file in database
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file has Excel data
    if (!file.data || file.data.length === 0) {
      return res.status(400).json({ error: 'No Excel data found for this file' });
    }

    // Prepare data from database
    const excelData = file.data;
    const headers = excelData.length > 0 ? Object.keys(excelData[0]) : [];

    // Calculate pagination
    const totalRows = excelData.length;
    const totalPages = Math.ceil(totalRows / limit);
    const skip = (page - 1) * limit;

    // Get paginated data
    const paginatedData = excelData.slice(skip, skip + limit);

    // Response
    res.status(200).json({
      success: true,
      data: {
        fileInfo: {
          id: file._id,
          originalName: file.originalName,
          filename: file.filename,
          uploadDate: file.uploadDate
        },
        sheetInfo: {
          headers: headers,
          totalRows: totalRows
        },
        rows: paginatedData,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalRows: totalRows,
          rowsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          startRow: skip + 1,
          endRow: Math.min(skip + limit, totalRows)
        }
      }
    });

  } catch (error) {
    console.error('Excel read error:', error);
    res.status(500).json({ error: 'Internal server error while reading Excel data' });
  }
};

// 7. Update Excel file
const updateFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Find existing file
    const existingFile = await File.findById(fileId);
    if (!existingFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    let excelData = [];
    const excelMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
    ];

    // Check if the new file is an Excel file
    if (excelMimeTypes.includes(req.file.mimetype) || req.file.originalname.match(/\.(xlsx?|xls)$/i)) {
      try {
        // Read the new Excel file
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
        // Delete the uploaded file if parsing fails
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: 'Failed to parse Excel file' });
      }
    }

    // Delete old file from disk
    if (fs.existsSync(existingFile.path)) {
      fs.unlinkSync(existingFile.path);
    }

    // Update file information in database
    const updatedFile = await File.findByIdAndUpdate(
      fileId,
      {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        data: excelData,
        uploadDate: new Date() // Update upload date to current time
      },
      { new: true } // Return updated document
    );

    res.status(200).json({
      message: 'File updated successfully',
      file: {
        id: updatedFile._id,
        originalName: updatedFile.originalName,
        filename: updatedFile.filename,
        mimetype: updatedFile.mimetype,
        size: updatedFile.size,
        uploadDate: updatedFile.uploadDate,
        hasExcelData: excelData.length > 0,
        totalRows: excelData.length
      }
    });
  } catch (error) {
    console.error('Update error:', error);
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
  getExcelData,
  updateFile,
  getDemo
};