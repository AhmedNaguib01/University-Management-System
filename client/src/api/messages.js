import apiClient from "./client";

// Get messages for a chat
export const getMessages = async (chatId) => {
  const response = await apiClient.get("/messages", { params: { chatId }, });
  return response.data;
};

// Send a message
export const sendMessage = async ( chatId, receiverId, text, attachmentsId = [], replyTo = null) => {
  const response = await apiClient.post("/messages", { chatId, receiverId, text, attachmentsId, replyTo, });
  return response.data;
};

// Delete a message
export const deleteMessage = async (messageId) => {
  const response = await apiClient.delete(`/messages/${messageId}`);
  return response.data;
};
