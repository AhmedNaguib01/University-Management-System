import client from "./client";

export const getComments = async (postId) => {
  const response = await client.get(`/comments?postId=${postId}`);
  return response.data;
};

export const createComment = async (postId, body, parentCommentId = null) => {
  const response = await client.post("/comments", { postId,body, parentCommentId,});
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await client.delete(`/comments/${commentId}`);
  return response.data;
};
