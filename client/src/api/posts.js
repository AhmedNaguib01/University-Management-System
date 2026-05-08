import client from "./client";

export const getAllPosts = async (courseId = null, type = null) => {
  const params = new URLSearchParams();
  if (courseId) params.append("courseId", courseId);
  if (type) params.append("type", type);

  const queryString = params.toString();
  const url = queryString ? `/posts?${queryString}` : "/posts";

  const response = await client.get(url);
  return response.data;
};

export const getPostById = async (postId) => {
  const response = await client.get(`/posts/${postId}`);
  return response.data;
};

export const createPost = async (postData) => {
  const response = await client.post("/posts", postData);
  return response.data;
};

export const updatePost = async (postId, data) => {
  const response = await client.put(`/posts/${postId}`, data);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await client.delete(`/posts/${postId}`);
  return response.data;
};
