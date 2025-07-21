# File Upload Workflow

A complete Node.js file upload system with local storage and pagination API.

## Features

1. **File Upload**: Upload files to the server with automatic local storage
2. **Local Storage**: Files are saved in the `uploads/` directory
3. **Pagination API**: Retrieve uploaded files with pagination support
4. **File Management**: View, download, and delete uploaded files
5. **File Details**: Complete file information including size, type, and upload date

## Setup Instructions

### Prerequisites
- Node.js installed on your system
- MongoDB running locally (default: `mongodb://localhost:27017/fileupload`)

### Installation
1. Install dependencies (already configured in package.json):
   ```bash
   npm install
   ```

2. Start MongoDB service on your system

3. Start the server:
   ```bash
   npm run dev
   ```
   
   The server will run on `http://localhost:3000`

## API Endpoints

### 1. Upload File
- **URL**: `POST /upload`
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `file` field
- **Response**: File details with upload confirmation

**Example using curl:**
```bash
curl -X POST -F "file=@your-file.txt" http://localhost:3000/upload
```

### 2. Get All Files (Paginated)
- **URL**: `GET /files`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Files per page (default: 10)
- **Response**: Paginated list of files with metadata

**Example:**
```bash
curl "http://localhost:3000/files?page=1&limit=5"
```

### 3. Get Single File Details
- **URL**: `GET /files/:id`
- **Response**: Complete file information

**Example:**
```bash
curl "http://localhost:3000/files/FILE_ID_HERE"
```

### 4. Download File
- **URL**: `GET /download/:id`
- **Response**: File download

**Example:**
```bash
curl -O "http://localhost:3000/download/FILE_ID_HERE"
```

### 5. Delete File
- **URL**: `DELETE /files/:id`
- **Response**: Deletion confirmation

**Example:**
```bash
curl -X DELETE "http://localhost:3000/files/FILE_ID_HERE"
```

## API Response Examples

### Upload Response
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "originalName": "document.pdf",
    "filename": "file-1642567890123-123456789.pdf",
    "mimetype": "application/pdf",
    "size": 1024000,
    "uploadDate": "2024-01-01T12:00:00.000Z"
  }
}
```

### Paginated Files Response
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "507f1f77bcf86cd799439011",
        "originalName": "document.pdf",
        "filename": "file-1642567890123-123456789.pdf",
        "mimetype": "application/pdf",
        "size": 1024000,
        "sizeFormatted": "1.00 MB",
        "uploadDate": "2024-01-01T12:00:00.000Z",
        "path": "uploads/file-1642567890123-123456789.pdf"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalFiles": 45,
      "filesPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Testing the Application

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open the test interface**:
   Open `test-upload.html` in your web browser to use the graphical interface for testing all features.

3. **Or use API directly**:
   Use the curl examples above or any API testing tool like Postman.

## File Storage

- Files are stored in the `uploads/` directory
- Each file gets a unique filename with timestamp
- Original filenames are preserved in the database
- File metadata is stored in MongoDB

## Configuration

### File Upload Limits
- Maximum file size: 10MB (configurable in server.js)
- All file types accepted (configurable in multer fileFilter)

### Database Configuration
- MongoDB URL: `mongodb://localhost:27017/fileupload`
- Collection: `files`

### Directory Structure
```
project/
├── server.js           # Main server file
├── test-upload.html    # Test interface
├── package.json        # Dependencies
├── uploads/           # Uploaded files directory (auto-created)
└── README.md          # This file
```

## Workflow Summary

1. **Upload**: User uploads file via POST /upload
2. **Storage**: File saved to uploads/ directory with unique name
3. **Database**: File metadata saved to MongoDB
4. **Retrieval**: Files listed via GET /files with pagination
5. **Management**: Files can be downloaded or deleted via API

The system is ready to use and provides a complete file management solution with web interface and RESTful API."# caller-demo" 
