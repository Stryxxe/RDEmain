import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { getRoleConfig } from '../config/roleConfigs';
import { roleConfigs } from '../config/roleConfigs';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    useEffect(() => {
        if (!user) {
            router.visit('/login');
            return;
        }

        const userRole = user.role?.userRole;

        // Normalize role into a known config key
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

        const config = roleKey ? getRoleConfig(roleKey) : null;

        if (!config) {
            console.warn(`No configuration found for role: ${userRole}`);
            router.visit('/login');
            return;
        }

        // Get the first route from the role configuration as the default route
        const defaultRoute = config.routes.find((route) => route.path === '') || config.routes[0];

        if (!defaultRoute) {
            console.warn(`No default route found for role: ${userRole}`);
            router.visit('/login');
            return;
        }

        // Construct the full path with the normalized role prefix
        const rolePath = `/${roleKey.toLowerCase()}`;
        const fullPath = defaultRoute.path === '' ? rolePath : `${rolePath}/${defaultRoute.path}`;

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

