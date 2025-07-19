const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

const router = express.Router();

// Register user
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create new user
      const user = new User({ name, email, password });
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

// Login user
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
        ),
        false
      );
    }
  },
});

// Get current user
router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        location: req.user.location,
        linkedin: req.user.linkedin,
        github: req.user.github,
        portfolio: req.user.portfolio,
        skills: req.user.skills,
        experience: req.user.experience,
        education: req.user.education,
        resume: req.user.resume,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put(
  "/profile",
  require("../middleware/auth"),
  upload.single("resume"),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const updateData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        location: req.body.location,
        linkedin: req.body.linkedin,
        github: req.body.github,
        portfolio: req.body.portfolio,
        skills: req.body.skills,
        experience: req.body.experience,
        education: req.body.education,
      };

      // Handle resume upload
      if (req.file) {
        // Delete old resume if exists
        if (req.user.resume) {
          const oldResumePath = path.join(
            __dirname,
            "../uploads",
            req.user.resume
          );
          if (fs.existsSync(oldResumePath)) {
            fs.unlinkSync(oldResumePath);
          }
        }
        updateData.resume = req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          linkedin: updatedUser.linkedin,
          github: updatedUser.github,
          portfolio: updatedUser.portfolio,
          skills: updatedUser.skills,
          experience: updatedUser.experience,
          education: updatedUser.education,
          resume: updatedUser.resume,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Server error during profile update" });
    }
  }
);

// Download resume
router.get(
  "/resume/:filename",
  require("../middleware/auth"),
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, "../uploads", filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Resume not found" });
      }

      res.download(filePath);
    } catch (error) {
      console.error("Resume download error:", error);
      res.status(500).json({ message: "Server error during resume download" });
    }
  }
);

// Delete resume
router.delete(
  "/resume/:filename",
  require("../middleware/auth"),
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, "../uploads", filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Check if the resume belongs to the user
      if (req.user.resume !== filename) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this resume" });
      }

      fs.unlinkSync(filePath);

      // Update user to remove resume reference
      await User.findByIdAndUpdate(req.user._id, { resume: null });

      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      console.error("Resume delete error:", error);
      res.status(500).json({ message: "Server error during resume deletion" });
    }
  }
);

// Change password
router.put(
  "/change-password",
  require("../middleware/auth"),
  [
    body("currentPassword")
      .exists()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Get user with password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Server error during password change" });
    }
  }
);

module.exports = router;
