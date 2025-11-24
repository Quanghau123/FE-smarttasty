"use client";

import { useEffect, useRef, useCallback } from "react";
import { signalRService, RatingUpdateData } from "./signalRService";
import { getAccessToken, getUser } from "@/lib/utils/tokenHelper";

interface UseSignalROptions {
  restaurantId?: string | number;
  onRatingUpdate?: (data: RatingUpdateData) => void;
  onNotification?: (title: string, message: string) => void;
  enabled?: boolean;
}

/**
 * Custom hook để sử dụng SignalR trong React components
 *
 * @example
 * ```tsx
 * const { isConnected, joinRoom } = useSignalR({
 *   restaurantId: restaurant.id,
 *   onRatingUpdate: (data) => {
 *     console.log('Rating updated:', data);
 *     // Cập nhật UI
 *   },
 *   enabled: true
 * });
 * ```
 */
export function useSignalR(options: UseSignalROptions = {}) {
  const {
    restaurantId,
    onRatingUpdate,
    onNotification,
    enabled = true,
  } = options;

  const isInitializedRef = useRef(false);
  const restaurantIdRef = useRef<string | null>(null);

  // Join restaurant room
  const joinRoom = useCallback(async (roomId: string | number) => {
    const roomIdStr = String(roomId);
    if (signalRService.isConnected()) {
      await signalRService.joinRestaurantRoom(roomIdStr);
      restaurantIdRef.current = roomIdStr;
    }
  }, []);

  // Initialize SignalR connection
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;

    const initConnection = async () => {
      try {
        const accessToken = getAccessToken();
        console.log(
          "[useSignalR] Retrieved accessToken:",
          accessToken ? `${accessToken.slice(0, 10)}...` : "null"
        );
        await signalRService.connect(accessToken || undefined);
        isInitializedRef.current = true;

        // Register event handlers
        if (onRatingUpdate) {
          signalRService.onRestaurantRatingUpdate(onRatingUpdate);
        }

        if (onNotification) {
          signalRService.onNotification(onNotification); // bind trước connect
        }
        await signalRService.connect(accessToken || undefined);

        // Auto-join restaurant room if provided
        if (restaurantId) {
          const roomIdStr = String(restaurantId);
          await signalRService.joinRestaurantRoom(roomIdStr);
          restaurantIdRef.current = roomIdStr;
        } else {
          // If no restaurantId, join user's personal room for notifications
          const user = getUser();
          if (user?.userId) {
            console.log(
              "[useSignalR] Joining user's personal room:",
              user.userId
            );
            await signalRService.joinRestaurantRoom(String(user.userId));
            restaurantIdRef.current = String(user.userId);
          }
        }
      } catch (error) {
        console.error("Failed to initialize SignalR:", error);
        isInitializedRef.current = false;
      }
    };

    initConnection();

    // Cleanup on unmount
    return () => {
      // Intentionally do not clear service callbacks here; service preserves callbacks
      // until a real disconnect. If you want to disconnect on unmount, call disconnect().
    };
  }, [enabled, restaurantId, onRatingUpdate, onNotification]);

  // Update restaurant room when restaurantId changes
  useEffect(() => {
    if (!enabled || !restaurantId || !isInitializedRef.current) return;

    const roomIdStr = String(restaurantId);
    if (restaurantIdRef.current !== roomIdStr) {
      joinRoom(roomIdStr);
    }
  }, [restaurantId, enabled, joinRoom]);

  // If the provided onRatingUpdate callback changes after initialization,
  // re-register it on the service so the latest closure is used.
  useEffect(() => {
    if (!enabled || !onRatingUpdate) return;
    // Only register when connection is ready
    if (signalRService.isConnected()) {
      try {
        signalRService.onRestaurantRatingUpdate(onRatingUpdate);
      } catch (err) {
        console.error("Failed to register rating callback after init:", err);
      }
    }
  }, [onRatingUpdate, enabled]);

  return {
    isConnected: signalRService.isConnected(),
    connectionId: signalRService.getConnectionId(),
    joinRoom,
    disconnect: signalRService.disconnect.bind(signalRService),
  };
}
