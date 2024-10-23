const nodemailer = require("nodemailer");
const db = require("../config.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { sendEmail } = require('../EmailService.js');
const dotenv = require("dotenv");
dotenv.config(".env");
const SECRETTOKEN = process.env.SECRETTOKEN;
const saltRounds = 10;
// Configure nodemailer transport
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // Your email
//     pass: process.env.EMAIL_PASS, // Your email password
//   },
// });

// Forgot Password function
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Check if the user exists
  const sql = "SELECT email FROM login WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ Error: "Database error" });

    if (results.length === 0) {
      return res.status(404).json({ Error: "Email not found" });
    }

    // Generate reset token (using JWT)
    const token = jwt.sign({ email }, SECRETTOKEN, { expiresIn: "1h" });

    // Construct the reset link
    const resetLink = `http://localhost:3000/en/resetpassword?token=${token}`;
const to= email;
const subject="Reset Password";
const text = `Requested For Reset Password`;
const html= `<p>You requested a password reset. If you did not make this request, please ignore this email.</p>
<p>Click the link below to reset your password.</p>
<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;
    // Send email
     sendEmail(to, subject, text, html)

    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Reset Password",
    //   html: `<p>You requested a password reset. If you did not make this request, please ignore this email.</p>
    //     <p>Click the link below to reset your password.</p>
    //   <p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    // });

    return res.json({ Status: "Reset link sent to your email." });
  });
};
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // Verify the token
  jwt.verify(token, SECRETTOKEN, async (err, decoded) => {
    if (err) {
      return res.status(400).json({ Error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const sql = "UPDATE login SET password = ? WHERE email = ?";
    db.query(sql, [hashedPassword, decoded.email], (err, results) => {
      if (err) return res.status(500).json({ Error: "Database error" });
      return res.json({ Status: "Password reset successfully" });
    });
  });
};

module.exports = { forgotPassword, resetPassword };
