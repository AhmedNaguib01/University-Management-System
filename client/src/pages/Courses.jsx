import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader } from "../components/ui/display";
import { Button } from "../components/ui/button";
import { BookOpen, Users, Clock, Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { getSession } from "../api/session";
import { getAllCourses, getEnrolledCourses, enrollStudent, unenrollStudent } from "../api/courses";
import { toast } from "sonner";
import "../styles/courses.css";

const Courses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("my-courses");
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [courseForm, setCourseForm] = useState({
    _id: "",
    name: "",
    creditHours: 3,
    description: "",
    capacity: 30,
  });
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      loadCourses(session.user._id, session.user.role);
    }
  }, []);

  const loadCourses = async (userId, userRole) => {
    try {
      setLoading(true);
      const all = await getAllCourses();
      setAllCourses(all);

      // Only load enrolled courses for students
      if (userRole === "student") {
        const enrolled = await getEnrolledCourses(userId);
        setEnrolledCourses(enrolled);
      } else if (userRole === "instructor") {
        // For instructors, show courses they teach
        const instructorCourses = all.filter((course) =>
          course.instructorId?.some((instructor) => instructor._id === userId)
        );
        setEnrolledCourses(instructorCourses);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!user) return;

    try {
      setEnrolling(courseId);
      await enrollStudent(courseId, user._id);
      toast.success("Successfully enrolled in course!");
      // Reload courses
      await loadCourses(user._id, user.role);
    } catch (error) {
      console.error("Error enrolling:", error);
      toast.error(error.response?.data?.error || "Failed to enroll in course");
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!user) return;

    try {
      setEnrolling(courseId);
      await unenrollStudent(courseId, user._id);
      toast.success("Successfully unenrolled from course");
      // Reload courses
      await loadCourses(user._id, user.role);
    } catch (error) {
      console.error("Error unenrolling:", error);
      toast.error("Failed to unenroll from course");
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some((course) => course._id === courseId);
  };

  const displayCourses =
    activeTab === "my-courses" ? enrolledCourses : allCourses;

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    if (!courseForm._id || !courseForm.name || !courseForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getSession().token}`,
        },
        body: JSON.stringify(courseForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create course");
      }

      const newCourse = await response.json();
      toast.success("Course created successfully!");
      setShowCreateModal(false);
      setCourseForm({
        _id: "",
        name: "",
        creditHours: 3,
        description: "",
        capacity: 30,
      });
      // Reload courses
      await loadCourses(user._id, user.role);
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error(error.message || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="courses-page">
      <Navbar user={user} />
      <div className="courses-container">
        <div className="courses-layout">
          {/* Sidebar */}
          <div className="courses-sidebar">
            <Card className="sidebar-card">
              <div className="sidebar-header">
                <h2 className="sidebar-title">Courses</h2>
              </div>
              <div className="sidebar-menu">
                <button
                  className={`sidebar-item ${
                    activeTab === "my-courses" ? "sidebar-item-active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("my-courses");
                    setIsCoursesExpanded(!isCoursesExpanded);
                  }}
                >
                  <div className="sidebar-item-left">
                    {isCoursesExpanded ? (
                      <ChevronDown className="sidebar-icon" size={18} />
                    ) : (
                      <ChevronRight className="sidebar-icon" size={18} />
                    )}
                    <BookOpen className="sidebar-icon" />
                    <span>
                      {user?.role === "instructor"
                        ? "My Courses"
                        : "My Courses"}
                    </span>
                  </div>
                  <span className="sidebar-badge">
                    {enrolledCourses.length}
                  </span>
                </button>

                {/* Course List Dropdown */}
                {isCoursesExpanded && enrolledCourses.length > 0 && (
                  <div className="course-dropdown">
                    {enrolledCourses.map((course) => (
                      <button
                        key={course._id}
                        className="course-dropdown-item"
                        onClick={() => navigate(`/courses/${course._id}`)}
                      >
                        <span className="course-dropdown-code">
                          {course._id}
                        </span>
                        <span className="course-dropdown-name">
                          {course.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {user?.role === "student" && (
                  <button
                    className={`sidebar-item ${
                      activeTab === "browse" ? "sidebar-item-active" : ""
                    }`}
                    onClick={() => setActiveTab("browse")}
                  >
                    <div className="sidebar-item-left">
                      <Search className="sidebar-icon" />
                      <span>Browse Courses</span>
                    </div>
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="courses-main">
            <div className="courses-header">
              <div className="courses-header-content">
                <div>
                  <h1 className="courses-title">
                    {activeTab === "my-courses"
                      ? user?.role === "instructor"
                        ? "Courses I Teach"
                        : "My Courses"
                      : "Browse All Courses"}
                  </h1>
                  <p className="courses-subtitle">
                    {activeTab === "my-courses"
                      ? user?.role === "instructor"
                        ? "Courses you are teaching"
                        : "Courses you are currently enrolled in"
                      : "Explore and enroll in new courses"}
                  </p>
                </div>
                {user?.role === "instructor" && activeTab === "my-courses" && (
                  <Button
                    className="btn-primary create-course-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    + Create Course
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="courses-loading">Loading courses...</div>
            ) : displayCourses.length === 0 ? (
              <div className="courses-empty">
                <BookOpen size={48} />
                <p>
                  {activeTab === "my-courses"
                    ? user?.role === "instructor"
                      ? "You are not teaching any courses yet"
                      : "You are not enrolled in any courses yet"
                    : "No courses available"}
                </p>
              </div>
            ) : (
              <div className="courses-grid">
                {displayCourses.map((course) => (
                  <Card
                    key={course._id}
                    className="course-card clickable-course-card"
                    onClick={() => {
                      if (
                        activeTab === "my-courses" ||
                        isEnrolled(course._id)
                      ) {
                        navigate(`/courses/${course._id}`);
                      }
                    }}
                  >
                    <div className="course-header">
                      <div className="course-icon-wrapper">
                        <BookOpen className="course-icon" />
                      </div>
                      <span className="course-code">{course._id}</span>
                    </div>

                    <h3 className="course-title">{course.name}</h3>
                    <p className="course-description">{course.description}</p>

                    <div className="course-meta">
                      <div className="course-meta-item">
                        <Users className="meta-icon" />
                        <span>
                          {course.enrolled || 0}/{course.capacity || 100}{" "}
                          students
                        </span>
                      </div>
                      <div className="course-meta-item">
                        <Clock className="meta-icon" />
                        <span>{course.creditHours}h</span>
                      </div>
                    </div>

                    <div className="course-instructor">
                      <p>
                        Instructor:{" "}
                        {course.instructorId?.[0]?.name || "Not assigned"}
                      </p>
                    </div>

                    {activeTab === "browse" &&
                      !isEnrolled(course._id) &&
                      user?.role === "student" && (
                        <Button
                          className="btn-primary btn-full course-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnroll(course._id);
                          }}
                          disabled={
                            enrolling === course._id ||
                            course.enrolled >= course.capacity
                          }
                        >
                          {enrolling === course._id
                            ? "Enrolling..."
                            : course.enrolled >= course.capacity
                            ? "Course Full"
                            : "Enroll Now"}
                        </Button>
                      )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <Card
            className="create-course-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="modal-header">
              <h2 className="modal-title">Create New Course</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                <X size={24} />
              </button>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleCreateCourse}
                className="create-course-form"
              >
                <div className="form-group">
                  <label htmlFor="courseId" className="form-label">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    id="courseId"
                    value={courseForm._id}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        _id: e.target.value.toUpperCase(),
                      })
                    }
                    className="form-input"
                    placeholder="e.g., CS101"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="courseName" className="form-label">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    value={courseForm.name}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, name: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g., Introduction to Programming"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="creditHours" className="form-label">
                      Credit Hours *
                    </label>
                    <input
                      type="number"
                      id="creditHours"
                      value={courseForm.creditHours}
                      onChange={(e) =>
                        setCourseForm({
                          ...courseForm,
                          creditHours: parseInt(e.target.value),
                        })
                      }
                      className="form-input"
                      min="1"
                      max="6"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="capacity" className="form-label">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      value={courseForm.capacity}
                      onChange={(e) =>
                        setCourseForm({
                          ...courseForm,
                          capacity: parseInt(e.target.value),
                        })
                      }
                      className="form-input"
                      min="1"
                      max="200"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        description: e.target.value,
                      })
                    }
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe what students will learn in this course..."
                    required
                  />
                </div>

                <div className="modal-actions">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-outline"
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Courses;
