import React, { createContext, useContext, useMemo } from "react";
import { usePage, router, useForm } from "@inertiajs/react";
import { getUserRole } from "../utils/roleHelpers";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Inner component that can use usePage() hook
const AuthProviderInner = ({ children }) => {
    // Use usePage to get the latest user data from Inertia
    // This ensures the user is always up-to-date after navigation
    const { props } = usePage();
    const user = props?.auth?.user || null;

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
