const minioClient = require("../config/minioClient");
const fs = require("fs");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const bucket = process.env.MINIO_BUCKET;
    const objectName = req.file.originalname;
    const fileStream = fs.createReadStream(req.file.path);

    const bucketExists = await minioClient.bucketExists(bucket);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
    }

    await minioClient.putObject(bucket, objectName, fileStream, {
      "Content-Type": req.file.mimetype,
    });

    // Remove the temporary file after successful upload
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error removing temporary file:", err);
      } else {
        console.log(`Temporary file ${filePath} removed successfully`);
      }
    });

    res.status(200).json({
      message: "File uploaded successfully",
      fileUrl: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${objectName}`,
    });
  } catch (err) {
    // Clean up the temporary file in case of error
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error removing temporary file after upload error:", unlinkErr);
        }
      });
    }
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

exports.getPresignedUrl = async (req, res) => {
  try {
    const objectName = "analytics-screen.png";

    const url = await minioClient.presignedGetObject(process.env.MINIO_BUCKET, objectName, 60 * 5); // 5 mins
    return res.json({ url });
  } catch (error) {
    console.error("Error generating presigned URL", error);
    res.status(500).json({ error: "Failed to generate URL" });
  }
};