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

export const AuthProvider = ({ children, user: initialUser }) => {
    // Use initialUser directly - it's passed from app.jsx and updated by Inertia
    // We can't use usePage() here because AuthProvider is outside the Inertia component tree
    const user = initialUser;

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
