import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
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

// Provider that listens to Inertia page changes
export const AuthProvider = ({ children, user: initialUser }) => {
    const [user, setUser] = useState(initialUser);

    // Listen to Inertia navigation events to update user
    useEffect(() => {
        const handleNavigate = (event) => {
            const newUser = event.detail.page.props?.auth?.user || null;
            setUser(newUser);
        };

        // Subscribe to navigation events
        const removeListener = router.on("navigate", handleNavigate);

        // Cleanup function - removeListener is returned by router.on()
        return () => {
            if (typeof removeListener === 'function') {
                removeListener();
            }
        };
    }, []);

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
