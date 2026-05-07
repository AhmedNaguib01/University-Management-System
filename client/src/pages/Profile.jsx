import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, Badge, Avatar, AvatarFallback } from "../components/ui/display";
import { Button } from "../components/ui/button";
import { BookOpen, User as UserIcon, MessageCircle, X, Camera, Upload, MoreVertical, Edit, FileText } from "lucide-react";
import { getSession, updateSession } from "../api/session";
import { getUserProfile, getUserPosts, getUserCourses } from "../api/users";
import { createChat } from "../api/chats";
import { uploadFile, getFileUrl } from "../api/files";
import { getInitials, formatDate } from "../lib/utils";
import { toast } from "sonner";
import "../styles/profile.css";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    level: "",
    password: "",
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session.user);

      if (!userId) {
        setProfileUser(session.user);
        setIsOwnProfile(true);
        setLoading(false);
        loadUserData(session.user._id);

        if (searchParams.get("edit") === "true") {
          setEditForm({
            name: session.user.name || "",
            email: session.user.email || "",
            level: session.user.level || "",
            password: "",
          });
          setShowEditModal(true);
          setSearchParams({});
        }
      } else {
        if (userId === session.user._id) {
          setProfileUser(session.user);
          setIsOwnProfile(true);
          setLoading(false);
          loadUserData(userId);
        } else {
          loadProfile(userId);
          loadUserData(userId);
        }
      }
    }
  }, [userId, searchParams]);

  const getAvatarSrc = (item) => {
    if (!item) return null;
    if (item.image && item.image.fileId) return getFileUrl(item.image.fileId);
    if (item.image && item.image.url) return item.image.url;
    if (item.profilePicture) return getFileUrl(item.profilePicture);
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProfile = async (id) => {
    try {
      setLoading(true);
      const data = await getUserProfile(id);
      setProfileUser(data);
      setIsOwnProfile(false);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (id) => {
    try {
      setLoadingPosts(true);
      const posts = await getUserPosts(id);
      setUserPosts(posts.posts || posts);
    } catch (error) {
      console.error("Error loading posts:", error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }

    try {
      setLoadingCourses(true);
      const courses = await getUserCourses(id);
      setUserCourses(courses);
    } catch (error) {
      console.error("Error loading courses:", error);
      setUserCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const chat = await createChat(profileUser._id);
      navigate("/chats", { state: { activeChat: chat } });
      toast.success(`Opening chat with ${profileUser.name}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to open chat");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);

      let profilePicId = profileUser?.profilePicture || null;

      if (profilePicFile) {
        const uploadedFile = await uploadFile(profilePicFile);
        profilePicId = uploadedFile._id;
      }

      const updateData = {
        name: editForm.name,
        email: editForm.email,
        level: editForm.level,
        profilePicture: profilePicId || profileUser.profilePicture || null,
        image: profilePicId
          ? { fileId: profilePicId }
          : profileUser.image || {},
      };

      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${profileUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getSession().token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();

      updateSession({ user: updatedUser });
      setProfileUser(updatedUser);
      setCurrentUser(updatedUser);

      setShowEditModal(false);
      setProfilePicFile(null);
      setProfilePicPreview(null);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar user={currentUser} />
        <div className="profile-container">
          <div className="loading-profile">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar user={currentUser} />
      <div className="profile-container">
        <div className="profile-main">
          <Card className="profile-card">
            <div className="profile-header">
              <Avatar className="profile-avatar">
                <AvatarFallback className="avatar-fallback-primary profile-avatar-fallback">
                  {getAvatarSrc(profileUser) ? (
                    <img
                      src={getAvatarSrc(profileUser)}
                      alt={profileUser.name}
                      className="profile-avatar-img"
                    />
                  ) : profileUser?.name ? (
                    getInitials(profileUser.name)
                  ) : (
                    <UserIcon className="profile-icon" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="profile-info">
                <h1 className="profile-name">
                  {profileUser?.name || "Loading..."}
                </h1>
                <p className="profile-email">{profileUser?.email || ""}</p>
                <Badge className="profile-badge">
                  {profileUser?.role || "student"}
                </Badge>

                <p className="profile-bio">
                  {profileUser?.bio || profileUser?.level
                    ? profileUser?.bio || `Level: ${profileUser.level}`
                    : "No bio yet"}
                </p>

                {/* Start Chat Button (only for other users) */}
                {!isOwnProfile && (
                  <Button
                    onClick={handleStartChat}
                    className="btn-primary start-chat-button"
                  >
                    <MessageCircle className="chat-icon" />
                    Start Chat
                  </Button>
                )}
              </div>

              {/* Three-dot menu (only for own profile) */}
              {isOwnProfile && (
                <div className="profile-menu" ref={menuRef}>
                  <button
                    className="menu-button"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <MoreVertical size={24} />
                  </button>
                  {showMenu && (
                    <div className="menu-dropdown">
                      <button
                        className="menu-item"
                        onClick={() => {
                          setEditForm({
                            name: profileUser.name || "",
                            email: profileUser.email || "",
                            level: profileUser.level || "",
                            password: "",
                          });
                          setShowEditModal(true);
                          setShowMenu(false);
                        }}
                      >
                        <Edit size={16} />
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Courses Section - Shows "Teaching" for instructors, "Enrolled" for students */}
          {profileUser?.role !== "instructor" && (
            <Card className="section-card">
              <div className="section-header">
                <BookOpen className="section-icon" />
                <h2 className="section-title">
                  Enrolled Courses ({userCourses.length})
                </h2>
              </div>
              <div className="section-content">
                {loadingCourses ? (
                  <p className="empty-text">Loading courses...</p>
                ) : userCourses.length > 0 ? (
                  userCourses.map((course) => (
                    <div
                      key={course._id}
                      className="course-item clickable-course-item"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      <div className="course-item-header">
                        <p className="course-item-title">{course.name}</p>
                        <Badge className="badge-outline">{course._id}</Badge>
                      </div>
                      <div className="course-item-meta">
                        <span className="course-item-semester">
                          {course.description}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No enrolled courses yet</p>
                )}
              </div>
            </Card>
          )}

          {/* Teaching Courses Section - Only for instructors */}
          {profileUser?.role === "instructor" && (
            <Card className="section-card">
              <div className="section-header">
                <BookOpen className="section-icon" />
                <h2 className="section-title">
                  Teaching Courses ({userCourses.length})
                </h2>
              </div>
              <div className="section-content">
                {loadingCourses ? (
                  <p className="empty-text">Loading courses...</p>
                ) : userCourses.length > 0 ? (
                  userCourses.map((course) => (
                    <div
                      key={course._id}
                      className="course-item clickable-course-item"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      <div className="course-item-header">
                        <p className="course-item-title">{course.name}</p>
                        <Badge className="badge-outline">{course._id}</Badge>
                      </div>
                      <div className="course-item-meta">
                        <span className="course-item-semester">
                          {course.description}
                        </span>
                        <span className="course-enrollment">
                          {course.enrolled || 0}/{course.capacity || 100}{" "}
                          Students
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No teaching courses yet</p>
                )}
              </div>
            </Card>
          )}

          {/* Posts Made Section */}
          <Card className="section-card">
            <div className="section-header">
              <FileText className="section-icon" />
              <h2 className="section-title">Posts Made ({userPosts.length})</h2>
            </div>
            <div className="section-content">
              {loadingPosts ? (
                <p className="empty-text">Loading posts...</p>
              ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div
                    key={post._id}
                    className="post-item clickable-post-item"
                    onClick={() => navigate(`/posts/${post._id}`)}
                  >
                    <div className="post-item-info">
                      <p className="post-item-title">{post.title}</p>
                      <p className="post-item-desc">{post.body}</p>
                    </div>
                    <div className="post-item-date">
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No posts yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <Card
            className="edit-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="edit-profile-form">
              {/* Profile Picture Upload */}
              <div className="form-group">
                <label className="form-label">Profile Picture</label>
                <div className="profile-pic-upload">
                  <div className="profile-pic-preview">
                    {profilePicPreview || getAvatarSrc(profileUser) ? (
                      <img
                        src={profilePicPreview || getAvatarSrc(profileUser)}
                        alt="Profile preview"
                        className="preview-img"
                      />
                    ) : (
                      <div className="preview-placeholder">
                        <Camera size={48} />
                        <p>No image</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline"
                  >
                    <Upload size={16} />
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              {/* Level */}
              <div className="form-group">
                <label htmlFor="level" className="form-label">
                  Level
                </label>
                <input
                  type="text"
                  id="level"
                  value={editForm.level}
                  onChange={(e) =>
                    setEditForm({ ...editForm, level: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g., Sophomore, Junior, Senior"
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  id="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className="form-input"
                  placeholder="Enter new password"
                />
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setProfilePicFile(null);
                    setProfilePicPreview(null);
                  }}
                  className="btn-outline"
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
