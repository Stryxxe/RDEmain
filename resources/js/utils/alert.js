/**
 * Custom alert function that replaces browser alert() with a styled modal
 * @param {string} message - The message to display
 * @param {string} title - Optional title (defaults to site name)
 * @param {number} autoClose - Optional auto-close duration in milliseconds (if 0 or null, requires OK button)
 * @returns {Promise<void>} - Resolves when user clicks OK or auto-closes
 */
export const customAlert = async (message, title = null, autoClose = null) => {
  // Lazy load React components only when needed
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const SimpleAlert = (await import('../Components/SimpleAlert')).default;

  return new Promise((resolve) => {
    // Create a container div for the alert
    const container = document.createElement('div');
    container.id = 'custom-alert-container';
    document.body.appendChild(container);

    const root = createRoot(container);

    const handleClose = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      resolve();
    };

    root.render(
      React.createElement(SimpleAlert, {
        message: message,
        title: title,
        onClose: handleClose,
        autoClose: autoClose
      })
    );
  });
};

// Replace window.alert with custom alert
if (typeof window !== 'undefined') {
  window.customAlert = customAlert;
}

export default customAlert;

