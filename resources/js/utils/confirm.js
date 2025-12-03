/**
 * Custom confirm function that replaces browser confirm() with a styled modal
 * @param {string} message - The message to display
 * @param {string} title - Optional title (defaults to "Confirm Action")
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export const customConfirm = async (message, title = null) => {
  // Lazy load React components only when needed
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const SimpleConfirm = (await import('../Components/SimpleConfirm')).default;

  return new Promise((resolve) => {
    // Create a container div for the confirm dialog
    const container = document.createElement('div');
    container.id = 'custom-confirm-container';
    document.body.appendChild(container);

    const root = createRoot(container);

    const handleConfirm = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      resolve(true);
    };

    const handleCancel = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      resolve(false);
    };

    root.render(
      React.createElement(SimpleConfirm, {
        message: message,
        title: title,
        onConfirm: handleConfirm,
        onCancel: handleCancel
      })
    );
  });
};

// Replace window.confirm with custom confirm
if (typeof window !== 'undefined') {
  window.customConfirm = customConfirm;
}

export default customConfirm;

