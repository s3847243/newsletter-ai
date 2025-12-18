import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";
import { env } from "../config/env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AuthRequest } from "../middlewares/auth";
function safeExtFromMime(mime: string) {
  // Keep it strict
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return null;
}
export const getPresignedUploadUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ 
        message: "filename and contentType are required" 
      });
    }
     // Validate content type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        message: "Unsupported image type",
      });
    }
    
    // Validate content type
    const ext = safeExtFromMime(contentType);
    if (!ext) {
      return res.status(400).json({ 
        message: "Unsupported image type. Supported: PNG, JPEG, WEBP, GIF" 
      });
    }

    // Generate unique key
    const rand = crypto.randomBytes(16).toString("hex");
    const key = `uploads/images/${Date.now()}-${rand}${ext}`;
    // Create the S3 command
    const command = new PutObjectCommand({
      Bucket: env.s3BucketName,
      Key: key,
      ContentType: contentType
    });

    // Generate presigned URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3, command, { 
      expiresIn: 300 // 5 minutes
    });

    // Generate public URL
    const base = env.s3PublicBaseUrl?.replace(/\/$/, "");
    // const publicUrl = base ? `${base}/${key}` : key;
    const publicUrl = `https://${env.s3BucketName}.s3.${env.awsRegion}.amazonaws.com/${key}`;

    return res.status(200).json({
      uploadUrl,  // Client will PUT to this URL
      publicUrl,  // Use this URL in the editor
      key,
      expiresIn: 300,
    });
  } catch (err) {
    next(err);
  }
};

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const mime = req.file.mimetype;
    const ext = safeExtFromMime(mime);
    if (!ext) {
      return res.status(400).json({ message: "Unsupported image type" });
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxBytes) {
      return res.status(400).json({ message: "File too large (max 5MB)" });
    }


    
    const rand = crypto.randomBytes(16).toString("hex");

    const key = `uploads/images/${Date.now()}-${rand}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: env.s3BucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: mime,

        // If your bucket allows public reads OR you're using CloudFront public origin
        ACL: "public-read",
      })
    );

    const base = env.s3PublicBaseUrl?.replace(/\/$/, "");
    const url = base ? `${base}/${key}` : key;

    return res.status(201).json({
      url,
      key,
      mimeType: mime,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
};
