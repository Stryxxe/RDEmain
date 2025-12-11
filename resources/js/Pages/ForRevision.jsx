import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { RefreshCw } from "lucide-react";
import { BiSearch, BiShow } from "react-icons/bi";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import RoleBasedLayout from "../Components/Layouts/RoleBasedLayout";
import Breadcrumbs from "../Components/Breadcrumbs";

const ForRevision = () => {
  const { user } = useAuth();
  const { props } = usePage();
  const currentUser = user || props?.auth?.user;

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("ID");

  // Guard route to proponents only
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role?.userRole !== "Proponent") {
      router.visit("/dashboard");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role?.userRole !== "Proponent") return;
    loadProposals();
  }, [currentUser]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiService.getProposals();

      if (response.success) {
        setProposals(response.data || []);
      } else {
        setError(response.message || "Failed to load proposals for revision");
      }
    } catch (err) {
      console.error("Error loading revision proposals:", err);
      if (err.message?.includes("Unauthenticated")) {
        setError("Your session has expired. Please log in again.");
        setTimeout(() => router.visit("/login"), 1200);
      } else {
        setError("Failed to load proposals for revision. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadProposals();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (proposalId) => {
    router.visit(`/proponent/revision/${proposalId}`);
  };

  const revisionProposals = useMemo(() => {
    return (proposals || []).filter((proposal) => {
      const statusName = (proposal.status?.statusName || "").toLowerCase();
      const statusId = proposal.statusID || proposal.statusId;
      return statusName.includes("revision") || statusId === 4; // 4 = Revisions Required
    });
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return revisionProposals.filter((proposal) => {
      const title = (proposal.researchTitle || proposal.title || "").toLowerCase();
      const author = (proposal.user?.fullName || "").toLowerCase();
      const center = (proposal.matrixOfCompliance?.researchCenter || proposal.researchCenter || "").toLowerCase();
      const id = (proposal.proposalID || proposal.id || "").toString();
      return (
        title.includes(term) ||
        author.includes(term) ||
        center.includes(term) ||
        id.includes(term)
      );
    });
  }, [revisionProposals, searchTerm]);

  const sortedProposals = useMemo(() => {
    return [...filteredProposals].sort((a, b) => {
      switch (sortBy) {
        case "ID":
          return (a.proposalID || a.id || 0) - (b.proposalID || b.id || 0);
        case "Title":
          return (a.researchTitle || a.title || "").localeCompare(b.researchTitle || b.title || "");
        case "Author":
          return (a.user?.fullName || "").localeCompare(b.user?.fullName || "");
        case "Status":
          return (a.status?.statusName || "").localeCompare(b.status?.statusName || "");
        case "Date":
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return (a.proposalID || a.id || 0) - (b.proposalID || b.id || 0);
      }
    });
  }, [filteredProposals, sortBy]);

  const formatDate = (value) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (statusName) => {
    switch (statusName) {
      case "Revisions Required":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "Under Review":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getProgressColor = (statusName) => {
    switch (statusName) {
      case "Revisions Required":
        return "bg-orange-500";
      case "Rejected":
        return "bg-red-500";
      case "Under Review":
        return "bg-blue-500";
      case "Approved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTimelineStages = (statusId) => {
    const stages = [
      { id: 0, name: "Proposal Submitted", status: "pending" },
      { id: 1, name: "College Endorsement", status: "pending" },
      { id: 2, name: "R&D Division", status: "pending" },
      { id: 3, name: "Proposal Review", status: "pending" },
      { id: 4, name: "Ethics Review", status: "pending" },
      { id: 5, name: "OVPRDE", status: "pending" },
      { id: 6, name: "President", status: "pending" },
      { id: 7, name: "OSOURU", status: "pending" },
      { id: 8, name: "Implementation", status: "pending" },
      { id: 9, name: "Monitoring", status: "pending" },
      { id: 10, name: "For Completion", status: "pending" },
    ];

    switch (statusId) {
      case 4: // Revisions Required
        stages[0].status = "completed";
        stages[1].status = "completed";
        stages[2].status = "current";
        break;
      case 6: // Rejected
        stages[0].status = "completed";
        stages[1].status = "completed";
        stages[2].status = "rejected";
        break;
      case 5: // Approved
        stages.forEach((s, idx) => {
          if (idx <= 8) s.status = "completed";
        });
        stages[9].status = "current";
        break;
      default:
        stages[0].status = "current";
    }

    return stages;
  };

  const getProgressPercentage = (proposal) => {
    const timelineStages = getTimelineStages(proposal.statusID || proposal.statusId);
    const completedStages = timelineStages.filter((stage) => stage.status === "completed").length;
    const currentStage = timelineStages.some((stage) => stage.status === "current") ? 1 : 0;
    const rejectedStage = timelineStages.some((stage) => stage.status === "rejected") ? 1 : 0;

    if (rejectedStage) return 0;

    return Math.round(
      ((completedStages + currentStage * 0.5) / timelineStages.length) * 100
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadProposals}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs items={[{ label: "For Revision", href: null }]} />

      <div className="bg-white pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">For Revision</h1>
            <p className="text-lg text-gray-600 mb-6">
              Proposals sent back by the Center Manager. Review the feedback and prepare updates.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh revision list"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Revision Queue</h2>
            <p className="text-gray-600">Proposals needing updates before moving forward</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ID">ID (Oldest First)</option>
              <option value="Title">Title</option>
              <option value="Author">Author</option>
              <option value="Status">Status</option>
              <option value="Date">Date</option>
            </select>
            <span className="text-gray-500">↑</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
          <BiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
            <div>Research Title</div>
            <div>Author & College</div>
            <div>Proposed Funding</div>
            <div className="text-center">Details</div>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedProposals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No proposals require revision</div>
            ) : (
              sortedProposals.map((proposal) => (
                <div
                  key={proposal.proposalID || proposal.id}
                  className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div>
                    <div
                      className="font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleViewDetails(proposal.proposalID || proposal.id)}
                    >
                      {proposal.researchTitle || proposal.title || "Untitled Proposal"}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ID: {proposal.custom_proposal_id || `PRO-${(proposal.proposalID || proposal.id || 0).toString().padStart(6, "0")}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Sent back: {formatDate(proposal.updated_at || proposal.created_at)}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">{proposal.user?.fullName || "Unknown"}</div>
                    <div className="text-sm text-gray-600">
                      {proposal.matrixOfCompliance?.researchCenter || proposal.researchCenter || ""}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900">
                      ₱{proposal.proposedBudget?.toLocaleString() || "0"}
                    </div>
                    <div className="text-sm text-gray-600">Total Budget</div>
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleViewDetails(proposal.proposalID || proposal.id)}
                      className="border border-red-500 text-red-500 bg-white px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors duration-150 flex items-center gap-1"
                    >
                      <BiShow className="text-sm" />
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ForRevision.layout = (page) => (
  <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
);

export default ForRevision;
