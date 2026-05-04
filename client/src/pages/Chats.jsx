import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, Avatar, AvatarFallback, AvatarImage } from "../components/ui/display";
import { Button } from "../components/ui/button";
import { Send, Paperclip, X, Image as ImageIcon, FileText, Reply, Trash2 } from "lucide-react";
import { getSession } from "../api/session";
import { getAllChats } from "../api/chats";
import { getMessages, sendMessage, deleteMessage } from "../api/messages";
import { uploadFile, getFileUrl } from "../api/files";
import { getInitials, formatRelativeTime } from "../lib/utils";
import { toast } from "sonner";
import "../styles/chats.css";

const POLLING_INTERVAL = 3000; 

const Chats = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      loadChats();
    }
  }, []);

  useEffect(() => {
    if (activeChat?._id) {
      loadMessages(activeChat._id);
      startPolling(activeChat._id);
    }
    return () => stopPolling();
  }, [activeChat?._id]);

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageText]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);


  const startPolling = useCallback((chatId) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getMessages(chatId);
        if (Array.isArray(data)) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const serverIds = new Set(data.map((m) => m._id));
            const hasNewMessages = data.some((m) => !existingIds.has(m._id));
            const hasDeletedMessages = prev.some((m) => !serverIds.has(m._id));
            if (hasNewMessages || hasDeletedMessages) {
              return data;
            }
            return prev;
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Polling error:", error);
        }
      }
    }, POLLING_INTERVAL);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const loadChats = async () => {
    try {
      const data = await getAllChats();
      const chatList = data.chats || data;
      setChats(chatList);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const data = await getMessages(chatId);
      setMessages(data);
      lastMessageCountRef.current = data.length;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    validateAndAddFiles(files);
  };

  const validateAndAddFiles = (files) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds 10MB limit`);
      } else if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setContextMenu(null);
    textareaRef.current?.focus();
  };

  const handleDeleteMessage = async (message) => {
    setContextMenu(null);
    if (message.senderId !== user._id) {
      toast.error("You can only delete your own messages");
      return;
    }

    try {
      await deleteMessage(message._id);
      setMessages((prev) => prev.filter((m) => m._id !== message._id));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() && selectedFiles.length === 0) {
      return;
    }

    if (!activeChat) {
      toast.error("Please select a chat");
      return;
    }

    try {
      setUploading(true);

      const uploadedFileIds = [];
      for (const file of selectedFiles) {
        const uploadedFile = await uploadFile(file);
        uploadedFileIds.push(uploadedFile._id);
      }

      const receiverId =
        activeChat.user1.id === user._id
          ? activeChat.user2.id
          : activeChat.user1.id;

      const newMessage = await sendMessage(
        activeChat._id,
        receiverId,
        messageText || "📎 Attachment",
        uploadedFileIds,
        replyingTo?._id || null
      );

      setMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      setChats((prev) => {
        const updatedChat = prev.find((chat) => chat._id === activeChat._id);
        if (updatedChat) {
          const otherChats = prev.filter((chat) => chat._id !== activeChat._id);
          return [
            {
              ...updatedChat,
              lastMessage: messageText || "📎 Attachment",
              updatedAt: new Date().toISOString(),
            },
            ...otherChats,
          ];
        }
        return prev;
      });

      setMessageText("");
      setSelectedFiles([]);
      setReplyingTo(null);

      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  const getOtherUser = (chat) => {
    if (!user) return null;
    return chat.user1.id === user._id ? chat.user2 : chat.user1;
  };

  const getReplyMessage = (replyToId) => {
    return messages.find((m) => m._id === replyToId);
  };

  return (
    <div className="chats-page">
      <Navbar user={user} />
      <div className="chats-container">
        <div className="chats-layout">
          {/* Chat List */}
          <div className="chat-list">
            <Card className="chat-list-card">
              <div className="chat-list-header">
                <h2 className="chat-list-title">Messages</h2>
              </div>
              <div className="chat-list-content">
                {chats.length === 0 ? (
                  <div className="empty-chats">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const otherUser = getOtherUser(chat);
                    return (
                      <div
                        key={chat._id}
                        className={`chat-item ${
                          activeChat?._id === chat._id ? "chat-item-active" : ""
                        }`}
                        onClick={() => setActiveChat(chat)}
                      >
                        <Avatar>
                          {otherUser?.profilePicture && (
                            <AvatarImage
                              src={getFileUrl(otherUser.profilePicture)}
                              alt={otherUser?.name}
                            />
                          )}
                          <AvatarFallback className="avatar-fallback-primary">
                            {getInitials(otherUser?.name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="chat-item-content">
                          <div className="chat-item-header">
                            <span className="chat-item-name">
                              {otherUser?.name}
                            </span>
                            <span className="chat-item-time">
                              {formatRelativeTime(chat.updatedAt || new Date())}
                            </span>
                          </div>
                          <div className="chat-item-message">
                            <span className="chat-item-text">
                              {chat.lastMessage || "No messages yet"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>


          {/* Chat Window */}
          <div className="chat-window">
            {activeChat ? (
              <Card className="chat-window-card">
                <div className="chat-window-header">
                  <Avatar
                    className="clickable-avatar"
                    onClick={() => navigate(`/profile/${getOtherUser(activeChat)?.id}`)}
                  >
                    {getOtherUser(activeChat)?.profilePicture && (
                      <AvatarImage
                        src={getFileUrl(getOtherUser(activeChat).profilePicture)}
                        alt={getOtherUser(activeChat)?.name}
                      />
                    )}
                    <AvatarFallback className="avatar-fallback-primary">
                      {getInitials(getOtherUser(activeChat)?.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="chat-window-user">
                    <h3
                      className="chat-window-name clickable-name"
                      onClick={() => navigate(`/profile/${getOtherUser(activeChat)?.id}`)}
                    >
                      {getOtherUser(activeChat)?.name}
                    </h3>
                  </div>
                </div>

                <div
                  className={`chat-messages ${isDragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <div className="drag-overlay">
                      <div className="drag-content">
                        <ImageIcon size={48} />
                        <p>Drop files here to upload</p>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="loading-messages">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="empty-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const replyMsg = message.replyTo
                        ? getReplyMessage(message.replyTo)
                        : null;
                      return (
                        <div
                          key={message._id}
                          className={`message ${
                            message.senderId === user._id
                              ? "message-me"
                              : "message-other"
                          }`}
                          onContextMenu={(e) => handleContextMenu(e, message)}
                        >
                          {message.senderId !== user._id && (
                            <Avatar className="message-avatar">
                              {getOtherUser(activeChat)?.profilePicture && (
                                <AvatarImage
                                  src={getFileUrl(getOtherUser(activeChat).profilePicture)}
                                  alt={getOtherUser(activeChat)?.name}
                                />
                              )}
                              <AvatarFallback className="avatar-fallback-secondary">
                                {getInitials(
                                  getOtherUser(activeChat)?.name || "U"
                                )}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="message-content">
                            {replyMsg && (
                              <div className="message-reply-preview">
                                <Reply size={12} />
                                <span className="reply-text">
                                  {replyMsg.text?.substring(0, 50) ||
                                    "Attachment"}
                                  {replyMsg.text?.length > 50 ? "..." : ""}
                                </span>
                              </div>
                            )}
                            <div className="message-bubble">
                              {message.attachmentsId &&
                                message.attachmentsId.length > 0 && (
                                  <div className="message-attachments">
                                    {message.attachmentsId.map((fileId) => {
                                      const fileUrl = getFileUrl(fileId);
                                      return (
                                        <div key={fileId}>
                                          <div className="message-image-container">
                                            <img
                                              src={fileUrl}
                                              alt="Attachment"
                                              className="message-image"
                                              onClick={() =>
                                                window.open(fileUrl, "_blank")
                                              }
                                              onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display =
                                                  "flex";
                                              }}
                                            />
                                            <a
                                              href={fileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="message-attachment"
                                              style={{ display: "none" }}
                                            >
                                              <FileText size={16} />
                                              <span>View attachment</span>
                                            </a>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              {message.text &&
                                message.text !== "📎 Attachment" && (
                                  <p className="message-text">{message.text}</p>
                                )}
                            </div>
                            <span className="message-time">
                              {formatRelativeTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>


                <div className="chat-input-container">
                  {replyingTo && (
                    <div className="reply-bar">
                      <div className="reply-info">
                        <Reply size={14} />
                        <span>
                          Replying to:{" "}
                          {replyingTo.text?.substring(0, 40) || "Attachment"}
                          {replyingTo.text?.length > 40 ? "..." : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={cancelReply}
                        className="reply-cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                          <div className="file-info">
                            {file.type.startsWith("image/") ? (
                              <ImageIcon size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="remove-file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={handleSendMessage}
                    className="chat-input-form"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="attach-button"
                      disabled={uploading}
                    >
                      <Paperclip className="attach-icon" />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="chat-input-textarea"
                      rows={1}
                      disabled={uploading}
                    />
                    <Button
                      type="submit"
                      className="send-button"
                      disabled={
                        uploading ||
                        (!messageText.trim() && selectedFiles.length === 0)
                      }
                    >
                      <Send className="send-icon" />
                    </Button>
                  </form>
                </div>
              </Card>
            ) : (
              <Card className="chat-empty">
                <div className="chat-empty-content">
                  <h3 className="chat-empty-title">Select a conversation</h3>
                  <p className="chat-empty-text">
                    Choose a chat from the list to start messaging
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="context-menu-item"
            onClick={() => handleReply(contextMenu.message)}
          >
            <Reply size={16} />
            <span>Reply</span>
          </button>
          {contextMenu.message.senderId === user?._id && (
            <button
              className="context-menu-item context-menu-item-danger"
              onClick={() => handleDeleteMessage(contextMenu.message)}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Chats;
