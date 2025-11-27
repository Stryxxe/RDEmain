import { useMemo } from "react";
import { usePage } from "@inertiajs/react";

/**
 * Derives simple route parameters from either Inertia props or the current URL.
 * Currently only the `id` param is needed by the detail pages, but the helper
 * returns a generic object for future extensibility.
 */
export const useRouteParams = () => {
    const { props = {}, url = "" } = usePage();

    return useMemo(() => {
        const params = {};

        // Prefer explicit props passed from the server (e.g., Route::get(... ['id' => $id]))
        if (props?.id) {
            params.id = props.id;
            return params;
        }

        if (props?.routeParams?.id) {
            params.id = props.routeParams.id;
            return params;
        }

        // Fallback: parse the last segment of the URL (works for /tracker/:id, /proposal/:id, etc.)
        const path =
            typeof window !== "undefined" ? window.location.pathname : url || "";
        const segments = path.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];

        if (lastSegment) {
            params.id = lastSegment.split("?")[0];
        }

        return params;
    }, [props, url]);
};

/**
 * Placeholder component so existing imports keep working. Role-based navigation
 * is handled directly by Inertia routes, so nothing needs to render here yet.
 */
const InertiaRoleRouter = () => null;

export default InertiaRoleRouter;

