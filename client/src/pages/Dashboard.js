import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import JobForm from '../components/JobForm';
import JobCard from '../components/JobCard';
import JobTimeline from '../components/JobTimeline';
import api from '../utils/api';

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingJob, setEditingJob] = useState(null);
  const [showTimeline, setShowTimeline] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  useEffect(() => {
    const filterJobs = () => {
      if (!statusFilter) {
        setFilteredJobs(jobs);
      } else {
        setFilteredJobs(jobs.filter(job => job.currentStatus === statusFilter));
      }
    };
    
    filterJobs();
  }, [jobs, statusFilter]);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
    } catch (error) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/jobs/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleJobAdded = (newJob) => {
    if (editingJob) {
      setJobs(jobs.map(job => job._id === newJob._id ? newJob : job));
      setEditingJob(null);
    } else {
      setJobs([newJob, ...jobs]);
    }
    fetchStats();
  };

  const handleEdit = (job) => {
    setEditingJob(job);
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        await api.delete(`/jobs/${jobId}`);
        setJobs(jobs.filter(job => job._id !== jobId));
        fetchStats();
      } catch (error) {
        setError('Failed to delete job');
      }
    }
  };

  const handleViewTimeline = (job) => {
    setShowTimeline(job);
  };

  const getStatsByStatus = (status) => {
    return stats.statusBreakdown?.find(stat => stat._id === status)?.count || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Total Applications</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.total || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Applied</h3>
            <p className="text-3xl font-bold text-blue-600">{getStatsByStatus('Applied')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Interviews</h3>
            <p className="text-3xl font-bold text-yellow-600">{getStatsByStatus('Interview')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Offers</h3>
            <p className="text-3xl font-bold text-green-600">{getStatsByStatus('Offer')}</p>
          </div>
        </div>

        {/* Job Form */}
        <div className="mb-8">
          <JobForm
            onJobAdded={handleJobAdded}
            editingJob={editingJob}
            onCancel={handleCancelEdit}
          />
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewTimeline={handleViewTimeline}
            />
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {statusFilter ? `No jobs found with status "${statusFilter}"` : 'No job applications yet. Add your first application above!'}
            </p>
          </div>
        )}

        {/* Timeline Modal */}
        {showTimeline && (
          <JobTimeline
            job={showTimeline}
            onClose={() => setShowTimeline(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
