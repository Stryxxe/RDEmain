import React, { useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import RoleBasedHeader from "../RoleBased/RoleBasedHeader";
import RoleBasedNavigation from "../RoleBased/RoleBasedNavigation";

const RoleBasedLayout = ({ children, roleName }) => {
    const { role } = useAuth(); // Now comes directly from AuthContext

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="fixed inset-x-0 top-0 z-30">
                <RoleBasedHeader role={role} />
            </div>

            {/* Sidebar */}
            <aside className="hidden md:block fixed top-20 left-0 bottom-0 w-64 bg-red-900 text-white z-20 overflow-y-auto">
                <RoleBasedNavigation role={role} className="py-4" />
            </aside>

            {/* Main Content */}
            <main className="pt-20 md:pl-64 py-8">
                <div className="px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
        </div>
    );
};

export default RoleBasedLayout;
