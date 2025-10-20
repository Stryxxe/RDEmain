import React, { useState, useEffect } from 'react';
import { BiUpload, BiFile, BiCalendar, BiCheck } from 'react-icons/bi';
import rddService from '../../../services/rddService';

const RDDSubmitReport = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [reportType, setReportType] = useState('Quarterly');
  const [reportPeriod, setReportPeriod] = useState('Q1 2025');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    progress: '',
    achievements: '',
    challenges: '',
    budgetUtilized: '',
    nextMilestone: '',
    additionalNotes: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getUserProjects();
      if (response.success) {
        setProjects(response.data);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'Quarterly', label: 'Quarterly Progress Report' },
    { value: 'Annual', label: 'Annual Progress Report' },
    { value: 'Final', label: 'Final Project Report' },
    { value: 'Interim', label: 'Interim Report' }
  ];

  const reportPeriods = [
    'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025',
    '2025', '2024', '2023'
  ];

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Report submitted:', {
      project: selectedProject,
      reportType,
      reportPeriod,
      data: reportData,
      files: uploadedFiles
    });
    alert('Report submitted successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchProjects}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Submit Progress Report
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Submit progress reports for your research projects
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Project Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Choose a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title} - {project.author}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type and Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type *
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Period *
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                {reportPeriods.map(period => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Percentage *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reportData.progress}
                  onChange={(e) => handleInputChange('progress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter progress percentage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Utilized *
                </label>
                <input
                  type="text"
                  value={reportData.budgetUtilized}
                  onChange={(e) => handleInputChange('budgetUtilized', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., ₱150,000"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Achievements *
              </label>
              <textarea
                value={reportData.achievements}
                onChange={(e) => handleInputChange('achievements', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe the key achievements during this period..."
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenges and Issues
              </label>
              <textarea
                value={reportData.challenges}
                onChange={(e) => handleInputChange('challenges', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe any challenges or issues encountered..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Milestone *
              </label>
              <input
                type="text"
                value={reportData.nextMilestone}
                onChange={(e) => handleInputChange('nextMilestone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe the next milestone or objective..."
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={reportData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Any additional information or comments..."
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <BiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600 mb-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="font-medium text-red-600 hover:text-red-500">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
              </div>
              <p className="text-xs text-gray-500">
                PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX files up to 10MB each
              </p>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <BiFile className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              <BiCheck className="text-lg" />
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RDDSubmitReport;
