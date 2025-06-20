const User = require("../models/User"),
  jwt = require("jsonwebtoken"),
  bcrypt = require("bcrypt"),
  crypto = require("crypto"),
  nodemailer = require("nodemailer");

const { https } = require('follow-redirects');
const { parse } = require('csv-parse/sync');


function generateTokens(id, role) {
  const access = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refresh = jwt.sign({ id, role }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: "7d",
  });

  return { access, refresh };
}

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      passwordHash
    });

    res.json({ message: "Registration successful!", user });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const tokens = generateTokens(user._id, user.role);

    res.status(200).json({
      message: "Login successful!",
      tokens,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error", err_msg: err });
  }
};

exports.forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    // generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashed = await bcrypt.hash(resetToken, 10);
    user.resetToken = hashed;
    user.resetTokenExp = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const url = `${process.env.FRONTEND_BASE}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset password",
      text: `Click here to reset password: ${url}`,
    });

    res.json({ message: "Reset password link has been sent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};


exports.reset = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetTokenExp: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    const match = await bcrypt.compare(token, user.resetToken);
    if (!match)
      return res.status(400).json({ error: "Invalid or tampered token" });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExp = undefined;

    await user.save();

    res.json({ message: "Your password has been reset successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};



// function fetchCSV(url) {
//   return new Promise((resolve, reject) => {
//     https.get(url, (res) => {
//       let data = '';

//       res.on('data', chunk => data += chunk);
//       res.on('end', () => {
//         if (data.trim().startsWith('<!DOCTYPE html') || data.trim().includes('<html')) {
//           return reject(new Error('Received HTML instead of CSV — check sheet permissions or URL'));
//         }
//         resolve(data);
//       });
//       res.on('error', reject);
//     });
//   });
// }

const axios = require('axios');

exports.sheetsToCsv = async (req, res) => {
  const spreadsheetId = '1M5itiLsyb-Q25Pzgiv8ErQMonwWIJyMqiReet7Am98I';
  const gid = '1177687623';
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  try {
    const response = await axios.get(url);
    const csvData = response.data;

    const records = parse(csvData, {
      columns: true,             // Treat first row as header
      skip_empty_lines: true,    // Skip empty rows
      relax_column_count: true,  // Allow uneven rows
      trim: true,                // Remove surrounding whitespace
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error });
  }

};

const fs = require('fs');
const path = require('path');

exports.uploadtoMinio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(req.file);

    const minioClient = require('../config/minioClient');
    const bucketName = 'multipurpose-dashboard-app';
    const objectName = req.file.originalname;
    const fileStream = fs.createReadStream(req.file);

    try {
      await minioClient.putObject(bucketName, objectName, fileStream, (err, etag) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error uploading file' });
        }
        console.log(`File ${objectName} uploaded successfully. ETag: ${etag}`);
      });
    } catch (err) {
      return res.status(500).json({ error: err || 'Error uploading file' });
    }

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // Construct the MinIO file URL
    const fileUrl = `http://localhost:9001/${bucketName}/${objectName}`;

    res.json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    // Clean up the uploaded file in case of error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: error.message || 'Error uploading file' });
  }
};

exports.downloadfromMinio = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const minioClient = require('../config/minioClient');
    const bucketName = 'multipurpose-dashboard-app';
    const filePath = path.join(__dirname, '..', 'downloads', filename);

    // Ensure downloads directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    const fileStream = fs.createWriteStream(filePath);
    await minioClient.fGetObject(bucketName, filename, filePath);

    res.download(filePath, filename, (err) => {
      // Clean up the file after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error cleaning up file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Error downloading from MinIO:', error);
    res.status(500).json({ error: error.message || 'Error downloading file' });
  }
};
