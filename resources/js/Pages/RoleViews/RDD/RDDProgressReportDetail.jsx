import React, { useState, useEffect } from 'react';
import { useRouteParams } from '../../../Components/RoleBased/InertiaRoleRouter';
import { router } from '@inertiajs/react';
import { FaArrowLeft } from 'react-icons/fa';
import rddService from '../../../services/rddService';
import PDFViewer from '../../../Components/PDFViewer';

const RDDProgressReportDetail = () => {
  const { id } = useRouteParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchProgressReport();
    }
  }, [id]);

  const fetchProgressReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getProgressReportById(id);
      if (response.success) {
        setReport(response.data);
      } else {
        setError('Failed to fetch progress report');
      }
    } catch (err) {
      console.error('Error fetching progress report:', err);
      setError('Error loading progress report');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.visit('/rdd/progress-report');
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading progress report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error || 'Progress report not found'}</p>
            <button 
              onClick={fetchProgressReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform report data to match reference format
  const division = report.proposal?.user?.department?.name || 'Unassigned Department';
  const divisionId = `RC-${String(report.reportID).padStart(3, '0')}`;
  const dateSubmitted = report.submittedAt 
    ? new Date(report.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not specified';

  // Get PDF path from report files
  const pdfPath = report.files && report.files.length > 0
    ? `/storage/${report.files[0].filePath}`
    : '/Balbuena_Concept+Paper.pdf';

  // Get submitted documents list
  const submittedDocuments = report.files && report.files.length > 0
    ? report.files.map(file => file.fileName)
    : ['List of Completed Research'];

  return (
    <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center bg-white text-blue-800 hover:text-blue-900 font-medium text-sm px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <FaArrowLeft className="mr-2" />
          Back to Progress Reports
        </button>
      </div>

      {/* Report Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800">
          {division}
        </h1>

        {/* Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="font-medium text-gray-600">Division ID:</span>
            <span className="ml-2 text-gray-800">{divisionId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Date of Submission:</span>
            <span className="ml-2 text-gray-800">{dateSubmitted}</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-gray-200" />

        {/* Submitted Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Submitted Documents
          </h3>
          <ul className="list-disc list-inside text-sm text-red-600">
            {submittedDocuments.map((doc, index) => (
              <li key={index}>
                <span className="underline cursor-pointer hover:text-red-800 transition">
                  {doc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* PDF Preview */}
      <PDFViewer
        pdfPath={pdfPath}
        title="Document"
      />
    </div>
  );
};

export default RDDProgressReportDetail;




