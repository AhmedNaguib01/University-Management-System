import apiClient from "./client";

// Get user profile by ID
export const getUserProfile = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
  const response = await apiClient.put(`/users/${userId}`, data);
  return response.data;
};

// Get user posts
export const getUserPosts = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/posts`);
  return response.data;
};

// Get user courses
export const getUserCourses = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/courses`);
  return response.data;
};

// Search users
export const searchUsers = async (query) => {
  const response = await apiClient.get("/users/search", { params: { query },});
  return response.data;
};

// Get instructor report (top contributors leaderboard)
export const getInstructorReport = async () => {
  const response = await apiClient.get("/users/report");
  return response.data;
};

// Get instructor report 2 (course engagement analytics)
export const getInstructorReport2 = async () => {
  const response = await apiClient.get("/users/report2");
  return response.data;
};

// Get instructor report 3 (reaction distribution analysis)
export const getInstructorReport3 = async () => {
  const response = await apiClient.get("/users/report3");
  return response.data;
};

// Get instructor report 4 (instructor course performance)
export const getInstructorReport4 = async () => {
  const response = await apiClient.get("/users/report4");
  return response.data;
};
