import React, { useState } from "react";
import api from "../utils/api";

const JobCard = ({ job, onEdit, onDelete }) => {
  const [showTimeline, setShowTimeline] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "applied":
        return "status-applied";
      case "interviewing":
        return "status-interviewing";
      case "offered":
        return "status-offered";
      case "rejected":
        return "status-rejected";
      default:
        return "status-applied";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "applied":
        return "📝";
      case "interviewing":
        return "💼";
      case "offered":
        return "🎉";
      case "rejected":
        return "❌";
      default:
        return "📝";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const downloadJobResume = async (filename, originalName) => {
    try {
      const response = await api.get(`/jobs/resume/${filename}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download resume");
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
            {job.jobRole}
          </h3>
          <p className="text-blue-600 font-semibold mb-2">{job.companyName}</p>
        </div>
        <div className={`status-badge ${getStatusColor(job.status)} ml-3`}>
          <span className="mr-1">{getStatusIcon(job.status)}</span>
          <span className="capitalize">{job.status}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {job.location && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">📍</span>
            <span className="text-sm">{job.location}</span>
          </div>
        )}

        {job.salary && (
          <div className="flex items-center text-gray-600">
            <span className="mr-2">💰</span>
            <span className="text-sm">{job.salary}</span>
          </div>
        )}

        <div className="flex items-center text-gray-600">
          <span className="mr-2">📅</span>
          <span className="text-sm">
            Applied: {formatDate(job.appliedDate)}
          </span>
        </div>

        {job.jobDescription && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {job.jobDescription.length > 150
                ? `${job.jobDescription.substring(0, 150)}...`
                : job.jobDescription}
            </p>
          </div>
        )}

        {job.resumeFile && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-blue-600">
                <span className="mr-2">📎</span>
                <span className="text-sm font-medium">Resume attached</span>
              </div>
              <button
                onClick={() =>
                  downloadJobResume(
                    job.resumeFile.filename,
                    job.resumeFile.originalName
                  )
                }
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(job)}
          className="btn btn-secondary btn-sm"
          title="Edit job application"
        >
          <span className="mr-1">✏️</span>
          Edit
        </button>

        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="btn btn-outline btn-sm"
          title="View timeline"
        >
          <span className="mr-1">📊</span>
          Timeline
        </button>

        {job.jobUrl && job.jobUrl.trim() ? (
          <a
            href={
              job.jobUrl.startsWith("http")
                ? job.jobUrl
                : `https://${job.jobUrl}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            title={`View job posting: ${job.jobUrl}`}
            onClick={(e) => {
              // Validate URL before opening
              const url = job.jobUrl.startsWith("http")
                ? job.jobUrl
                : `https://${job.jobUrl}`;
              try {
                new URL(url);
                console.log("Opening job URL:", url);
              } catch (error) {
                e.preventDefault();
                console.error("Invalid job URL:", job.jobUrl, error);
                alert("Invalid job URL. Please check the URL and try again.");
              }
            }}
          >
            <span className="mr-1">🔗</span>
            View Job
          </a>
        ) : (
          <span className="text-xs text-gray-500 px-2 py-1">No job URL</span>
        )}

        <button
          onClick={() => onDelete(job._id)}
          className="btn btn-danger btn-sm"
          title="Delete job application"
        >
          <span className="mr-1">🗑️</span>
          Delete
        </button>
      </div>

      {showTimeline && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Application Timeline
            </h4>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4">
              <div className="relative flex items-start">
                <div className="relative z-10 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                  📝
                </div>
                <div className="ml-6 flex-1">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-lg text-gray-900">
                        Application Submitted
                      </h5>
                      <span className="text-sm text-gray-500">
                        {formatDate(job.appliedDate)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Applied for {job.jobRole} at {job.companyName}
                    </p>
                  </div>
                </div>
              </div>

              {job.status !== "applied" && (
                <div className="relative flex items-start">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold text-lg text-gray-900">
                          Status: {job.status}
                        </h5>
                        <span className="text-sm text-gray-500">Current</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Currently in {job.status} stage
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
