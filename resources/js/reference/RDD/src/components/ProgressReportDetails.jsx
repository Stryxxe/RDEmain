import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import PDFViewer from './PDFViewer';

const ProgressReportDetails = ({ report, onBack }) => {
  const pdfPath = '/Balbuena_Concept+Paper.pdf';

  return (
    <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={onBack}
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
          {report.division}
        </h1>

        {/* Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="font-medium text-gray-600">Division ID:</span>
            <span className="ml-2 text-gray-800">{report.divisionId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Date of Submission:</span>
            <span className="ml-2 text-gray-800">{report.dateSubmitted}</span>
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
            <li>
                              <span className="underline cursor-pointer hover:text-red-800 transition">
                List of Completed Research
              </span>
            </li>
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

export default ProgressReportDetails; 