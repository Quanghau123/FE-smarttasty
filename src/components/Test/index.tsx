"use client";
import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

interface RatingData {
  restaurantId: string;
  averageRating: number;
  totalReviews: number;
}

interface RestaurantRatingUpdate {
  restaurantId: number;
  averageRating: number;
  totalReviews: number;
}

interface SignalRMessage<T> {
  type: string;
  data: T;
}

export default function RestaurantRating({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [rating, setRating] = useState<RatingData>({
    restaurantId,
    averageRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://socket.smart-tasty.io.vn/hubs/notification")
      .withAutomaticReconnect()
      .build();

    const fetchInitialRating = async () => {
  try {
    const res = await fetch(
      `https://api.smart-tasty.io.vn/api/Restaurant/${restaurantId}`
    );
    const json = await res.json();

    // check json.data và json.data.restaurant có tồn tại
    if (json.errCode === "success" && json.data?.restaurant) {
      setRating({
        restaurantId: restaurantId,
        averageRating: json.data.restaurant.averageRating ?? 0,
        totalReviews: json.data.totalReviews ?? 0,
      });
    } else {
      console.warn("Restaurant data not found", json);
      setRating({
        restaurantId,
        averageRating: 0,
        totalReviews: 0,
      });
    }
  } catch (err) {
    console.error("Lỗi khi tải rating ban đầu:", err);
  }
};

    fetchInitialRating();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("Connected to SignalR hub");
        await connection.invoke("JoinRestaurantRoom", restaurantId);
      } catch (err) {
        console.error("Connection error:", err);
        setTimeout(startConnection, 3000);
      }
    };

    startConnection();

    connection.on(
      "ReceiveRestaurantUpdate",
      (message: SignalRMessage<RestaurantRatingUpdate>) => {
        if (message?.type === "restaurant_rating_update") {
          const data = message.data;
          if (data.restaurantId.toString() === restaurantId) {
            setRating({
              restaurantId,
              averageRating: data.averageRating,
              totalReviews: data.totalReviews,
            });
          }
        }
      }
    );

    return () => {
      connection.off("ReceiveRestaurantUpdate");
      connection.stop();
    };
  }, [restaurantId]);

  return (
    <div className="p-4 border rounded-2xl shadow-md bg-white text-center w-72">
      <h2 className="text-xl font-semibold mb-2">⭐ Đánh giá nhà hàng</h2>
      <p className="text-yellow-500 text-2xl font-bold">
        {rating.averageRating.toFixed(1)} / 5
      </p>
      <p className="text-gray-500 text-sm">
        {rating.totalReviews} lượt đánh giá
      </p>
    </div>
  );
}
