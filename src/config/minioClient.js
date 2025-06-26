const { Client } = require("minio");
require("dotenv").config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

module.exports = minioClient;


module.exports.ensureBucketExists = function ensureBucketExists() {

  const bucketName = process.env.MINIO_BUCKET;

  minioClient.bucketExists(bucketName, (err, exists) => {
    if (err) return console.error('Error checking bucket:', err);

    if (exists) {
      console.log(`Bucket ${bucketName} already exists.`);
    } else {
      minioClient.makeBucket(bucketName, (err) => {
        if (err) return console.error('Error creating bucket:', err);
        console.log(`Bucket ${bucketName} created successfully.`);
      });
    }
  });
}