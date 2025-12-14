import React from 'react';

const ResearchTable = ({ researchData }) => {
  const getStatusClass = (status) => {
    return status === 'On-going' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-[80px_1fr_200px_150px] p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
        <div>No.</div>
        <div>Research Title</div>
        <div>Author</div>
        <div>Status</div>
      </div>
      <div className="flex flex-col">
        {researchData.map((research, index) => (
          <div key={index} className="grid grid-cols-[80px_1fr_200px_150px] p-4 border-b border-gray-100 items-center hover:bg-gray-50">
            <div className="text-gray-700">{research.no}</div>
            <div className="text-gray-700">{research.title}</div>
            <div className="text-gray-700">{research.author}</div>
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusClass(research.status)}`}>
                {research.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchTable; 