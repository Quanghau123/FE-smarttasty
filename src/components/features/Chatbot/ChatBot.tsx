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
  const formData = new FormData();
  formData.append("Text", text);
  if (image) {
    formData.append("Image", image);
  }

  const response = await axiosInstance.post(
    "/api/ChatControllerJson/send-form",
    formData
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
      setMessages((prev) => [...prev, { sender: "bot", text: res.bot }]);
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
    <div className="w-full max-w-lg mx-auto p-4 border rounded-lg shadow bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 h-96">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.sender === "user"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-200 text-black self-start"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}
