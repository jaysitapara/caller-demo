const express = require('express');
const logger = require('./logger');
const connectDB = require('./config/database');
const fileRoutes = require('./routes');

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

// Ping backend every 5 minutes to keep Render alive
setInterval(() => {
  fetch("https://caller-demo.onrender.com/")
    .then((response) => {
      if (!response.ok) {
        logger.error(`Health check failed: ${response.statusText}`);
      } else {
        logger.info("Health check successful");
      }
    })
    .catch((error) => {
      logger.error(`Error during health check: ${error.message}`);
    });
}, 5 * 60 * 1000); // 5 minutes

app.use((error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }

  if (error.message === 'Only Excel files (.xlsx, .xls) are allowed!') {
    return res.status(400).json({ error: error.message });
  }

  logger.error(`Unhandled error: ${error.stack}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
