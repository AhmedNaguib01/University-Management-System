import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, Avatar, AvatarFallback, Badge } from "../components/ui/display";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/form-elements";
import { ArrowLeft, Users, BookOpen, FileText, Info, Download, Upload, Trash2, Plus, X, Calendar, MapPin, Heart, MessageCircle, Smile, Laugh, Frown, ThumbsUp, Send } from "lucide-react";
import { getSession } from "../api/session";
import { getCourseById, enrollStudent, unenrollStudent, getEnrolledCourses } from "../api/courses";
import { getAllPosts, createPost } from "../api/posts";
import { getComments, createComment } from "../api/comments";
import { getReactions, upsertReaction, deleteReaction } from "../api/reactions";
import { getInitials, formatRelativeTime } from "../lib/utils";
import { getFileUrl } from "../api/files";
import { toast } from "sonner";
import "../styles/course-details.css";

const getAvatarSrc = (item) => {
  if (!item) return null;
  if (item.image && item.image.fileId) return getFileUrl(item.image.fileId);
  if (item.image && item.image.url) return item.image.url;
  if (item.profilePicture) return getFileUrl(item.profilePicture);
  return null;
};

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [postDeadline, setPostDeadline] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [postReactions, setPostReactions] = useState({});
  const [postComments, setPostComments] = useState({});

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      loadCourseData(session.user);
    }

    const refreshInterval = setInterval(() => {
      const currentSession = getSession();
      if (currentSession) {
        loadCourseData(currentSession.user);
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [id]);

  const loadCourseData = async (currentUser) => {
    try {
      setLoading(true);
      const courseData = await getCourseById(id);
      setCourse(courseData);

      if (currentUser && currentUser.role === "instructor") {
        let isTeaching = false;
        if (Array.isArray(courseData.instructorId)) {
          isTeaching = courseData.instructorId.some(
            (instructor) => instructor._id === currentUser._id
          );
        } else if (courseData.instructorId) {
          isTeaching =
            courseData.instructorId._id === currentUser._id ||
            courseData.instructorId === currentUser._id;
        }
        setIsInstructor(isTeaching);
      }

      const postsData = await getAllPosts(id);
      setPosts(postsData);

      if (postsData && postsData.length > 0) {
        for (const post of postsData) {
          loadPostReactions(post._id);
          loadPostComments(post._id);
        }
      }

      if (currentUser) {
        const enrolledCourses = await getEnrolledCourses(currentUser._id);
        setIsEnrolled(enrolledCourses.some((c) => c._id === id));
      }

      await loadFiles();
    } catch (error) {
      console.error("Error loading course:", error);
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/files/course/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getSession().token}`,
          },
        }
      );

      if (response.ok) {
        const filesData = await response.json();
        setFiles(filesData);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      setFiles([]);
    }
  };

  const loadPostReactions = async (postId) => {
    try {
      const data = await getReactions(postId);
      setPostReactions((prev) => ({
        ...prev,
        [postId]: data,
      }));
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const loadPostComments = async (postId) => {
    try {
      const data = await getComments(postId);
      setPostComments((prev) => ({
        ...prev,
        [postId]: data,
      }));
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleReaction = async (postId, type) => {
    try {
      const currentReaction = postReactions[postId]?.userReaction;

      if (currentReaction === type) {
        await deleteReaction(postId);
      } else {
        await upsertReaction(postId, type);
      }

      await loadPostReactions(postId);
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = commentTexts[postId];

    if (!commentText || !commentText.trim()) {
      return;
    }

    try {
      await createComment(postId, commentText);
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      await loadPostComments(postId);
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const toggleComments = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
    }
  };

  const reactionIcons = {
    like: ThumbsUp,
    love: Heart,
    laugh: Laugh,
    shocked: Smile,
    sad: Frown,
  };

  const uploadFiles = async (fileList) => {
    const filesToUpload = Array.from(fileList);

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }
    }

    try {
      setUploading(true);
      const uploadedFiles = [];

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("courseId", id);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/files`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getSession().token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const uploadedFile = await response.json();
        uploadedFiles.push(uploadedFile);
      }

      setFiles((prev) => [...prev, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleDownloadFile = async (fileId, filename) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/files/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${getSession().token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getSession().token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      toast.success("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleEnroll = async () => {
    if (!user) return;

    try {
      setEnrolling(true);
      await enrollStudent(id, user._id);
      toast.success("Successfully enrolled in course!");
      setIsEnrolled(true);
      await loadCourseData(user);
    } catch (error) {
      console.error("Error enrolling:", error);
      toast.error(error.response?.data?.error || "Failed to enroll in course");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!user) return;

    try {
      setEnrolling(true);
      await unenrollStudent(id, user._id);
      toast.success("Successfully unenrolled from course");
      setIsEnrolled(false);
      await loadCourseData(user);
    } catch (error) {
      console.error("Error unenrolling:", error);
      toast.error("Failed to unenroll from course");
    } finally {
      setEnrolling(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/courses/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getSession().token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      toast.success("Course deleted successfully!");
      navigate("/courses");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    } finally {
      setEnrolling(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!postTitle.trim() || !postBody.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    try {
      setCreating(true);

      const postData = {
        title: postTitle,
        body: postBody,
        type: postType,
        courseId: id,
      };

      if (postType === "announcement" && postDeadline) {
        postData.deadline = new Date(postDeadline).toISOString();
      }

      if (postType === "event") {
        if (eventDate) {
          postData.eventDate = new Date(eventDate).toISOString();
        }
        if (eventLocation) {
          postData.eventLocation = eventLocation;
        }
      }

      const newPost = await createPost(postData);
      setPosts((prev) => [newPost, ...prev]);

      setPostTitle("");
      setPostBody("");
      setPostType("discussion");
      setPostDeadline("");
      setEventDate("");
      setEventLocation("");

      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="course-details-page">
        <Navbar user={user} />
        <div className="course-details-container">
          <div className="loading">Loading course...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-page">
        <Navbar user={user} />
        <div className="course-details-container">
          <div className="error">Course not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details-page">
      <Navbar user={user} />
      <div className="course-details-container">
        {/* Header */}
        <div className="course-header">
          <Button
            variant="ghost"
            onClick={() => navigate("/courses")}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Back to Courses
          </Button>

          <div className="course-title-section">
            <h1 className="course-title">{course.name}</h1>
            <Badge className="badge-primary">{course._id}</Badge>
          </div>

          <div className="course-meta">
            <div className="meta-item">
              <BookOpen size={18} />
              <span>{course.creditHours} Credit Hours</span>
            </div>
            <div className="meta-item">
              <Users size={18} />
              <span>
                {course.enrolled || 0}/{course.capacity || 100} Students
              </span>
            </div>
            {isEnrolled && (
              <Badge className="badge-success enrolled-badge">Enrolled</Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="course-tabs">
          <button
            className={`tab ${activeTab === "posts" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <FileText size={18} />
            Posts
          </button>
          <button
            className={`tab ${activeTab === "files" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            <Download size={18} />
            Files
          </button>
          <button
            className={`tab ${activeTab === "about" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <Info size={18} />
            About
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "posts" && (
            <div className="posts-tab">
              {/* Create Post Form */}
              {isInstructor && (
                <Card className="create-post-card-course">
                  <CardHeader className="create-post-header">
                    <h3>Create New Post</h3>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleCreatePost}
                      className="create-post-form"
                    >
                      <div className="form-group">
                        <label>Post Type</label>
                        <select
                          value={postType}
                          onChange={(e) => setPostType(e.target.value)}
                          className="form-select"
                          disabled={creating}
                        >
                          <option value="discussion">Discussion</option>
                          <option value="announcement">Announcement</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          placeholder="Enter post title..."
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          className="form-input"
                          disabled={creating}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Content</label>
                        <Textarea
                          placeholder="Enter post content..."
                          value={postBody}
                          onChange={(e) => setPostBody(e.target.value)}
                          className="form-textarea"
                          disabled={creating}
                          required
                        />
                      </div>

                      {postType === "announcement" && (
                        <div className="form-group">
                          <label>
                            <Calendar size={16} />
                            Deadline (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={postDeadline}
                            onChange={(e) => setPostDeadline(e.target.value)}
                            className="form-input"
                            disabled={creating}
                          />
                        </div>
                      )}

                      <div className="form-actions">
                        <Button
                          type="submit"
                          disabled={
                            creating || !postTitle.trim() || !postBody.trim()
                          }
                        >
                          {creating ? "Creating..." : "Create Post"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Posts List */}
              {posts.length === 0 ? (
                <Card className="empty-state">
                  <CardContent>
                    <p>No posts yet in this course</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => {
                  const reactions = postReactions[post._id] || {
                    reactions: {},
                    userReaction: null,
                  };
                  const comments = postComments[post._id] || [];
                  const isExpanded = expandedPost === post._id;

                  return (
                    <Card key={post._id} className="post-card">
                      <CardHeader className="post-header">
                        <div className="post-user-info">
                          <div className="post-user">
                            <Avatar
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${post.sender.id}`);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {getAvatarSrc(post.sender) ? (
                                <img
                                  src={getAvatarSrc(post.sender)}
                                  alt={post.sender.name}
                                  className="avatar-img"
                                />
                              ) : (
                                <AvatarFallback className="avatar-fallback-secondary">
                                  {getInitials(post.sender.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="user-details">
                              <p
                                className="user-name clickable-username"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${post.sender.id}`);
                                }}
                              >
                                {post.sender.name}
                              </p>
                              <p className="user-meta">
                                {formatRelativeTime(post.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="post-header-right">
                            <Badge className="badge-secondary">
                              {post.type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="post-content">
                        <div
                          className="post-body clickable-post"
                          onClick={() => navigate(`/posts/${post._id}`)}
                        >
                          <h3 className="post-title">{post.title}</h3>
                          <p className="post-text">{post.body}</p>
                        </div>

                        {/* Post Images */}
                        {post.attachmentsId &&
                          post.attachmentsId.length > 0 && (
                            <div className="post-images">
                              {post.attachmentsId.map((fileId) => (
                                <img
                                  key={fileId}
                                  src={`${process.env.REACT_APP_API_URL}/files/${fileId}`}
                                  alt="Post attachment"
                                  className="post-image"
                                />
                              ))}
                            </div>
                          )}

                        {/* Reactions */}
                        <div className="post-reactions">
                          {Object.entries(reactionIcons).map(([type, Icon]) => {
                            const count = reactions.reactions[type] || 0;
                            const isActive = reactions.userReaction === type;

                            return (
                              <Button
                                key={type}
                                variant="ghost"
                                size="sm"
                                className={`reaction-button ${
                                  isActive ? "reaction-active" : ""
                                }`}
                                onClick={() => handleReaction(post._id, type)}
                              >
                                <Icon size={18} />
                                {(count > 0 || isActive) && (
                                  <span>{count || 1}</span>
                                )}
                              </Button>
                            );
                          })}
                        </div>

                        {/* Comments Toggle */}
                        <div className="post-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="action-button"
                            onClick={() => toggleComments(post._id)}
                          >
                            <MessageCircle className="action-icon" />
                            <span>{comments.length} Comments</span>
                          </Button>
                        </div>

                        {/* Comments Section */}
                        {isExpanded && (
                          <div className="comments-section">
                            <div className="comments-list">
                              {comments.map((comment) => (
                                <div key={comment._id} className="comment">
                                  <Avatar
                                    className="comment-avatar"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${comment.sender.id}`);
                                    }}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {getAvatarSrc(comment.sender) ? (
                                      <img
                                        src={getAvatarSrc(comment.sender)}
                                        alt={comment.sender.name}
                                        className="avatar-img"
                                      />
                                    ) : (
                                      <AvatarFallback className="avatar-fallback-secondary">
                                        {getInitials(comment.sender.name)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="comment-content">
                                    <div className="comment-header">
                                      <span
                                        className="comment-author clickable-username"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/profile/${comment.sender.id}`
                                          );
                                        }}
                                      >
                                        {comment.sender.name}
                                      </span>
                                      <span className="comment-time">
                                        {formatRelativeTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="comment-text">
                                      {comment.body}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="add-comment">
                              <Avatar>
                                {getAvatarSrc(user) ? (
                                  <img
                                    src={getAvatarSrc(user)}
                                    alt={user?.name}
                                    className="avatar-img"
                                  />
                                ) : (
                                  <AvatarFallback className="avatar-fallback-primary">
                                    {user?.name ? getInitials(user.name) : "U"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="comment-input-container">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentTexts[post._id] || ""}
                                  onChange={(e) =>
                                    setCommentTexts((prev) => ({
                                      ...prev,
                                      [post._id]: e.target.value,
                                    }))
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddComment(post._id);
                                    }
                                  }}
                                  className="comment-input"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddComment(post._id)}
                                  disabled={!commentTexts[post._id]?.trim()}
                                >
                                  <Send size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div
              className={`files-tab ${
                isInstructor && isDragging ? "files-tab-dragging" : ""
              }`}
              onDragOver={isInstructor ? handleDragOver : undefined}
              onDragLeave={isInstructor ? handleDragLeave : undefined}
              onDrop={isInstructor ? handleDrop : undefined}
            >
              <Card className="files-container">
                <CardContent>
                  {/* Header with Upload Button */}
                  <div className="files-header">
                    <div className="files-columns">
                      <span className="column-header">Name</span>
                      <span className="column-header">Date</span>
                      <span className="column-header">Type</span>
                      <span className="column-header">Size</span>
                    </div>
                    {isInstructor && (
                      <div className="upload-button-container">
                        <input
                          type="file"
                          id="file-upload"
                          onChange={handleFileUpload}
                          style={{ display: "none" }}
                          disabled={uploading}
                          multiple
                        />
                        <label htmlFor="file-upload" className="upload-button">
                          <Upload size={18} />
                          <span>
                            {uploading ? "Uploading..." : "Upload File"}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Drag and Drop Overlay - Only shows when dragging */}
                  {isInstructor && isDragging && (
                    <div className="drop-overlay">
                      <div className="drop-overlay-content">
                        <Upload size={48} />
                        <p>Drop files here to upload</p>
                        <p className="drop-hint">Maximum file size: 10MB</p>
                      </div>
                    </div>
                  )}

                  {/* Files List */}
                  {files.length === 0 ? (
                    <div className="empty-files">
                      <FileText size={48} className="empty-icon" />
                      <p>No files uploaded yet</p>
                      {isInstructor && (
                        <p className="drop-hint">
                          Drag and drop files anywhere or click Upload File
                          button
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="files-table">
                      {files.map((file) => (
                        <div key={file._id} className="file-row">
                          <div className="file-cell file-name-cell">
                            <FileText size={20} className="file-icon" />
                            <span>{file.fileName}</span>
                          </div>
                          <div className="file-cell">
                            {new Date(
                              file.createdAt || file.uploadDate
                            ).toLocaleDateString()}
                          </div>
                          <div className="file-cell">{file.fileType}</div>
                          <div className="file-cell">
                            {file.fileSize
                              ? (file.fileSize / 1024).toFixed(2)
                              : "N/A"}{" "}
                            KB
                          </div>
                          <div className="file-cell file-actions-cell">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadFile(file._id, file.fileName)
                              }
                              title="Download"
                            >
                              <Download size={18} />
                            </Button>
                            {isInstructor && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFile(file._id)}
                                className="delete-file-btn"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "about" && (
            <div className="about-tab">
              <Card className="about-card">
                <CardHeader>
                  <h3 className="section-title">Course Description</h3>
                </CardHeader>
                <CardContent>
                  <p className="course-description">
                    {course.description || "No description available"}
                  </p>
                </CardContent>
              </Card>

              <Card className="about-card">
                <CardHeader>
                  <h3 className="section-title">Instructors</h3>
                </CardHeader>
                <CardContent>
                  <div className="instructors-list">
                    {course.instructorId && course.instructorId.length > 0 ? (
                      course.instructorId.map((instructor) => (
                        <div key={instructor._id} className="instructor-item">
                          <Avatar>
                            <AvatarFallback className="avatar-fallback-primary">
                              {getInitials(instructor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="instructor-info">
                            <p className="instructor-name">{instructor.name}</p>
                            <p className="instructor-email">
                              {instructor.email}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No instructor information available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="about-card">
                <CardHeader className="course-info-header">
                  <h3 className="section-title">Course Information</h3>
                  {user?.role === "student" && isEnrolled && (
                    <Button
                      variant="outline"
                      onClick={handleUnenroll}
                      disabled={enrolling}
                      className="leave-course-button"
                    >
                      {enrolling ? "Leaving Course..." : "Leave Course"}
                    </Button>
                  )}
                  {isInstructor && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteCourse}
                      disabled={enrolling}
                      className="delete-course-button"
                    >
                      {enrolling ? "Deleting..." : "Delete Course"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Course Code</span>
                      <span className="info-value">{course._id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Credit Hours</span>
                      <span className="info-value">{course.creditHours}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Enrollment</span>
                      <span className="info-value">
                        {course.enrolled || 0} Students
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Capacity</span>
                      <span className="info-value">
                        {course.capacity || 100} Students
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
