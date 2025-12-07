import * as signalR from "@microsoft/signalr";

export interface RatingUpdateData {
  type: "restaurant_rating_update";
  data: {
    restaurantId: number;
    averageRating: number;
    totalReviews: number;
  };
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentRestaurantId: string | null = null;
  private ratingCallback: ((data: RatingUpdateData) => void) | null = null;
  private notificationCallback:
    | ((title: string, message: string) => void)
    | null = null;

  private notificationBuffer: Array<{ title: string; message: string }> = [];
  private readonly NOTIFICATION_BUFFER_LIMIT = 100; 

  private pingIntervalId: number | null = null;
  private readonly PING_INTERVAL = 30000;
  private startPing(): void {
    if (this.pingIntervalId !== null) {
      window.clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }

    if (typeof window === "undefined") return;

    this.pingIntervalId = window.setInterval(() => {
      void this.invokePing();
    }, this.PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingIntervalId !== null && typeof window !== "undefined") {
      window.clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private async invokePing(): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await this.connection.invoke("PingHeartbeat");
      console.debug("PingHeartbeat invoked (periodic)");
    } catch (err) {
      console.warn("PingHeartbeat invoke failed (periodic):", err);
    }
  }

  /**
   * Kết nối đến SignalR Hub
   * @param accessToken 
   */
  async connect(accessToken?: string): Promise<void> {
    if (
      this.connection &&
      this.connection.state !== signalR.HubConnectionState.Disconnected
    ) {
      console.log(
        "SignalR connection already in progress or established:",
        this.connection.state
      );
      return;
    }

    this.stopPing();

    const hubUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      "http://localhost:5003/hubs/notification";

    const connectionBuilder = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken || "",
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information);

    this.connection = connectionBuilder.build();

    const originalOn = this.connection.on.bind(this.connection);
    this.connection.on = ((
      eventName: string,
      callback: (...args: unknown[]) => void
    ) => {
      const wrappedCallback = (...args: unknown[]) => {
        console.log(`[SignalR] Event "${eventName}" received with args:`, args);
        callback(...args);
      };
      return originalOn(eventName, wrappedCallback);
    }) as typeof this.connection.on;

    this.connection.on(
      "ReceiveRestaurantUpdate",
      (message: RatingUpdateData) => {
        console.log("Received restaurant rating update (internal):", message);
        if (this.ratingCallback) this.ratingCallback(message);
      }
    );

    this.connection.on(
      "ReceiveNotification",
      (title: string, message: string) => {
        console.log("[SignalR Service] ReceiveNotification event fired!");
        console.log("   Title:", title);
        console.log("   Message:", message);
        console.log("   Has callback registered?", !!this.notificationCallback);
        if (this.notificationCallback) {
         console.log("   Invoking callback...");
          this.notificationCallback(title, message);
        } else {
          console.log("   No callback yet — buffering notification");
          this.notificationBuffer.push({ title, message });
          if (this.notificationBuffer.length > this.NOTIFICATION_BUFFER_LIMIT) {
            this.notificationBuffer.shift();
          }
        }
      }
    );

    this.connection.onreconnecting((error) => {
      console.warn("SignalR reconnecting...", error);
      this.stopPing();
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR reconnected:", connectionId);
      if (this.currentRestaurantId) {
        this.joinRestaurantRoom(this.currentRestaurantId);
      }
      if (
        this.connection &&
        this.connection.state === signalR.HubConnectionState.Connected
      ) {
        this.startPing();
      }
    });

    this.connection.onclose((error) => {
      console.error("SignalR connection closed:", error);
      this.stopPing();
    });

    try {
      await this.connection.start();
      console.log("SignalR connected successfully");
      try {
        const cid = this.connection.connectionId;
        console.log("SignalR connectionId:", cid);
        if (accessToken) {
          const masked =
            accessToken.length > 10
              ? `${accessToken.slice(0, 6)}...${accessToken.slice(-4)}`
              : accessToken;
          console.log("SignalR using accessToken (masked):", masked);

          try {
            const base64Url = accessToken.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(function (c) {
                  return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
            );
            const claims = JSON.parse(jsonPayload);
            console.log("JWT Claims:", claims);
            console.log("  → sub:", claims.sub);
            console.log("  → nameid:", claims.nameid);
            console.log("  → unique_name:", claims.unique_name);
          } catch (jwtErr) {
            console.warn("Failed to decode JWT:", jwtErr);
          }
        } else {
          console.warn("No accessToken provided to SignalR connect");
        }

        if (
          this.connection &&
          this.connection.state === signalR.HubConnectionState.Connected
        ) {
          try {
            await this.connection.invoke("PingHeartbeat");
            console.log("PingHeartbeat invoked successfully (initial)");
          } catch (pingErr) {
            console.warn("PingHeartbeat invoke failed (initial):", pingErr);
          }
          if (this.connection.state === signalR.HubConnectionState.Connected) {
            this.startPing();
          }
        }
      } catch (dbgErr) {
        console.warn("Error during SignalR post-connect debug steps:", dbgErr);
      }
    } catch (error) {
      console.error("Error connecting to SignalR:", error);
      throw error;
    }
  }

  /**
   * Ngắt kết nối SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.stopPing();
      this.clearAllHandlers(); 
      this.connection = null;
      this.currentRestaurantId = null;
      console.log("SignalR disconnected");
    }
  }

  /**
   * Join vào room của một restaurant để nhận cập nhật realtime
   * @param restaurantId - ID của restaurant
   */
  async joinRestaurantRoom(restaurantId: string): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.warn("SignalR not connected, cannot join restaurant room");
      return;
    }

    try {
      await this.connection.invoke("JoinRestaurantRoom", restaurantId);
      this.currentRestaurantId = restaurantId;
      console.log(`Joined restaurant room: ${restaurantId}`);
    } catch (error) {
      console.error("Error joining restaurant room:", error);
    }
  }

  /**
   * Đăng ký callback để nhận cập nhật rating từ server
   * @param callback - Hàm xử lý khi nhận được cập nhật
   */
  onRestaurantRatingUpdate(callback: (data: RatingUpdateData) => void): void {
    if (!this.connection) {
      console.warn("SignalR not initialized");
      return;
    }

    // Store callback; internal handler (registered in connect) will invoke it.
    this.ratingCallback = callback;
  }

  /**
   * Đăng ký callback để nhận notification từ server
   * @param callback - Hàm xử lý khi nhận được notification
   */
  onNotification(callback: (title: string, message: string) => void): void {
    // Store callback; internal handler (registered in connect) will invoke it.
    this.notificationCallback = callback;

    // Replay buffered notifications (if any) and clear buffer
    if (this.notificationBuffer.length > 0) {
      try {
        this.notificationBuffer.forEach((n) => {
          try {
            callback(n.title, n.message);
          } catch (cbErr) {
            console.warn("Error while replaying buffered notification:", cbErr);
          }
        });
      } finally {
        this.notificationBuffer = [];
      }
    }
  }

  offAllHandlers(): void {
    console.debug(
      "offAllHandlers called — no-op to preserve callbacks until disconnect"
    );
  }

  private clearAllHandlers(): void {
    this.ratingCallback = null;
    this.notificationCallback = null;
    this.notificationBuffer = [];
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  async sendTestNotification(userId: number): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.warn("SignalR not connected, cannot send test notification");
      return;
    }

    try {
      await this.connection.invoke(
        "SendTestNotification",
        userId,
        "Test Notification",
        `Test at ${new Date().toLocaleTimeString()}`
      );
      console.log("✅ Test notification sent via SignalR");
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}

export const signalRService = new SignalRService();
