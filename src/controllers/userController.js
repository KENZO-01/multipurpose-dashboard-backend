const User = require("../models/User"),
  jwt = require("jsonwebtoken"),
  bcrypt = require("bcrypt"),
  crypto = require("crypto"),
  nodemailer = require("nodemailer");


function generateTokens(id, role) {
  const access = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "20m",
  });
  const refresh = jwt.sign({ id, role }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: "7d",
  });

  return { access, refresh };
}

function generateAccessToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "20m",
  });
}

exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired refresh token" });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newAccessToken = generateAccessToken(user._id, user.role);

      res.status(200).json({
        accessToken: newAccessToken,
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", err_msg: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already in use" });
    if (await User.findOne({ username }))
      return res.status(400).json({ error: "Username already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      passwordHash
    });

    res.json({ message: "Registration successful!" });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.validateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (await User.findOne({ username }))
      return res.status(400).json({ available: false });
    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.validateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ available: false });
    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Match by either email or username
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });

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
        username: user.username,
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

    const url = `${process.env.FRONTEND_BASE}/reset-password/${resetToken}`;
    console.log(url)

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset your password - Shadcn Admin",
      html: `
      <div style="background-color: #f9fafb; padding: 40px 20px; font-family: Arial, sans-serif; color: #111827; text-align: center;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px 40px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <h2 style="margin-bottom: 20px; font-size: 24px;">Reset your password</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello,<br/><br/>
            We received a request to reset your password for your <strong>Shadcn Admin</strong> account.
            Click the button below to set a new password.
            This link is valid for a limited time and can only be used once.
          </p>
          <a href="${url}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If you didn't request this, you can safely ignore this email.<br/>
            Your password won't be changed unless you click the button above.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">&copy; ${new Date().getFullYear()} Shadcn Admin</p>
        </div>
      </div>
      `,
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
