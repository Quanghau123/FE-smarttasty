import * as signalR from "@microsoft/signalr";

export const socketConnection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5100/hub/notification") // URL socket-service
  .withAutomaticReconnect()
  .build();

export const startConnection = async () => {
  try {
    await socketConnection.start();
    console.log("Connected to socket service");
  } catch (err) {
    console.error("Socket connect failed:", err);
  }
};
