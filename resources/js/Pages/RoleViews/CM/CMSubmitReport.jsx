import React, { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import SubmitProgressReport from "../../../Components/SubmitProgressReport";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";

const CMSubmitReport = () => {
    const { url } = usePage();

    // Auto-read proposalID from query string if provided (no UI field shown)
    const proposalIdFromQuery = useMemo(() => {
        try {
            const search = url?.split("?")[1];
            if (!search) return null;
            const params = new URLSearchParams(search);
            const value = params.get("proposalID") || params.get("proposalId");
            if (!value) return null;
            const num = Number(value);
            return Number.isNaN(num) ? null : num;
        } catch (e) {
            return null;
        }
    }, [url]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Submit Progress Report
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Submit progress reports for projects in your department
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {/* Important Notice */}
                <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">
                        Important Notice
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                        Fields marked with an asterisk (*) are mandatory and must be filled out before submission.
                    </p>
                </div>

                <SubmitProgressReport
                    proposalID={proposalIdFromQuery}
                    redirectUrl="/cm/progress-report"
                />
            </div>
        </div>
    );
};

CMSubmitReport.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
    </AppLayout>
);

export default CMSubmitReport;
