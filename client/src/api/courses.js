import client from "./client";

export const getAllCourses = async () => {
  const response = await client.get("/courses");
  return response.data;
};

export const getCourseById = async (courseId) => {
  const response = await client.get(`/courses/${courseId}`);
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await client.post("/courses", courseData);
  return response.data;
};

export const updateCourse = async (courseId, data) => {
  const response = await client.put(`/courses/${courseId}`, data);
  return response.data;
};

export const enrollStudent = async (courseId, userId) => {
  const response = await client.post(`/courses/${courseId}/enroll`, {userId,});
  return response.data;
};

export const unenrollStudent = async (courseId, userId) => {
  const response = await client.post(`/courses/${courseId}/unenroll`, {userId, });
  return response.data;
};

export const getEnrolledCourses = async (userId) => {
  const response = await client.get(`/courses/enrolled?userId=${userId}`);
  return response.data;
};
