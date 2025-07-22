const express = require('express');
const cron = require('node-cron');
const connectDB = require('./config/database');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api', fileRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'File Upload API with Excel Data Storage and Feedback System is running'
  });
});

app.use((error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }

  if (error.message === 'Only Excel files (.xlsx, .xls) are allowed!') {
    return res.status(400).json({ error: error.message });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
