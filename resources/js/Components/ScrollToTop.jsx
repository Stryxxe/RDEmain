import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function ScrollToTop() {
    useEffect(() => {
        // Scroll to top on initial component mount
        window.scrollTo(0, 0);

        // Listen for Inertia page changes
        const removeListener = router.on('navigate', () => {
            window.scrollTo(0, 0);
        });

        // Cleanup listener on unmount
        return () => {
            removeListener();
        };
    }, []);

    return null;
}
