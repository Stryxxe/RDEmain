import React from "react";
import SubmitProgressReport from "../../../Components/SubmitProgressReport";
import RDDLayout from "../../../Components/Layouts/RDDLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";

const RDDSubmitReport = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Submit Progress Report
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Submit progress reports for your research projects
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                <SubmitProgressReport />
            </div>
        </div>
    );
};

RDDSubmitReport.layout = (page) => (
    <AppLayout>
        <RDDLayout>
            {page}
        </RDDLayout>
    </AppLayout>
);

export default RDDSubmitReport;
