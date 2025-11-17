import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { getRoleConfig } from "../../config/roleConfigs";
import { getUserRole } from "../../utils/roleHelpers";
import {
    Search,
    FileText,
    BarChart3,
    Upload,
    Folder,
    Home,
    Bell,
    MessageCircle,
    FileCheck,
    Users,
    Settings,
    BarChart,
    UserCircle,
} from "lucide-react";

const RoleBasedNavigation = ({ role: propRole, className = "" }) => {
    const { url, props } = usePage();
    const user = props?.auth?.user;
    const flash = props?.flash || {};

    // Use prop role if provided, otherwise get from user/flash data
    const role = propRole || getUserRole(user, flash);

    // Memoize role normalization to prevent string comparisons on every render
    const normalizedRole = useMemo(() => {
        if (role === "Administrator") {
            return "Admin";
        } else if (role === "OSUORU") {
            return "OSUORU";
        }
        return role;
    }, [role]);

    // Memoize config lookup to prevent redundant object access
    const config = useMemo(
        () => getRoleConfig(normalizedRole),
        [normalizedRole]
    );

    if (!config || !config.routes) {
        if (process.env.NODE_ENV === "development") {
            console.warn(
                "No navigation config found for role:",
                role,
                "normalized:",
                normalizedRole
            );
        }
        return null;
    }

    // Function to get the appropriate icon for each route
    const getRouteIcon = (label) => {
        switch (label) {
            case "Dashboard":
            case "R&D Initiative Status":
                return <Home className="w-6 h-6" />;
            case "Submit Proposal":
                return <Upload className="w-6 h-6" />;
            case "Tracker":
                return <Search className="w-6 h-6" />;
            case "Projects":
                return <FileCheck className="w-6 h-6" />;
            case "Endorsement":
                return <FileText className="w-6 h-6" />;
            case "Progress Reports":
                return <BarChart3 className="w-6 h-6" />;
            case "Submit Report":
                return <Upload className="w-6 h-6" />;
            case "Resources":
                return <Folder className="w-6 h-6" />;
            case "Notifications":
                return <Bell className="w-6 h-6" />;
            case "Messages":
                return <MessageCircle className="w-6 h-6" />;
            case "Statistics":
                return <BarChart className="w-6 h-6" />;
            case "User Management":
                return <Users className="w-6 h-6" />;
            case "System Settings":
                return <Settings className="w-6 h-6" />;
            case "Reports":
                return <BarChart3 className="w-6 h-6" />;
            case "Profile":
                return <UserCircle className="w-6 h-6" />;
            default:
                return <Home className="w-6 h-6" />;
        }
    };

    // Memoize filtered navigation routes to prevent re-computation on every render
    const navigationRoutes = useMemo(() => {
        return config.routes.filter(
            (route) =>
                route.label &&
                route.label !== "Account" &&
                !route.path.includes(":") && // Exclude parameterized routes like 'proposal/:id'
                !route.hidden // Exclude hidden routes
        );
    }, [config.routes]);

    return (
        <nav className={`flex flex-col ${className}`}>
            {navigationRoutes.map((route) => {
                // Construct the full path with role prefix using the actual role from user
                const rolePath = `/${role.toLowerCase()}`;
                const fullPath =
                    route.path === "" ? rolePath : `${rolePath}/${route.path}`;
                const isActive =
                    url === fullPath ||
                    (route.path === "" &&
                        (url === rolePath || url === `${rolePath}/`));

                return (
                    <Link
                        key={route.path}
                        href={fullPath}
                        className={`flex items-center gap-4 px-6 py-4 transition-colors duration-300 ${
                            isActive
                                ? "bg-white text-gray-900 shadow-md"
                                : "text-white hover:bg-red-700"
                        }`}
                    >
                        {getRouteIcon(route.label)}
                        <span className="font-medium">{route.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default RoleBasedNavigation;
