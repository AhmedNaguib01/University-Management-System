import apiClient from "./client";

// Get all chats for current user
export const getAllChats = async () => {
  const response = await apiClient.get("/chats");
  return response.data;
};

// Get chat by ID
export const getChatById = async (chatId) => {
  const response = await apiClient.get(`/chats/${chatId}`);
  return response.data;
};

// Create or get existing chat
export const createChat = async (user2Id) => {
  const response = await apiClient.post("/chats", { user2Id });
  return response.data;
};
