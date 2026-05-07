import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Home, BookOpen, MessageSquare, User, LogOut, Search, X, Sun, Moon } from "lucide-react";
import { useDarkMode } from "../hooks";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, Card } from "./ui/display";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/overlay";
import { clearSession } from "../api/session";
import { searchUsers } from "../api/users";
import { toast } from "sonner";
import { getInitials } from "../lib/utils";
import { getFileUrl } from "../api/files";
import "../styles/navbar.css";

const getAvatarSrc = (item) => {
  if (!item) return null;
  if (item.image && item.image.fileId) return getFileUrl(item.image.fileId);
  if (item.image && item.image.url) return item.image.url;
  if (item.profilePicture) return getFileUrl(item.profilePicture);
  return null;
};

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setSearching(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleUserClick = (selectedUser) => {
    setShowResults(false);
    setSearchQuery("");
    navigate(`/profile/${selectedUser._id}`);
  };

  const handleLogout = () => {
    clearSession();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo and Search */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon-wrapper">
              <GraduationCap className="logo-icon" />
            </div>
            <span className="logo-text">EduVerse</span>
          </Link>

          {/* Global Search */}
          <div className="navbar-search" ref={searchRef}>
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  className="search-clear"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <Card className="search-results">
                {searchResults.map((result) => (
                  <div
                    key={result._id}
                    className="search-result-item"
                    onClick={() => handleUserClick(result)}
                  >
                    <Avatar>
                      {result.profilePicture ? (
                        <img
                          src={getFileUrl(result.profilePicture)}
                          alt={result.name}
                          className="avatar-img"
                        />
                      ) : (
                        <AvatarFallback className="avatar-fallback-primary">
                          {getInitials(result.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="search-result-info">
                      <p className="search-result-name">{result.name}</p>
                      <p className="search-result-email">{result.email}</p>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {showResults &&
              searchQuery.length >= 2 &&
              searchResults.length === 0 &&
              !searching && (
                <Card className="search-results">
                  <div className="search-no-results">No users found</div>
                </Card>
              )}
          </div>
        </div>

        {/* Center: Navigation Menu */}
        <div className="navbar-menu">
          <Button variant="ghost" asChild>
            <Link to="/" className="nav-link">
              <Home className="nav-icon" />
              <span>Home</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/courses" className="nav-link">
              <BookOpen className="nav-icon" />
              <span>Courses</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/chats" className="nav-link">
              <MessageSquare className="nav-icon" />
              <span>Messages</span>
            </Link>
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun /> : <Moon />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="avatar-button">
                <Avatar>
                  {getAvatarSrc(user) ? (
                    <img
                      src={getAvatarSrc(user)}
                      alt={user?.name}
                      className="avatar-img"
                    />
                  ) : (
                    <AvatarFallback className="avatar-fallback-primary">
                      {user?.name ? (
                        getInitials(user.name)
                      ) : (
                        <User className="icon" />
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dropdown-menu-content">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="dropdown-link">
                  <User className="dropdown-icon" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="dropdown-link dropdown-link-danger"
              >
                <LogOut className="dropdown-icon" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
