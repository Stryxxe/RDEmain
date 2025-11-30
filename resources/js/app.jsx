import "../css/app.css";
import "./bootstrap";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import AppLayout from "./Components/Layouts/AppLayout";
import ScrollToTop from "./Components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";

// Update CSRF token meta tag after each Inertia navigation
// This ensures the token is always fresh after login/logout
router.on("navigate", (event) => {
    // Get the new CSRF token from the page props if available
    const csrfToken = event.detail.page.props?.csrf_token;

    if (csrfToken) {
        // Update the meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            metaTag.setAttribute("content", csrfToken);
        }
    }
});

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AuthProvider>
                <ScrollToTop />
                <App {...props} />
            </AuthProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
