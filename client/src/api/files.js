import apiClient from "./client";

// Upload file
export const uploadFile = async (file, courseId = null) => {
  const formData = new FormData();
  formData.append("file", file);
  if (courseId) formData.append("courseId", courseId);
  
  const response = await apiClient.post("/files", formData, {
    headers: { "Content-Type": "multipart/form-data",},});
  return response.data;
};

// Get file URL
export const getFileUrl = (fileId) => {
  return `${ process.env.REACT_APP_API_URL || "http://localhost:8000/api" }/files/${fileId}`;
};

// Download file
export const downloadFile = async (fileId) => {
  const response = await apiClient.get(`/files/${fileId}`, { responseType: "blob", });
  return response.data;
};
