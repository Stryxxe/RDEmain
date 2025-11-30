import React from "react";
import { usePage } from "@inertiajs/react";
import RoleBasedHeader from "../RoleBased/RoleBasedHeader";
import RoleBasedNavigation from "../RoleBased/RoleBasedNavigation";

const RoleBasedLayout = ({ children, roleName, hideSidebar = false }) => {
    // Get user from Inertia props instead of AuthContext
    const { props } = usePage();
    const user = props?.auth?.user;
    const role = user?.role?.userRole || roleName || "User";

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="fixed inset-x-0 top-0 z-30">
                <RoleBasedHeader role={role} />
            </div>

            {/* Sidebar - Hidden when hideSidebar is true */}
            {!hideSidebar && (
                <aside className="hidden md:block fixed top-[92px] left-0 bottom-0 w-64 bg-red-900 text-white z-20 overflow-y-auto">
                    <RoleBasedNavigation role={role} className="py-4" />
                </aside>
            )}

            {/* Main Content - Full width when sidebar is hidden */}
            <main className={`pt-[92px] py-8 ${hideSidebar ? '' : 'md:pl-64'}`}>
                <div className={hideSidebar ? '' : 'px-4 sm:px-6 lg:px-8'}>{children}</div>
            </main>
        </div>
    );
};

export default RoleBasedLayout;
