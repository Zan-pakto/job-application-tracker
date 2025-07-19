const express = require("express");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const JobApplication = require("../models/JobApplication");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Get all job applications for authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const { status, sortBy = "createdAt", order = "desc" } = req.query;

    let query = { userId: req.user._id };
    if (status) {
      query.currentStatus = status;
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const jobs = await JobApplication.find(query)
      .sort({ [sortBy]: sortOrder })
      .populate("userId", "name email");

    res.json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Server error while fetching jobs" });
  }
});

// Get a specific job application
router.get("/:id", auth, async (req, res) => {
  try {
    const job = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job application not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ message: "Server error while fetching job" });
  }
});

// Create new job application
router.post(
  "/",
  [
    auth,
    upload.single("resume"),
    body("companyName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Company name is required"),
    body("jobRole")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Job role is required"),
    body("currentStatus")
      .isIn(["Applied", "Interview", "Offer", "Rejected"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        companyName,
        jobRole,
        currentStatus,
        jobDescription,
        salary,
        location,
        jobUrl,
      } = req.body;

      const jobData = {
        userId: req.user._id,
        companyName,
        jobRole,
        currentStatus: currentStatus || "Applied",
        jobDescription,
        salary,
        location,
        jobUrl,
      };

      // Add resume file info if uploaded
      if (req.file) {
        jobData.resumeFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
        };
      }

      const job = new JobApplication(jobData);
      await job.save();

      res.status(201).json({
        message: "Job application created successfully",
        job,
      });
    } catch (error) {
      console.error("Create job error:", error);
      res
        .status(500)
        .json({ message: "Server error while creating job application" });
    }
  }
);

// Update job application
router.put(
  "/:id",
  [
    auth,
    upload.single("resume"),
    body("companyName")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Company name cannot be empty"),
    body("jobRole")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Job role cannot be empty"),
    body("currentStatus")
      .optional()
      .isIn(["Applied", "Interview", "Offer", "Rejected"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const job = await JobApplication.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!job) {
        return res.status(404).json({ message: "Job application not found" });
      }

      const {
        companyName,
        jobRole,
        currentStatus,
        jobDescription,
        salary,
        location,
        jobUrl,
      } = req.body;

      // Update basic fields
      if (companyName) job.companyName = companyName;
      if (jobRole) job.jobRole = jobRole;
      if (jobDescription !== undefined) job.jobDescription = jobDescription;
      if (salary !== undefined) job.salary = salary;
      if (location !== undefined) job.location = location;
      if (jobUrl !== undefined) job.jobUrl = jobUrl;

      // Handle status change
      if (currentStatus && currentStatus !== job.currentStatus) {
        job.currentStatus = currentStatus;
        job.statusHistory.push({
          status: currentStatus,
          date: new Date(),
          notes: req.body.statusNotes || `Status changed to ${currentStatus}`,
        });
      }

      // Handle resume file upload
      if (req.file) {
        job.resumeFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
        };
      }

      await job.save();

      res.json({
        message: "Job application updated successfully",
        job,
      });
    } catch (error) {
      console.error("Update job error:", error);
      res
        .status(500)
        .json({ message: "Server error while updating job application" });
    }
  }
);

// Download job resume
router.get("/resume/:filename", auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const job = await JobApplication.findOne({
      "resumeFile.filename": filename,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Resume file not found" });
    }

    res.download(filePath, job.resumeFile.originalName || filename);
  } catch (error) {
    console.error("Resume download error:", error);
    res.status(500).json({ message: "Server error during resume download" });
  }
});

// Delete job application
router.delete("/:id", auth, async (req, res) => {
  try {
    const job = await JobApplication.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job application not found" });
    }

    // Delete resume file if exists
    if (job.resumeFile && job.resumeFile.filename) {
      const filePath = path.join(
        __dirname,
        "../uploads",
        job.resumeFile.filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await JobApplication.findByIdAndDelete(req.params.id);

    res.json({ message: "Job application deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting job application" });
  }
});

// Get job statistics
router.get("/stats/overview", auth, async (req, res) => {
  try {
    const stats = await JobApplication.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: "$currentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await JobApplication.countDocuments({ userId: req.user._id });

    res.json({
      total,
      statusBreakdown: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Server error while fetching statistics" });
  }
});

module.exports = router;
