const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const pgImagesDir = path.join(uploadsDir, 'pg-images');
const roomImagesDir = path.join(uploadsDir, 'room-images');
const tenantDocsDir = path.join(uploadsDir, 'tenant-docs');
const complaintPhotosDir = path.join(uploadsDir, 'complaint-photos');

[uploadsDir, pgImagesDir, roomImagesDir, tenantDocsDir, complaintPhotosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for PG images
const pgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pgImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pg-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for Room images
const roomStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, roomImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `room-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for Tenant documents
const tenantDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tenantDocsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `aadhaar-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// File filter for documents (images + PDF)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files and PDF are allowed!'));
  }
};

// Upload middleware for PG images
const uploadPGImages = multer({
  storage: pgStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
});

// Upload middleware for Room images
const uploadRoomImages = multer({
  storage: roomStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
});

// Storage configuration for Complaint photos
const complaintPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, complaintPhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `complaint-${uniqueSuffix}${ext}`);
  }
});

// Upload middleware for Tenant documents
const uploadTenantDoc = multer({
  storage: tenantDocsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for documents
  fileFilter: documentFilter
});

// Upload middleware for Complaint photos
const uploadComplaintPhoto = multer({
  storage: complaintPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
});

module.exports = {
  uploadPGImages,
  uploadRoomImages,
  uploadTenantDoc,
  uploadComplaintPhoto
};

