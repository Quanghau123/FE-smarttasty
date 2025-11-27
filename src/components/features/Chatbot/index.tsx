"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Fab,
  Fade,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import RobotIcon from "@/components/layouts/ChatbotIcon/RobotIcon";
import PersonIcon from "@mui/icons-material/Person";
import { getAccessToken } from "@/lib/utils/tokenHelper";

import axios from "axios";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  image?: string;
}

const Chatbot: React.FC = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! Tôi là trợ lý ảo SmartTasty. Tôi có thể giúp gì cho bạn?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom khi có message mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Send message to chatbot
  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      alert("Vui lòng đăng nhập để sử dụng chatbot");
      return;
    }

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      image: imagePreview || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    const textToSend = inputText;
    const imageToSend = selectedImage;
    setInputText("");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsLoading(true);

    try {
      // Validate inputs
      if (!accessToken) {
        throw new Error("AccessToken is missing. Please login first.");
      }

      if (!textToSend.trim()) {
        throw new Error("Message cannot be empty.");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("AccessToken", accessToken);
      formData.append("Text", textToSend);
      if (imageToSend) {
        formData.append("Image", imageToSend);
      }

      // console.log("Sending to chatbot:", {
      //   url: `${process.env.NEXT_PUBLIC_CHATBOT_URL}/api/ChatControllerJson/send-form`,
      //   hasToken: !!accessToken,
      //   textLength: textToSend.length,
      //   hasImage: !!imageToSend,
      // });

      // Call chatbot API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_CHATBOT_URL}/api/ChatControllerJson/send-form`,
        formData,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.bot || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);

      // Log detailed error info
      // if (axios.isAxiosError(error)) {
      //   console.error("Response data:", error.response?.data);
      //   console.error("Response status:", error.response?.status);
      //   console.error("Request URL:", error.config?.url);
      // }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: "fixed",
          bottom: 96,
          right: 24,
          zIndex: 1000,
          width: 70,
          height: 70,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <CloseIcon /> : <RobotIcon scale={1} isTalking={isLoading} />}
      </Fab>

      {/* Chatbox */}
      <Fade in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 155,
            right: 24,
            width: 380,
            height: 500,
            display: isOpen ? "flex" : "none",
            flexDirection: "column",
            zIndex: 999,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              width: "100%",
              height: 80,
              bgcolor: "primary.main",
              color: theme.palette.primary.contrastText,
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ width: 70, height: 70 }}>
              <RobotIcon scale={0.9} isTalking={isLoading} />
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              SmartTasty Assistant
            </Typography>
            <IconButton
              size="small"
              sx={{ color: theme.palette.primary.contrastText }}
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 2,
              bgcolor: theme.palette.background.default,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                  justifyContent:
                    message.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                {message.sender === "bot" && (
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 45, height: 45 }}
                  >
                    <RobotIcon isTalking={isLoading} />
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: "70%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {message.image && (
                    <Box
                      component="img"
                      src={message.image}
                      alt="Uploaded"
                      sx={{
                        maxWidth: "100%",
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    />
                  )}
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor:
                        message.sender === "user"
                          ? theme.palette.primary.main
                          : theme.palette.background.paper,
                      color:
                        message.sender === "user"
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                      borderRadius: 2,
                      wordBreak: "break-word",
                    }}
                  >
                    <Typography variant="body2">{message.text}</Typography>
                  </Paper>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      px: 1,
                      alignSelf:
                        message.sender === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
                {message.sender === "user" && (
                  <Avatar
                    sx={{ bgcolor: "secondary.main", width: 32, height: 32 }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 45, height: 45 }}>
                  <RobotIcon isTalking={isLoading} />
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                  }}
                >
                  <CircularProgress size={20} />
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Image Preview */}
          {imagePreview && (
            <Box
              sx={{
                p: 1,
                bgcolor: theme.palette.background.paper,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                component="img"
                src={imagePreview}
                alt="Preview"
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" sx={{ flexGrow: 1 }}>
                {selectedImage?.name}
              </Typography>
              <IconButton size="small" onClick={handleRemoveImage}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.background.paper,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              gap: 1,
              alignItems: "flex-end",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageSelect}
            />
            <Tooltip title="Gửi hình ảnh">
              <IconButton
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              size="small"
              sx={{ bgcolor: theme.palette.background.paper }}
            />
            <Tooltip title="Gửi">
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputText.trim() && !selectedImage)}
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default Chatbot;
