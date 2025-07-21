const express = require('express');
const cron = require('node-cron');
const connectDB = require('./config/database');
const fileRoutes = require('./routes/fileRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api', fileRoutes);
app.use('/api', feedbackRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'File Upload API with Excel Data Storage and Feedback System is running'
  });
});

// 🕒 Auto-run function every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running scheduled task every 5 minutes`);

  // 👉 Replace this block with your custom logic
  // Example: clean up temp files, send reminders, etc.
  try {
    // yourFunction(); // call your own function here
    console.log('Scheduled task executed');
  } catch (err) {
    console.error('Error in scheduled task:', err);
  }
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
