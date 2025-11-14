"use client";

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr";
import { getAccessToken, getUser } from "@/lib/utils/tokenHelper";

type Notification = {
  title: string;
  message: string;
  time: Date;
};

export default function NotificationTest() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [connection, setConnection] = useState<HubConnection | null>(null);

  // Join user's personal room based on userId
  const joinRoom = async (conn: HubConnection) => {
    const user = getUser();
    if (conn && user) {
      try {
        await conn.invoke("JoinRestaurantRoom", user.userId.toString());
        console.log("Joined room for user:", user.userId);
      } catch (err) {
        console.error("Failed to join room:", err);
      }
    }
  };

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("https://socket.smart-tasty.io.vn/hubs/notification", {
        accessTokenFactory: () => getAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .build();

    // Start connection
    const startConnection = async () => {
      try {
        await conn.start();
        console.log("Connected to SignalR hub");

        await joinRoom(conn);

        // --- Heartbeat every 30s ---
        setInterval(() => {
          conn.invoke("PingHeartbeat").catch((err) => console.error(err));
        }, 30000);
      } catch (err) {
        console.error("Connection error, retrying in 3s:", err);
        setTimeout(startConnection, 3000);
      }
    };
    startConnection();

    // Handle incoming notifications
    conn.on("ReceiveNotification", (title: string, message: string) => {
      setNotifications((prev) => [
        { title, message, time: new Date() },
        ...prev,
      ]);
    });

    setConnection(conn);

    return () => {
      conn.off("ReceiveNotification");
      conn.stop().catch((err) => console.error(err));
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div>
          <h1>Notification Test</h1>
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button onClick={() => setOpen(!open)} style={{ fontSize: 20 }}>
            🔔 {notifications.length}
          </button>
          {open && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: 300,
                maxHeight: 400,
                overflowY: "auto",
                background: "white",
                border: "1px solid gray",
                borderRadius: 8,
                zIndex: 100,
              }}
            >
              {notifications.length === 0 && (
                <p style={{ padding: 10 }}>No notifications</p>
              )}
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  style={{ padding: 10, borderBottom: "1px solid #eee" }}
                >
                  <strong>{notif.title}</strong>
                  <p>{notif.message}</p>
                  <small>{notif.time.toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
