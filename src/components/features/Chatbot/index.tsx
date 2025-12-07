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
import { getAccessToken, getUser } from "@/lib/utils/tokenHelper";

import axios from "axios";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  image?: string;
}

const getWelcomeMessage = (): string => {
  const user = getUser();
  const role = user?.role?.toLowerCase() || "user";

  if (role === "user") {
    return "Xin chào! Tôi là SmartTasty, trợ lý ảo ẩm thực của bạn. Tôi có thể gợi ý món ăn phù hợp khẩu vị, mood hoặc sức khỏe, tìm nhà hàng ngon, cung cấp công thức nấu ăn, lập thực đơn thông minh, và nhận diện món ăn qua ảnh. Bạn muốn khám phá gì hôm nay?";
  }

  if (role === "business") {
    return "Chào bạn, mình là AI phân tích/đánh giá dữ liệu nhà hàng. Bạn có thể hỏi về doanh thu, khách hàng, giao hàng, khuyến mãi hoặc dự báo, mình sẽ phân tích ngay cho bạn.";
  }

  return "Xin chào! Tôi là trợ lý ảo SmartTasty. Tôi có thể giúp gì cho bạn?";
};

const Chatbot: React.FC = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: getWelcomeMessage(),
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      alert("Vui lòng đăng nhập để sử dụng chatbot");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      image: imagePreview || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

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
      if (!accessToken) {
        throw new Error("AccessToken is missing. Please login first.");
      }

      if (!textToSend.trim()) {
        throw new Error("Message cannot be empty.");
      }

      const formData = new FormData();
      formData.append("AccessToken", accessToken);
      formData.append("Text", textToSend);
      if (imageToSend) {
        formData.append("Image", imageToSend);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_CHATBOT_URL}/api/ChatControllerJson/send-form`,
        formData,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.bot || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
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

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: "fixed",
          bottom: { xs: 70, sm: 84 },
          right: { xs: 16, sm: 24 },
          zIndex: 1300,
          width: 60,
          height: 60,
          boxShadow: 3,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <CloseIcon /> : <RobotIcon scale={1} isTalking={isLoading} />}
      </Fab>

      <Fade in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: { xs: 140, sm: 155 },
            right: { xs: 8, sm: 24 },
            left: { xs: 8, sm: "auto" },
            width: { xs: "calc(100vw - 16px)", sm: 380 },
            maxWidth: 420,
            height: { xs: "60vh", sm: 500 },
            maxHeight: "90vh",
            display: isOpen ? "flex" : "none",
            flexDirection: "column",
            zIndex: 1299,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: theme.palette.background.paper,
            boxShadow: 6,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: 64,
              bgcolor: "primary.main",
              color: theme.palette.primary.contrastText,
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ width: 48, height: 48 }}>
              <RobotIcon scale={0.9} isTalking={isLoading} />
            </Box>
            <Typography
              variant="h6"
              sx={{ flexGrow: 1, fontSize: { xs: 16, sm: 20 } }}
            >
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

          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: { xs: 1, sm: 2 },
              bgcolor: theme.palette.background.default,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minHeight: 0,
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
                    sx={{ bgcolor: "primary.main", width: 36, height: 36 }}
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
                      p: 1.2,
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
                    sx={{ bgcolor: "secondary.main", width: 28, height: 28 }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                  <RobotIcon isTalking={isLoading} />
                </Avatar>
                <Paper
                  sx={{
                    p: 1.2,
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
                  width: 48,
                  height: 48,
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

          <Box
            sx={{
              p: { xs: 1, sm: 2 },
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
                sx={{ minWidth: 36, minHeight: 36 }}
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
              sx={{
                bgcolor: theme.palette.background.paper,
                fontSize: { xs: 14, sm: 16 },
              }}
            />
            <Tooltip title="Gửi">
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputText.trim() && !selectedImage)}
                  sx={{ minWidth: 36, minHeight: 36 }}
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
