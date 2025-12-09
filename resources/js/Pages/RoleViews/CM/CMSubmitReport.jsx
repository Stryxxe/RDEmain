import React from "react";
import SubmitProgressReport from "../../../Components/SubmitProgressReport";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";

const CMSubmitReport = () => {
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
