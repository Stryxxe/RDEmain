import React from "react";

const CoAuthorsCard = ({ proposal }) => {
  if (!proposal || !proposal.proponents) return null;
  const submitterId = proposal.user?.userID;
  const submitter = proposal.proponents.find(p => p.userID === submitterId) || proposal.user;
  const others = proposal.proponents.filter(p => p.userID !== submitterId);
  const allAuthors = submitter ? [submitter, ...others] : others;
  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-4M9 20H4v-2a3 3 0 013-3h4m4-6a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Authors
      </h3>
      <p className="text-sm text-gray-500 mb-4">All proponents collaborating on this proposal.</p>
      {allAuthors.length === 0 ? (
        <p className="text-sm text-gray-400">No authors listed.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allAuthors.map((p, idx) => (
            <div key={p.userID} className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex flex-col">
                <span className="font-medium text-red-900">{p.firstName} {p.lastName}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {p.role && <span className="text-xs text-red-600/70">{p.role?.userRole || p.role}</span>}
                  {p.projectRole && (
                    <>
                      {p.role && <span className="text-xs text-red-600/40">•</span>}
                      <span className="text-xs font-medium text-red-700">{p.projectRole.roleName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoAuthorsCard;
