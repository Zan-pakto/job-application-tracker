import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import JobForm from "./JobForm";
import JobCard from "./JobCard";
import Navbar from "./Navbar";
import api from "../utils/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resume, setResume] = useState(null);
  const [currentResume, setCurrentResume] = useState(user?.resume || null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchJobs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Map backend status values to frontend expected values
      const statusMapping = {
        Applied: "applied",
        Interview: "interviewing",
        Offer: "offered",
        Rejected: "rejected",
      };

      const mappedJobs = response.data.map((job) => ({
        ...job,
        status: statusMapping[job.currentStatus] || "applied",
        appliedDate: job.applicationDate || job.createdAt,
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to fetch job applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobSubmit = async (jobData) => {
    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");

      // Set headers based on whether it's FormData or regular object
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // If it's FormData, don't set Content-Type (browser will set it with boundary)
      if (!(jobData instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (editingJob) {
        await axios.put(
          `http://localhost:5000/api/jobs/${editingJob._id}`,
          jobData,
          { headers }
        );
        setSuccess("Job application updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/jobs", jobData, {
          headers,
        });
        setSuccess("Job application added successfully!");
      }

      await fetchJobs();
      setShowJobForm(false);
      setEditingJob(null);
    } catch (error) {
      console.error("Error saving job:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save job application. Please check your connection and try again.";
      setError(errorMessage);
      throw error;
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleDelete = async (jobId) => {
    if (
      window.confirm("Are you sure you want to delete this job application?")
    ) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
        setError("Failed to delete job application");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF, DOC, or DOCX file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setResume(file);
      setError("");
    }
  };

  const handleResumeUpload = async () => {
    if (!resume) {
      setError("Please select a file to upload");
      return;
    }

    setUploadingResume(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("resume", resume);

      const response = await api.put("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Resume uploaded successfully!");
      setCurrentResume(response.data.user.resume);
      setResume(null);

      // Reset file input
      const fileInput = document.getElementById("dashboardResume");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Resume upload error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload resume. Please try again.";
      setError(errorMessage);
    } finally {
      setUploadingResume(false);
    }
  };

  const downloadResume = async () => {
    if (!currentResume) return;

    try {
      const response = await api.get(`/auth/resume/${currentResume}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", currentResume);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download resume");
    }
  };

  const deleteResume = async () => {
    if (!currentResume) return;

    if (!window.confirm("Are you sure you want to delete your resume?")) return;

    try {
      await api.delete(`/auth/resume/${currentResume}`);
      setCurrentResume(null);
      setSuccess("Resume deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete resume");
    }
  };

  const getStats = () => {
    const total = jobs.length;
    const applied = jobs.filter((job) => job.status === "applied").length;
    const interviewing = jobs.filter(
      (job) => job.status === "interviewing"
    ).length;
    const rejected = jobs.filter((job) => job.status === "rejected").length;
    const offered = jobs.filter((job) => job.status === "offered").length;

    return { total, applied, interviewing, rejected, offered };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="alert alert-error mb-8">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-8">
            <span className="mr-2">✅</span>
            {success}
          </div>
        )}

        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 lg:p-12 mb-12 border border-blue-100 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-base lg:text-lg text-gray-600 mb-6 max-w-2xl">
                Track and manage your job applications efficiently with our
                comprehensive dashboard
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-4 py-2 bg-white/90 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 backdrop-blur-sm shadow-sm">
                  🎯 {stats.total} Applications Tracked
                </span>
                {stats.interviewing > 0 && (
                  <span className="inline-flex items-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm font-semibold text-yellow-700 shadow-sm">
                    🔥 {stats.interviewing} Active Interviews
                  </span>
                )}
                {stats.offered > 0 && (
                  <span className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm font-semibold text-green-700 shadow-sm">
                    ✨ {stats.offered} Offers Received
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setEditingJob(null);
                  setShowJobForm(true);
                  setError("");
                  setSuccess("");
                }}
                className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <span className="mr-2">✨</span>
                Add New Job
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 mb-12 border border-gray-200 shadow-lg">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-8 flex items-center">
            <span className="mr-3 text-3xl">📊</span>
            Application Statistics
          </h2>

          {/* Row 1: Total and Applied */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>
              <div className="text-3xl lg:text-4xl mb-3">📈</div>
              <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 mb-2">
                {stats.total}
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Total Applications
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <div className="text-3xl lg:text-4xl mb-3">📝</div>
              <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 mb-2">
                {stats.applied}
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Applied
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 md:col-span-2 lg:col-span-1 group">
              <div className="text-3xl lg:text-4xl mb-3">💼</div>
              <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-yellow-600 mb-2">
                {stats.interviewing}
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Interviewing
              </div>
            </div>
          </div>

          {/* Row 2: Offered and Rejected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <div className="text-3xl lg:text-4xl mb-3">🎉</div>
              <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-600 mb-2">
                {stats.offered}
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Offers Received
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
              <div className="text-3xl lg:text-4xl mb-3">❌</div>
              <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-red-600 mb-2">
                {stats.rejected}
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Rejected
              </div>
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 mb-12 border border-gray-200 shadow-lg">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-8 flex items-center">
            <span className="mr-3 text-3xl">📄</span>
            Resume Management
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Current Resume */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-3 text-2xl">📎</span>
                Current Resume
              </h3>

              {currentResume ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">✅</span>
                        <span className="font-medium text-green-800">
                          Resume uploaded: {currentResume}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={downloadResume}
                      className="btn btn-secondary btn-sm"
                    >
                      <span className="mr-1">⬇️</span>
                      Download
                    </button>
                    <button
                      onClick={deleteResume}
                      className="btn btn-danger btn-sm"
                    >
                      <span className="mr-1">🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4 opacity-60">📄</div>
                  <p className="text-gray-600 mb-4">
                    No resume uploaded yet. Upload your resume to use it for job
                    applications.
                  </p>
                </div>
              )}
            </div>

            {/* Upload New Resume */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-3 text-2xl">📤</span>
                {currentResume ? "Update Resume" : "Upload Resume"}
              </h3>

              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="dashboardResume" className="form-label">
                    Select Resume File
                  </label>
                  <input
                    id="dashboardResume"
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="form-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>

                {resume && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">📄</span>
                        <span className="font-medium text-blue-800">
                          Selected: {resume.name}
                        </span>
                      </div>
                      <span className="text-sm text-blue-600">
                        {(resume.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleResumeUpload}
                  disabled={!resume || uploadingResume}
                  className="btn btn-primary w-full"
                >
                  {uploadingResume ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📤</span>
                      {currentResume ? "Update Resume" : "Upload Resume"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Job Form Modal */}
        {showJobForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingJob
                    ? "Edit Job Application"
                    : "Add New Job Application"}
                </h2>
                <button
                  onClick={() => {
                    setShowJobForm(false);
                    setEditingJob(null);
                  }}
                  className="modal-close"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <JobForm
                  job={editingJob}
                  onSubmit={handleJobSubmit}
                  onCancel={() => {
                    setShowJobForm(false);
                    setEditingJob(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Jobs List */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
              <span className="mr-3 text-3xl">📋</span>
              Your Applications
              <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 text-sm font-bold px-3 py-2 rounded-xl ml-4 min-w-[2.5rem] shadow-sm">
                {jobs.length}
              </span>
            </h2>
            {jobs.length > 0 && (
              <div className="flex gap-4">
                <select className="px-4 py-3 border border-gray-300 rounded-xl bg-white font-medium text-gray-700 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <option value="all">All Applications</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 my-8 shadow-lg">
              <div className="text-7xl mb-6 opacity-80">🚀</div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                Start Your Job Hunt Journey!
              </h3>
              <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed mb-8">
                No job applications yet. Ready to take the next step in your
                career? Add your first application and start tracking your
                progress!
              </p>
              <button
                onClick={() => {
                  setEditingJob(null);
                  setShowJobForm(true);
                }}
                className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <span className="mr-2">🎯</span>
                Add Your First Job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
