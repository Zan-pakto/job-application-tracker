const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Interview', 'Offer', 'Rejected']
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  jobRole: {
    type: String,
    required: true,
    trim: true
  },
  currentStatus: {
    type: String,
    required: true,
    enum: ['Applied', 'Interview', 'Offer', 'Rejected'],
    default: 'Applied'
  },
  statusHistory: [statusHistorySchema],
  resumeFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  },
  jobDescription: {
    type: String,
    default: ''
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  jobUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add initial status to history when creating a new job
jobApplicationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.currentStatus,
      date: this.applicationDate || new Date(),
      notes: 'Application submitted'
    });
  }
  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
