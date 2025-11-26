"use client";

import React, { useState } from "react";

const ContactPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hiện tại chỉ hiển thị thông báo, chưa gửi thực tế
    if (!name || !email || !message) {
      setStatus("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setStatus("Cảm ơn bạn đã gửi phản hồi! Admin sẽ kiểm tra email của bạn.");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Liên hệ với Admin</h2>
      <p className="mb-6 text-gray-600 text-center">
        Nếu bạn có ý kiến đóng góp hoặc phản hồi, hãy gửi cho chúng tôi qua form
        dưới đây. Admin sẽ nhận được email của bạn và phản hồi sớm nhất!
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Tên của bạn</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên của bạn"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Nội dung phản hồi</label>
          <textarea
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung phản hồi..."
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Gửi phản hồi
        </button>
        {status && (
          <div className="mt-3 text-center text-green-600 font-semibold">
            {status}
          </div>
        )}
      </form>
    </div>
  );
};

export default ContactPage;
