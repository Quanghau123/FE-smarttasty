"use client";

import React, { useState } from "react";
import axios from "axios";

// ======= axiosInstance =======
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CHATBOT_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)[
      "Authorization"
    ] = `Bearer ${token}`;
  }
  return config;
});

// ======= Chat API =======
const sendChatMessage = async (text: string, image?: File) => {
  const token = localStorage.getItem("access_token"); // lấy token từ localStorage

  const formData = new FormData();
  formData.append("accessToken", token || ""); // thêm token vào form-data
  formData.append("text", text);
  if (image) {
    formData.append("image", image);
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

  return response.data;
};

// ======= ChatBox Component =======
export default function ChatBox() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input && !image) return;
    setLoading(true);

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const res = await sendChatMessage(input, image || undefined);
      let botText = res.bot || "";
      botText = botText.replace(/\\([*_|`])/g, "$1");
      botText = botText.replace(/\\n/g, "\n");
      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Lỗi gửi tin nhắn" },
      ]);
    } finally {
      setInput("");
      setImage(null);
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-full sm:max-w-lg mx-auto p-2 sm:p-4 border rounded-lg shadow bg-white flex flex-col"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: "60vh",
        maxHeight: "100vh",
      }}
    >
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 sm:mb-4 h-[45vh] sm:h-96">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.sender === "user"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-200 text-black self-start"
            }`}
          >
            {m.sender === "bot" ? (
              <div className="whitespace-pre-wrap">{m.text}</div>
            ) : (
              m.text
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          {loading ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}
