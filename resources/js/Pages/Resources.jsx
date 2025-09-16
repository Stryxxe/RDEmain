import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

const Resources = () => {
  const resources = [
    {
      title: 'Research Proposal Guidelines',
      description: 'Complete guidelines for submitting research proposals',
      type: 'PDF',
      size: '2.3 MB',
      downloadUrl: '#'
    },
    {
      title: 'Budget Template',
      description: 'Excel template for proposal budget planning',
      type: 'XLSX',
      size: '156 KB',
      downloadUrl: '#'
    },
    {
      title: 'Ethics Review Form',
      description: 'Required form for research involving human subjects',
      type: 'PDF',
      size: '1.8 MB',
      downloadUrl: '#'
    },
    {
      title: 'Research Center Directory',
      description: 'List of available research centers and their specializations',
      type: 'PDF',
      size: '945 KB',
      downloadUrl: '#'
    },
    {
      title: 'DOST SPs Reference',
      description: 'Detailed information about DOST Strategic Programs',
      type: 'PDF',
      size: '3.1 MB',
      downloadUrl: '#'
    },
    {
      title: 'SDG Mapping Guide',
      description: 'Guide for mapping research to Sustainable Development Goals',
      type: 'PDF',
      size: '1.2 MB',
      downloadUrl: '#'
    }
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return 'text-red-500';
      case 'XLSX':
        return 'text-green-500';
      case 'DOCX':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
          <p className="text-gray-600">Download forms, templates, and guidelines for research proposals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className={`w-5 h-5 ${getFileIcon(resource.type)}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                    <p className="text-sm text-gray-500">{resource.type} • {resource.size}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 flex-grow">{resource.description}</p>
              
              <div className="flex gap-2 mt-auto">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                  <Download size={16} />
                  Download
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Resources Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Research Ethics</h3>
              <p className="text-blue-700 text-sm mb-4">
                Learn about ethical considerations in research and how to ensure your proposal meets all requirements.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Learn More →
              </a>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Funding Opportunities</h3>
              <p className="text-green-700 text-sm mb-4">
                Discover additional funding sources and grant opportunities for your research projects.
              </p>
              <a href="#" className="text-green-600 hover:text-green-800 text-sm font-medium">
                Explore →
              </a>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Resources;
