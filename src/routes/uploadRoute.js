const express = require("express");
const multer = require("multer");
const { uploadFile, getPresignedUrl } = require("../controllers/uploadController");

const router = express.Router();

const upload = multer({ dest: "uploads/" }); // Temporary storage

router.get("/getPresignedUrl", getPresignedUrl);
router.post("/upload", upload.single("file"), uploadFile);

module.exports = router;
