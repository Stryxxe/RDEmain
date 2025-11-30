import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import RDDLayout from "../../../Components/Layouts/RDDLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";

// Prefer global axios with session config; otherwise configure fallback
const api = window.axios || axios.create({
  baseURL: `${window.location.origin}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

if (!window.axios) {
  const metaToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
  if (metaToken) {
    api.defaults.headers["X-CSRF-TOKEN"] = metaToken;
  }
}

const RDDArchive = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState([]);
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        setLoading(true);
        const res = await api.get("/proposals/rdd-endorsed");
        if (res.data?.success) {
          setProposals(res.data.data || []);
        } else {
          setError(res.data?.message || "Failed to load archive");
        }
      } catch (e) {
        console.error("Error loading RDD archive:", e);
        setError("Error loading archive");
      } finally {
        setLoading(false);
      }
    };
    fetchArchive();
  }, []);

  const researchCenters = useMemo(() => {
    const names = proposals
      .map((p) => p.user?.researchCenter?.name)
      .filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [proposals]);

  const filtered = useMemo(() => {
    let list = proposals;
    if (centerFilter !== "all") {
      list = list.filter(
        (p) => (p.user?.researchCenter?.name || "") === centerFilter
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const title = (p.researchTitle || p.title || "").toLowerCase();
        const propName = (p.user?.fullName || "").toLowerCase();
        const idStr = String(p.proposalID || p.id || "").toLowerCase();
        return (
          title.includes(q) || propName.includes(q) || idStr.includes(q)
        );
      });
    }
    return list;
  }, [proposals, centerFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading archive...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs
          items={[
            { label: "RDD", href: "/rdd" },
            { label: "R&D Initiative", href: "/rdd/review-proposal" },
            { label: "Archive" },
          ]}
        />

        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          RDD Archive
        </h1>
        <p className="text-gray-600 mb-6">
          Proposals endorsed by RDD for monitoring and reference.
        </p>

        <div className="admin-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Center
              </label>
              <select
                value={centerFilter}
                onChange={(e) => {
                  setCenterFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-input"
              >
                <option value="all">All Centers</option>
                {researchCenters.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by title, proponent name, or ID"
                className="admin-input"
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No archived proposals found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Proposal</th>
                    <th>Proponent</th>
                    <th>Research Center</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr key={p.proposalID || p.id} className="hover:bg-gray-50">
                      <td>
                        <div className="text-sm font-medium text-gray-900">
                          {p.researchTitle || p.title || "Untitled"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {p.proposalID || p.id}
                        </div>
                      </td>
                      <td className="text-sm text-gray-900">
                        {p.user?.fullName || `${p.user?.firstName || ""} ${p.user?.lastName || ""}`}
                      </td>
                      <td className="text-sm text-gray-900">
                        {p.user?.researchCenter?.name || "—"}
                      </td>
                      <td>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          RDD Endorsed
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/rdd/proposal/${p.proposalID || p.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              {filtered.length === 0
                ? "No results"
                : `Showing ${start + 1} to ${Math.min(
                    start + ITEMS_PER_PAGE,
                    filtered.length
                  )} of ${filtered.length} results`}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrev}
                className="admin-button"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="admin-button"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};
export default RDDArchive;

// Apply RDD layout consistently like other RDD pages
RDDArchive.layout = (page) => <RDDLayout>{page}</RDDLayout>;
