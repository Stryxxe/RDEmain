/**
 * Safely extract user role from multiple sources
 * Priority: user.role.userRole > flash.userRole > flash.roleName
 */
export const getUserRole = (user, flash = {}) => {
    // First check the user object (standard path)
    if (user?.role?.userRole) {
        return user.role.userRole;
    }
    
    // Fallback to flash data from redirects
    if (flash?.userRole) {
        return flash.userRole;
    }
    
    if (flash?.roleName) {
        return flash.roleName;
    }
    
    return null;
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user, roleName, flash = {}) => {
    const userRole = getUserRole(user, flash);
    
    if (Array.isArray(roleName)) {
        return roleName.includes(userRole);
    }
    
    return userRole === roleName;
};

/**
 * Check if user is admin (supports both "Admin" and "Administrator")
 */
export const isAdmin = (user, flash = {}) => {
    return hasRole(user, ['Admin', 'Administrator'], flash);
};

/**
 * Normalize role name for routing (lowercase conversion + special mappings)
 */
export const normalizeRoleForRoute = (role) => {
    if (!role) return null;
    
    const roleMap = {
        'Administrator': 'admin',
        'Admin': 'admin',
        'RDD': 'rdd',
        'CM': 'cm',
        'Proponent': 'proponent',
        'OP': 'op',
        'OSUORU': 'osuur',
        'OSUUR': 'osuur',
        'Reviewer': 'reviewer',
    };
    
    return roleMap[role] || role.toLowerCase();
};
