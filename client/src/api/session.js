const SESSION_KEY = "eduverse_session";

// Get session from localStorage
export const getSession = () => {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) 
      return JSON.parse(session);
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

// Set session in localStorage
export const setSession = (user, token) => {
  try {
    const session = { user, token, timestamp: new Date().toISOString(), };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Error setting session:", error);
  }
};

// Clear session from localStorage
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Error clearing session:", error);
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return getSession() !== null;
};

// Get current user
export const getCurrentUser = () => {
  const session = getSession();
  return session ? session.user : null;
};

// Get auth token
export const getToken = () => {
  const session = getSession();
  return session ? session.token : null;
};

// Update session with new user data
export const updateSession = (updates) => {
  try {
    const session = getSession();
    if (session) {
      const updatedSession = {
        ...session,
        ...updates,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    }
  } catch (error) {
    console.error("Error updating session:", error);
  }
};
