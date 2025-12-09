import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { getRoleConfig } from '../config/roleConfigs';
import { roleConfigs } from '../config/roleConfigs';

// Use a module-level variable to persist across component remounts
let redirectInProgress = false;

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Prevent multiple redirects (both ref and module-level check)
        if (hasRedirected.current || redirectInProgress) {
            return;
        }

        if (!user) {
            router.visit('/login');
            return;
        }

        const userRole = user.role?.userRole;
        const currentPath = window.location.pathname;

        // Debug logging
        console.log('Dashboard component:', {
            userRole,
            currentPath,
            userID: user?.userID
        });

        // Normalize role into a known config key FIRST (needed for wrong path detection)
        let roleKey = null;
        if (userRole && roleConfigs[userRole]) {
            roleKey = userRole;
        } else if (userRole) {
            // Try matching against roleName/displayName
            const entry = Object.entries(roleConfigs).find(
                ([, cfg]) => cfg.roleName === userRole || cfg.displayName === userRole
            );
            if (entry) {
                roleKey = entry[0];
            }
        }

        // CRITICAL: Only redirect if we're on root or dashboard path
        // If we're on any other path, check if we're on the wrong role path
        if (currentPath !== '/' && currentPath !== '/dashboard') {
            // Check if we're on the wrong role path - if so, redirect to correct one
            if (roleKey && userRole) {
                const correctPath = `/${roleKey.toLowerCase()}`;
                const isOnWrongPath = !currentPath.startsWith(correctPath);
                
                if (isOnWrongPath) {
                    // We're on the wrong role path, redirect to correct one
                    console.log(`On wrong role path: ${currentPath}, redirecting to correct path: ${correctPath} for role: ${userRole}`);
                    hasRedirected.current = true;
                    redirectInProgress = true;
                    setTimeout(() => {
                        redirectInProgress = false;
                    }, 1000);
                    router.visit(correctPath);
                    return;
                }
            }
            
            console.log(`Dashboard component rendered on non-root path: ${currentPath}, skipping all redirect logic`);
            hasRedirected.current = true;
            return;
        }

        // Double-check: if we're on a role-specific path, don't redirect
        const rolePaths = Object.keys(roleConfigs).map(key => `/${key.toLowerCase()}`);
        const isOnRolePath = rolePaths.some(path => 
            currentPath === path || 
            currentPath === `${path}/` ||
            currentPath.startsWith(`${path}/`)
        );

        if (isOnRolePath) {
            console.log(`Already on a role-specific path: ${currentPath}, skipping redirect`);
            hasRedirected.current = true;
            return;
        }

        const config = roleKey ? getRoleConfig(roleKey) : null;

        if (!config) {
            console.warn(`No configuration found for role: ${userRole}`);
            router.visit('/login');
            return;
        }

        // Construct the full path with the normalized role prefix
        const rolePath = `/${roleKey.toLowerCase()}`;
        
        // Check if we're already on the correct role path - if so, don't redirect
        // Also check if we're on a sub-route of the role path
        if (currentPath === rolePath || 
            currentPath === `${rolePath}/` ||
            currentPath.startsWith(`${rolePath}/`)) {
            console.log(`Already on correct path: ${currentPath}`);
            hasRedirected.current = true;
            return;
        }

        // Get the first route from the role configuration as the default route
        const defaultRoute = config.routes.find((route) => route.path === '') || config.routes[0];

        if (!defaultRoute) {
            console.warn(`No default route found for role: ${userRole}`);
            router.visit('/login');
            hasRedirected.current = true;
            return;
        }

        const fullPath = defaultRoute.path === '' ? rolePath : `${rolePath}/${defaultRoute.path}`;

        // Mark as redirected before navigating (both ref and module-level)
        hasRedirected.current = true;
        redirectInProgress = true;
        
        // Reset the module-level flag after a short delay to allow navigation
        setTimeout(() => {
            redirectInProgress = false;
        }, 1000);

        router.visit(fullPath);
    }, [user]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
}



