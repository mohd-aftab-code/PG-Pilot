// Auth utility functions
export const setAuthToken = (token) => {
  // Token is handled via cookies on backend
  // This is just a placeholder for any client-side token handling
};

export const clearAuth = () => {
  // Clear any client-side auth data
  localStorage.removeItem('user');
  localStorage.removeItem('pg_id');
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
  if (user.pg_id) {
    localStorage.setItem('pg_id', user.pg_id);
  }
};

export const getStoredPgId = () => {
  return localStorage.getItem('pg_id');
};

