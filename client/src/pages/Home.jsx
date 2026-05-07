import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, Avatar, AvatarFallback, Badge } from "../components/ui/display";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/form-elements";
import { Heart, MessageCircle, Smile, Laugh, Frown, ThumbsUp, Send, Image as ImageIcon, X, Trash2, MoreVertical, Edit } from "lucide-react";
import { getSession } from "../api/session";
import { getAllPosts, createPost, deletePost, updatePost } from "../api/posts";
import { getComments, createComment } from "../api/comments";
import { getReactions, upsertReaction, deleteReaction } from "../api/reactions";
import { uploadFile, getFileUrl } from "../api/files";
import { getInitials, formatRelativeTime } from "../lib/utils";
import { toast } from "sonner";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [selectedImages, setSelectedImages] = useState([]);
  const [creating, setCreating] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [postReactions, setPostReactions] = useState({});
  const [postComments, setPostComments] = useState({});
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const fileInputRef = useRef(null);
  const menuRefs = useRef({});

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      loadPosts();
    }

    const refreshInterval = setInterval(() => {
      loadPosts();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const getAvatarSrc = (item) => {
    if (!item) return null;
    if (item.image && item.image.fileId) return getFileUrl(item.image.fileId);
    if (item.image && item.image.url) return item.image.url;
    if (item.profilePicture) return getFileUrl(item.profilePicture);
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuPostId) {
        const menuRef = menuRefs.current[openMenuPostId];
        if (menuRef && !menuRef.contains(event.target)) {
          setOpenMenuPostId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuPostId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getAllPosts();
      setPosts(data || []);

      if (data && data.length > 0) {
        for (const post of data) {
          loadPostReactions(post._id);
          loadPostComments(post._id); 
        }
      }

      const events = [];
      if (data && data.length > 0) {
        data.forEach((post) => {
          if (post.type === "announcement" && post.deadline) {
            const deadlineDate = new Date(post.deadline);
            if (deadlineDate > new Date()) {
              events.push({
                postId: post._id,
                title: post.title,
                date: deadlineDate,
                type: "deadline",
                courseId: post.courseId,
              });
            }
          }
          if (post.type === "event" && post.eventDate) {
            const eventDate = new Date(post.eventDate);
            if (eventDate > new Date()) {
              events.push({
                postId: post._id,
                title: post.title,
                date: eventDate,
                type: "event",
                location: post.eventLocation,
                courseId: post.courseId,
              });
            }
          }
        });
      }

      events.sort((a, b) => a.date - b.date);
      setUpcomingEvents(events.slice(0, 5)); 
    } catch (error) {
      console.error("Error loading posts:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load posts");
      }
      setPosts([]);
    } finally {
      setLoading(false);
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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...imageFiles]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...imageFiles]);
      toast.success(`${imageFiles.length} image(s) added`);
    } else if (files.length > 0) {
      toast.error("Only image files are supported");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!postTitle.trim() || !postText.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    try {
      setCreating(true);

      const uploadedFileIds = [];
      for (const image of selectedImages) {
        const uploadedFile = await uploadFile(image);
        uploadedFileIds.push(uploadedFile._id);
      }

      const newPost = await createPost({
        title: postTitle,
        body: postText,
        type: postType,
        courseId: "GENERAL", 
        attachmentsId: uploadedFileIds,
      });

      setPosts((prev) => [newPost, ...prev]);
      setPostTitle("");
      setPostText("");
      setPostType("discussion");
      setSelectedImages([]);

      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditBody(post.body);
    setOpenMenuPostId(null);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditTitle("");
    setEditBody("");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    try {
      const updated = await updatePost(editingPost._id, {
        title: editTitle,
        body: editBody,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === editingPost._id
            ? { ...p, title: updated.title, body: updated.body }
            : p
        )
      );
      setEditingPost(null);
      setEditTitle("");
      setEditBody("");
      toast.success("Post updated successfully");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
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

  const [upcomingEvents, setUpcomingEvents] = useState([]);

  return (
    <div className="home-page">
      <Navbar user={user} />
      <div className="home-container">
        <div className="home-grid">
          {/* Main Feed */}
          <div className="main-feed">
            {/* Create Post */}
            <Card
              className={`create-post-card ${
                isDraggingImage ? "dragging-images" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="create-post-content">
                {isDraggingImage && (
                  <div className="drop-overlay-post">
                    <div className="drop-overlay-content">
                      <ImageIcon size={48} />
                      <p>Drop images here</p>
                    </div>
                  </div>
                )}
                <form onSubmit={handleCreatePost} className="create-post">
                  <Avatar>
                    {getAvatarSrc(user) ? (
                      <img
                        src={getAvatarSrc(user)}
                        alt={user.name}
                        className="avatar-img"
                      />
                    ) : (
                      <AvatarFallback className="avatar-fallback-primary">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="create-post-body">
                    <input
                      type="text"
                      placeholder="Post title..."
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="post-title-input"
                      disabled={creating}
                    />
                    <Textarea
                      placeholder="Share your thoughts with the community..."
                      className="post-textarea"
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      disabled={creating}
                    />

                    {selectedImages.length > 0 && (
                      <div className="selected-images">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="selected-image">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="remove-image"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="post-footer">
                      <div className="post-actions-left">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          multiple
                          accept="image/*"
                          style={{ display: "none" }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={creating}
                        >
                          <ImageIcon size={18} />
                        </Button>
                        <select
                          value={postType}
                          onChange={(e) => setPostType(e.target.value)}
                          className="post-type-select"
                          disabled={creating}
                        >
                          <option value="discussion">Discussion</option>
                          <option value="question">Question</option>
                          <option value="announcement">Announcement</option>
                        </select>
                      </div>
                      <Button
                        type="submit"
                        className="btn-primary"
                        disabled={
                          creating || !postTitle.trim() || !postText.trim()
                        }
                      >
                        {creating ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            {loading ? (
              <div className="loading-posts">Loading posts...</div>
            ) : posts.length === 0 ? (
              <Card className="empty-posts">
                <CardContent>
                  <p>No posts yet. Be the first to share something!</p>
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
                          <Badge className="badge-secondary">{post.type}</Badge>
                          {user && post.sender.id === user._id && (
                            <div
                              className="post-menu"
                              ref={(el) => (menuRefs.current[post._id] = el)}
                            >
                              <button
                                className="menu-button"
                                onClick={() =>
                                  setOpenMenuPostId(
                                    openMenuPostId === post._id
                                      ? null
                                      : post._id
                                  )
                                }
                              >
                                <MoreVertical size={20} />
                              </button>
                              {openMenuPostId === post._id && (
                                <div className="menu-dropdown">
                                  <button
                                    className="menu-item"
                                    onClick={() => handleEditPost(post)}
                                  >
                                    <Edit size={16} />
                                    Edit Post
                                  </button>
                                  <button
                                    className="menu-item delete-item"
                                    onClick={() => {
                                      handleDeletePost(post._id);
                                      setOpenMenuPostId(null);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                    Delete Post
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="post-content">
                      {editingPost?._id === post._id ? (
                        <div className="edit-post-form">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="post-title-input"
                            placeholder="Post title..."
                          />
                          <Textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            className="post-textarea"
                            placeholder="Post content..."
                          />
                          <div className="edit-post-actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="btn-primary"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="post-body clickable-post"
                          onClick={() => navigate(`/posts/${post._id}`)}
                        >
                          <h3 className="post-title">{post.title}</h3>
                          <p className="post-text">{post.body}</p>
                        </div>
                      )}

                      {/* Post Images */}
                      {post.attachmentsId && post.attachmentsId.length > 0 && (
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
                              {count > 0 && <span>{count}</span>}
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
                                  <p className="comment-text">{comment.body}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="add-comment">
                            <Avatar>
                              <AvatarFallback className="avatar-fallback-primary">
                                {user?.name ? getInitials(user.name) : "U"}
                              </AvatarFallback>
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

          {/* Sidebar */}
          <div className="sidebar">
            {/* Upcoming Events */}
            <Card className="sidebar-card">
              <CardHeader>
                <h3 className="sidebar-title">Upcoming Events</h3>
              </CardHeader>
              <CardContent className="sidebar-content">
                {upcomingEvents.length === 0 ? (
                  <p className="empty-events">No upcoming events</p>
                ) : (
                  upcomingEvents.map((event, index) => {
                    const now = new Date();
                    const eventDate = new Date(event.date);
                    const diffTime = eventDate - now;
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24)
                    );

                    let timeLabel = "";
                    if (diffDays === 0) {
                      timeLabel = "Today";
                    } else if (diffDays === 1) {
                      timeLabel = "Tomorrow";
                    } else if (diffDays <= 7) {
                      timeLabel = "This Week";
                    } else {
                      timeLabel = eventDate.toLocaleDateString();
                    }

                    return (
                      <div
                        key={index}
                        className="event-item"
                        onClick={() => navigate(`/posts/${event.postId}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <Badge
                          className={
                            diffDays <= 1 ? "badge-accent" : "badge-secondary"
                          }
                        >
                          {timeLabel}
                        </Badge>
                        <p className="event-title">{event.title}</p>
                        <p className="event-meta">
                          {eventDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {event.location && ` - ${event.location}`}
                          {event.courseId &&
                            event.courseId !== "GENERAL" &&
                            ` - ${event.courseId}`}
                        </p>
                        {event.type === "deadline" && (
                          <Badge className="badge-warning event-type-badge">
                            Deadline
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
