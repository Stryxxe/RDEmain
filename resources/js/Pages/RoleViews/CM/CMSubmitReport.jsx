import React from "react";
import SubmitProgressReport from "../../../Components/SubmitProgressReport";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";

const CMSubmitReport = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Progress Report Submission
                    </h1>
                    <p className="text-gray-600">
                        Submit progress reports for projects in your department
                    </p>
                </div>

                {/* Important Notice */}
                <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mb-8">
                    <h3 className="font-semibold text-gray-800 mb-2">
                        Important Notice
                    </h3>
                    <p className="text-gray-700 text-sm">
                        Fields marked with an asterisk (*) are mandatory and
                        must be filled out before submission.
                    </p>
                </div>

                <SubmitProgressReport />
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
