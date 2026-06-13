const fs = require('fs');
const path = require('path');
const multer = require('multer');

const petUploadsDirectory = path.join(__dirname, '..', '..', 'uploads', 'mascotas');
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

fs.mkdirSync(petUploadsDirectory, { recursive: true });

function sanitizeFileName(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48) || 'mascota';
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, petUploadsDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = sanitizeFileName(path.basename(file.originalname, extension));
    callback(null, `${Date.now()}-${baseName}${extension}`);
  }
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();
  const isAllowedExtension = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);

  if (!allowedMimeTypes.has(file.mimetype) || !isAllowedExtension) {
    const error = new Error('La imagen debe ser JPG, JPEG, PNG o WEBP.');
    error.statusCode = 400;
    callback(error);
    return;
  }

  callback(null, true);
}

const uploadPetImage = multer({
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  storage
});

module.exports = {
  uploadPetImage
};
