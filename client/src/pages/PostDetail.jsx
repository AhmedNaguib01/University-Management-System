import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, Avatar, AvatarFallback, Badge } from "../components/ui/display";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/form-elements";
import { Heart, MessageCircle, Smile, Laugh, Frown, ThumbsUp, Send, ArrowLeft, MoreVertical, Edit, Trash2 } from "lucide-react";
import { getSession } from "../api/session";
import { getComments, createComment } from "../api/comments";
import { getReactions, upsertReaction, deleteReaction } from "../api/reactions";
import { updatePost, deletePost } from "../api/posts";
import { getInitials, formatRelativeTime } from "../lib/utils";
import { getFileUrl } from "../api/files";
import { toast } from "sonner";
import "../styles/post-detail.css";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState({
    reactions: {},
    userReaction: null,
  });
  const [openMenu, setOpenMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      loadPost();
    }

    const refreshInterval = setInterval(() => {
      if (getSession()) {
        loadPost();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [postId]);

  const getAvatarSrc = (item) => {
    if (!item) return null;
    if (item.image && item.image.fileId) return getFileUrl(item.image.fileId);
    if (item.image && item.image.url) return item.image.url;
    if (item.profilePicture) return getFileUrl(item.profilePicture);
    return null;
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${getSession().token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load post");
      }

      const data = await response.json();

      setPost(data.post);
      setComments(data.comments || []);
      setReactions({
        reactions: data.reactions || {},
        userReaction: data.userReaction || null,
      });
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const loadReactions = async () => {
    try {
      const data = await getReactions(postId);
      setReactions(data);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const handleReaction = async (type) => {
    try {
      if (reactions.userReaction === type) {
        await deleteReaction(postId);
      } else {
        await upsertReaction(postId, type);
      }
      await loadReactions();
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    try {
      await createComment(postId, commentText);
      setCommentText("");
      await loadComments();
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleEditPost = () => {
    setEditTitle(post.title);
    setEditBody(post.body);
    setIsEditing(true);
    setOpenMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditBody("");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    try {
      const updated = await updatePost(postId, {
        title: editTitle,
        body: editBody,
      });
      setPost((prev) => ({
        ...prev,
        title: updated.title,
        body: updated.body,
      }));
      setIsEditing(false);
      toast.success("Post updated successfully");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(postId);
      toast.success("Post deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const reactionIcons = {
    like: ThumbsUp,
    love: Heart,
    laugh: Laugh,
    shocked: Smile,
    sad: Frown,
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <Navbar user={user} />
        <div className="post-detail-container">
          <div className="loading-post">Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <Navbar user={user} />
        <div className="post-detail-container">
          <div className="error-post">Post not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <Navbar user={user} />
      <div className="post-detail-container">
        <div className="post-detail-content">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Back
          </Button>

          {/* Post Card */}
          <Card className="post-card">
            <CardHeader className="post-header">
              <div className="post-user-info">
                <div className="post-user">
                  <Avatar
                    onClick={() => navigate(`/profile/${post.sender?.id}`)}
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
                        {post.sender?.name
                          ? getInitials(post.sender.name)
                          : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="user-details">
                    <p
                      className="user-name clickable-username"
                      onClick={() => navigate(`/profile/${post.sender?.id}`)}
                    >
                      {post.sender?.name || "Unknown"}
                    </p>
                    <p className="user-meta">
                      {formatRelativeTime(post.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="post-header-right">
                  {post.type && (
                    <Badge className="badge-secondary">{post.type}</Badge>
                  )}
                  {user && post.sender?.id === user._id && (
                    <div className="post-menu">
                      <button
                        className="menu-button"
                        onClick={() => setOpenMenu(!openMenu)}
                      >
                        <MoreVertical size={20} />
                      </button>
                      {openMenu && (
                        <div className="menu-dropdown">
                          <button
                            className="menu-item"
                            onClick={handleEditPost}
                          >
                            <Edit size={16} />
                            Edit Post
                          </button>
                          <button
                            className="menu-item delete-item"
                            onClick={handleDeletePost}
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
              {isEditing ? (
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
                <div className="post-body">
                  <h1 className="post-title">
                    {post.title || "Untitled Post"}
                  </h1>
                  <p className="post-text">
                    {post.body || "No content available"}
                  </p>
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
                      onClick={() => handleReaction(type)}
                    >
                      <Icon size={18} />
                      {(count > 0 || isActive) && <span>{count || 1}</span>}
                    </Button>
                  );
                })}
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3 className="comments-title">
                  <MessageCircle size={20} />
                  Comments ({comments.length})
                </h3>

                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="comment">
                        <Avatar
                          className="comment-avatar"
                          onClick={() =>
                            navigate(`/profile/${comment.sender.id}`)
                          }
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
                              onClick={() =>
                                navigate(`/profile/${comment.sender.id}`)
                              }
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
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="add-comment">
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
                  <div className="comment-input-container">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="comment-input"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!commentText.trim()}
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
