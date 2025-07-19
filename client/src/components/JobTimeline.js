import React from "react";

const JobTimeline = ({ job, onClose }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "Applied":
        return "📝";
      case "Interview":
        return "💼";
      case "Offer":
        return "🎉";
      case "Rejected":
        return "❌";
      default:
        return "📋";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-500";
      case "Interview":
        return "bg-yellow-500";
      case "Offer":
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">
                {job.jobRole}
              </h2>
              <p className="text-secondary-600">{job.companyName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 text-2xl font-bold cursor-pointer transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6 text-secondary-800">
            Application Timeline
          </h3>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-secondary-200"></div>

            {/* Timeline events */}
            <div className="space-y-6">
              {job.statusHistory?.map((event, index) => (
                <div key={index} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full ${getStatusColor(
                      event.status
                    )} flex items-center justify-center text-white text-lg flex-shrink-0`}
                  >
                    {getStatusIcon(event.status)}
                  </div>

                  {/* Content */}
                  <div className="ml-6 flex-1">
                    <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-secondary-900">
                          {event.status}
                        </h4>
                        <span className="text-sm text-secondary-500">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-secondary-600 text-sm">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(!job.statusHistory || job.statusHistory.length === 0) && (
            <div className="text-center py-8">
              <p className="text-secondary-500">No status history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobTimeline;
