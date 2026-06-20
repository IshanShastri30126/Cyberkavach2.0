import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { uploadToCloudinary, isCloudinaryConfigured } from "../lib/cloudinaryService";
import { Request, Response, NextFunction } from "express";

// Allowed MIME types
const allowedMimes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

// ─── Cloudinary Mode (Production / Vercel) ─────────────────────
// Uses memory storage and uploads to Cloudinary after multer parses the file.
const memoryStorage = multer.memoryStorage();

const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 20 * 1024 * 1024, // 20MB for large base64 payload
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// ─── Local Disk Mode (Development) ─────────────────────────────
const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const diskUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// ─── Smart Upload Middleware ────────────────────────────────────
// Automatically uses Cloudinary when configured, falls back to disk otherwise.

function createCloudinaryMiddleware(fieldName: string, folder?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    memoryUpload.single(fieldName)(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next(); // No file uploaded, continue

      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: folder || "cyberkavach",
          resourceType: req.file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        // Attach the Cloudinary URL to req.file so routes can use it
        (req.file as any).cloudinaryUrl = result.url;
        (req.file as any).cloudinaryPublicId = result.publicId;
        // Also set filename to the URL for backward compatibility
        req.file.filename = result.url;

        next();
      } catch (uploadErr) {
        console.error("[Upload] Cloudinary upload failed:", uploadErr);
        res.status(500).json({ error: "File upload failed" });
      }
    });
  };
}

// Export a unified upload object that works like multer
// but transparently uploads to Cloudinary when configured
export const upload = {
  single: (fieldName: string, folder?: string) => {
    if (isCloudinaryConfigured()) {
      return createCloudinaryMiddleware(fieldName, folder);
    }
    return diskUpload.single(fieldName);
  },
};

/**
 * Helper to get the file URL from a request, whether using Cloudinary or disk.
 * Use this in routes instead of manually constructing `/uploads/...` paths.
 */
export function getUploadedFileUrl(file: Express.Multer.File): string {
  if ((file as any).cloudinaryUrl) {
    return (file as any).cloudinaryUrl;
  }
  return `/uploads/${file.filename}`;
}
