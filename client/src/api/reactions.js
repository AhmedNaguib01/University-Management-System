import client from "./client";

export const getReactions = async (postId) => {
  const response = await client.get(`/reactions?postId=${postId}`);
  return response.data;
};

export const upsertReaction = async (postId, type) => {
  const response = await client.post("/reactions", { postId, type,});
  return response.data;
};

export const deleteReaction = async (postId) => {
  const response = await client.delete(`/reactions/${postId}`);
  return response.data;
};
