const path = require('path');
const multer = require('multer');
const { storeUploadedFile } = require('../services/fileStorage');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function sanitizeFileName(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48) || 'mascota';
}

function createFileName(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const baseName = sanitizeFileName(path.basename(file.originalname, extension));
  return `${Date.now()}-${baseName}${extension}`;
}

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

const parseUpload = multer({
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

const uploadPetImage = {
  single(fieldName) {
    const parseSingle = parseUpload.single(fieldName);

    return function persistPetImage(req, res, next) {
      parseSingle(req, res, async (error) => {
        if (error) {
          next(error);
          return;
        }

        try {
          if (req.file) {
            req.file.filename = createFileName(req.file);
            await storeUploadedFile(req.file, 'mascotas');
          }
          next();
        } catch (storageError) {
          next(storageError);
        }
      });
    };
  }
};

module.exports = { uploadPetImage };
