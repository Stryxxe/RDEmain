import React, { createContext, useContext, useMemo } from "react";
import { router } from "@inertiajs/react";
import { getUserRole } from "../utils/roleHelpers";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Provider that reads from Inertia router.page to avoid usePage dependency
const AuthProviderInner = ({ children }) => {
    // Read current page props safely from Inertia router
    const page = router?.page;
    const user = page?.props?.auth?.user || null;

    // Get role from user data
    const role = useMemo(() => {
        return getUserRole(user);
    }, [user]);

    const value = {
        user,
        role, // Expose role directly
        loading: false, // Inertia handles loading state
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// Outer provider that wraps the Inertia App
export const AuthProvider = ({ children }) => {
    return <AuthProviderInner>{children}</AuthProviderInner>;
};
