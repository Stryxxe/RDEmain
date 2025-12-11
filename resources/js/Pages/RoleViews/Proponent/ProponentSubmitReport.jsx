import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { usePage } from "@inertiajs/react";
import SubmitProgressReport from "../../../Components/SubmitProgressReport";
import SearchableSelect from "../../../Components/SearchableSelect";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import axios from "axios";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const ProponentSubmitReport = () => {
    const { user: authUser } = useAuth();
    const { props } = usePage();
    const user = authUser || props?.auth?.user;
    const [proposals, setProposals] = useState([]);
    const [selectedProposalID, setSelectedProposalID] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProposals = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axiosInstance.get("/proposals", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });

                if (response.data.success) {
                    setProposals(response.data.data || []);
                } else {
                    setError("Failed to load proposals");
                }
            } catch (err) {
                console.error("Error fetching proposals:", err);
                setError("Error loading proposals. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        // Wait a bit for user to be available
        const timer = setTimeout(() => {
            fetchProposals();
        }, 100);

        return () => clearTimeout(timer);
    }, [user]);

    // Format proposals for SearchableSelect
    const proposalOptions = proposals.map((proposal) => ({
        proposalID: proposal.proposalID,
        label: `${proposal.researchTitle} (PRO-${proposal.proposalID.toString().padStart(6, "0")})`,
        title: proposal.researchTitle,
    }));

    const handleSuccess = () => {
        // Optionally refresh proposals or show success message
        setSelectedProposalID(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Submit Progress Report
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Submit progress reports for your projects
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {loading ? (
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">
                                    Loading your projects...
                                </p>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">
                                You don't have any projects yet.
                            </p>
                            <p className="text-sm text-gray-500">
                                Submit a proposal first to be able to submit progress reports.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Project Selection */}
                        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                            <SearchableSelect
                                options={proposalOptions}
                                value={selectedProposalID}
                                onChange={setSelectedProposalID}
                                placeholder="Select a project..."
                                label="Select Project"
                                required={true}
                                getOptionLabel={(option) => option.label}
                                getOptionValue={(option) => option.proposalID}
                            />
                        </div>

                        {/* Submit Progress Report Form */}
                        {selectedProposalID ? (
                            <SubmitProgressReport
                                key={selectedProposalID}
                                proposalID={selectedProposalID}
                                onSuccess={handleSuccess}
                            />
                        ) : (
                            <div className="bg-white rounded-lg shadow-lg p-8">
                                <div className="text-center py-8 text-gray-500">
                                    Please select a project above to submit a progress report.
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

ProponentSubmitReport.layout = (page) => (
    <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
);

export default ProponentSubmitReport;


