import apiClient from "./client";
import { setSession } from "./session";

// Register new user
export const register = async (name, email, password, level = "", role = "student") => {
  const response = await apiClient.post("/users/register", {name, email, password, level, role,});
  if (response.data.token && response.data.user)
    setSession(response.data.user, response.data.token);
  return response.data;
};

// Login user
export const login = async (email, password) => {
  const response = await apiClient.post("/users/login", {email, password,});
  if (response.data.token && response.data.user) 
    setSession(response.data.user, response.data.token);
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await apiClient.get("/users/me");
  return response.data.user;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await apiClient.post("/users/forgot-password", { email });
  return response.data;
};

// Reset password
export const resetPassword = async (token, password) => {
  const response = await apiClient.post("/users/reset-password", { token, password });
  return response.data;
};
