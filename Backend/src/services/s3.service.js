import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import s3Client from "../config/aws.js";

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Generate a structured S3 Object Key.
 *
 * Key format: users/{ownerId}/{roomId}/{filePath}
 * Example:    users/user123/room456/src/components/App.jsx
 *
 * NOTE: This function is pure — it does NOT query MongoDB.
 * Callers must resolve ownerId before calling this.
 *
 * @param {string} ownerId - Firebase user ID of the room owner
 * @param {string} roomId  - Unique room identifier
 * @param {string} filePath - Relative file path within the workspace (e.g. "src/App.jsx")
 * @returns {string} S3 object key
 */
export const createS3Key = (ownerId, roomId, filePath) => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return `users/${ownerId || "default_user"}/${roomId}/${normalizedPath}`;
};

/**
 * Generate a Pre-Signed Upload URL for direct browser-to-S3 upload.
 *
 * The caller is responsible for passing ownerId (fetched from Room document upstream).
 * This keeps s3.service free of any database dependencies.
 *
 * @param {string} ownerId      - Room owner's user ID
 * @param {string} roomId       - Room identifier
 * @param {string} filePath     - Relative path within workspace
 * @param {string} contentType  - MIME type of the file being uploaded
 * @param {number} [expiresIn=300] - Signed URL expiry in seconds (default: 5 min)
 * @returns {Promise<{ uploadUrl: string, s3Key: string }>}
 */
export const generateUploadUrl = async (
  ownerId,
  roomId,
  filePath,
  contentType = "application/octet-stream",
  expiresIn = 300
) => {
  const s3Key = createS3Key(ownerId, roomId, filePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return { uploadUrl, s3Key };
};

/**
 * Generate a Pre-Signed Download URL for a known S3 key.
 *
 * @param {string} s3Key - The exact S3 object key
 * @param {number} [expiresIn=300] - Signed URL expiry in seconds
 * @returns {Promise<string>} Signed download URL
 */
export const generateDownloadUrl = async (s3Key, expiresIn = 300) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Get a raw S3 object Body stream.
 * Used for streaming ZIP downloads.
 *
 * @param {string} s3Key
 * @returns {Promise<ReadableStream>}
 */
export const getFileStream = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  return response.Body;
};

/**
 * Delete a single S3 object.
 *
 * @param {string} s3Key
 * @returns {Promise<true>}
 */
export const deleteS3Object = async (s3Key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
  return true;
};

/**
 * List all S3 objects under a given prefix.
 *
 * The caller is responsible for constructing the prefix
 * (e.g., `users/${ownerId}/${roomId}/`).
 *
 * @param {string} prefix - S3 key prefix to list under
 * @returns {Promise<Array>} Array of S3 object metadata
 */
export const listObjectsByPrefix = async (prefix) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return response.Contents || [];
};

/**
 * Delete all S3 objects under a given prefix (e.g., a whole workspace).
 *
 * @param {string} prefix - S3 key prefix
 * @returns {Promise<true>}
 */
export const deleteS3Prefix = async (prefix) => {
  const files = await listObjectsByPrefix(prefix);

  if (!files.length) {
    return true;
  }

  await Promise.all(files.map((file) => deleteS3Object(file.Key)));
  return true;
};

/**
 * Upload file content directly to S3 (server-side write).
 * Used when persisting workspace files from Redis cache to S3.
 *
 * @param {string} s3Key
 * @param {string|Buffer} content - File content
 * @param {string} [contentType="text/plain"]
 * @returns {Promise<true>}
 */
export const uploadFileContent = async (
  s3Key,
  content,
  contentType = "text/plain"
) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: content,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return true;
};

/**
 * Get S3 file content as a UTF-8 string.
 * Used when loading workspace files during a Redis cache miss.
 *
 * @param {string} s3Key
 * @returns {Promise<string>}
 */
export const getFileContent = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  return await response.Body.transformToString("utf-8");
};