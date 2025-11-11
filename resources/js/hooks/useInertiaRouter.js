import { router, usePage } from '@inertiajs/react';

/**
 * Hook to get Inertia router utilities
 * Replaces useNavigate from react-router-dom
 */
export const useInertiaRouter = () => {
  return {
    navigate: (url, options = {}) => {
      router.visit(url, options);
    },
    go: (delta) => {
      window.history.go(delta);
    },
    back: () => {
      window.history.back();
    },
    forward: () => {
      window.history.forward();
    },
  };
};

/**
 * Hook to get URL parameters
 * Replaces useParams from react-router-dom
 */
export const useInertiaParams = () => {
  const { url } = usePage();
  
  // Extract parameters from URL
  // e.g., /proponent/tracker/123 -> { id: '123' }
  const extractParams = (pattern, path) => {
    const params = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/').filter(p => p);
    
    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        if (pathParts[index]) {
          params[paramName] = pathParts[index];
        }
      }
    });
    
    return params;
  };
  
  // Try to extract common parameter patterns
  const params = {};
  
  // Extract ID from patterns like /tracker/:id, /proposal/:id, etc.
  const idMatch = url.match(/\/(tracker|proposal|projects)\/([^/]+)/);
  if (idMatch) {
    params.id = idMatch[2];
  }
  
  return params;
};

/**
 * Hook to get current location
 * Replaces useLocation from react-router-dom
 */
export const useInertiaLocation = () => {
  const { url } = usePage();
  
  return {
    pathname: url,
    search: '',
    hash: '',
    state: null,
  };
};

