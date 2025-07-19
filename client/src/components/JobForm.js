import React, { useState } from "react";

const JobForm = ({ job, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    companyName: job?.companyName || "",
    jobRole: job?.jobRole || "",
    status: job?.status || "applied",
    jobDescription: job?.jobDescription || "",
    salary: job?.salary || "",
    location: job?.location || "",
    jobUrl: job?.jobUrl || "",
    appliedDate: job?.appliedDate
      ? job.appliedDate.split("T")[0]
      : new Date().toISOString().split("T")[0],
  });
  const [resume, setResume] = useState(null);
  const [currentResume, setCurrentResume] = useState(job?.resume || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!formData.companyName.trim() || !formData.jobRole.trim()) {
      setError("Company name and job role are required");
      setLoading(false);
      return;
    }

    // Map frontend status values to backend expected values
    const statusMapping = {
      applied: "Applied",
      interviewing: "Interview",
      offered: "Offer",
      rejected: "Rejected",
    };

    const formDataToSend = new FormData();

    // Add form data
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    // Add status mapping
    formDataToSend.append(
      "currentStatus",
      statusMapping[formData.status] || "Applied"
    );

    // Add resume file if selected
    if (resume) {
      formDataToSend.append("resume", resume);
    }

    try {
      await onSubmit(formDataToSend);

      // Show success message briefly
      setError("");

      // Reset form if not editing
      if (!job) {
        setFormData({
          companyName: "",
          jobRole: "",
          status: "applied",
          jobDescription: "",
          salary: "",
          location: "",
          jobUrl: "",
          appliedDate: new Date().toISOString().split("T")[0],
        });
        setResume(null);
        setCurrentResume(null);

        // Reset file input
        const fileInput = document.getElementById("jobResume");
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save job application. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg max-h-[80vh] overflow-y-auto">
      {error && (
        <div className="alert alert-error mb-6">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label htmlFor="companyName" className="form-label">
              Company Name *
            </label>
            <input
              id="companyName"
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobRole" className="form-label">
              Job Role *
            </label>
            <input
              id="jobRole"
              type="text"
              name="jobRole"
              required
              value={formData.jobRole}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter job role"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="salary" className="form-label">
              Salary
            </label>
            <input
              id="salary"
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter salary range"
            />
          </div>

          <div className="form-group">
            <label htmlFor="appliedDate" className="form-label">
              Applied Date
            </label>
            <input
              id="appliedDate"
              type="date"
              name="appliedDate"
              value={formData.appliedDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="jobUrl" className="form-label">
            Job URL
          </label>
          <input
            id="jobUrl"
            type="url"
            name="jobUrl"
            value={formData.jobUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter job posting URL"
          />
        </div>

        <div className="form-group">
          <label htmlFor="jobDescription" className="form-label">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            rows="4"
            value={formData.jobDescription}
            onChange={handleChange}
            className="form-input resize-vertical min-h-[80px]"
            placeholder="Enter job description or notes"
          />
        </div>

        {/* Resume Upload */}
        <div className="form-group">
          <label htmlFor="jobResume" className="form-label">
            Resume Upload
          </label>

          {currentResume && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">📎</span>
                  <span className="font-medium text-blue-800">
                    Current Resume: {currentResume}
                  </span>
                </div>
              </div>
            </div>
          )}

          <input
            id="jobResume"
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="form-input"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload a resume for this application (PDF, DOC, DOCX - Max 5MB)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary order-1 sm:order-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {loading ? "Saving..." : job ? "Update Job" : "Add Job"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
