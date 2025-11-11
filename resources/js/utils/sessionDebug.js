// Debug utility to check session cookie
export const checkSessionCookie = () => {
  console.log('=== Session Cookie Debug ===');
  console.log('Current URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  
  // Check if cookies are accessible (they might be HttpOnly)
  console.log('document.cookie:', document.cookie);
  
  // Check axios configuration
  if (window.axios) {
    console.log('Axios baseURL:', window.axios.defaults.baseURL);
    console.log('Axios withCredentials:', window.axios.defaults.withCredentials);
  }
  
  // Try to make a test request to see what headers are sent
  if (window.axios) {
    window.axios.get('/user', { withCredentials: true })
      .then(response => {
        console.log('✅ Session cookie is working!', response.data);
      })
      .catch(error => {
        console.error('❌ Session cookie issue:', error.response?.status, error.response?.data);
        console.log('Response headers:', error.response?.headers);
      });
  }
};

// Call this function in browser console to debug
window.checkSessionCookie = checkSessionCookie;

