"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  createReview,
  getReviewsByRestaurant,
} from "@/redux/slices/reviewSlice";
import { Box, Button, TextField, Rating, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

const ReviewForm = () => {
  const dispatch = useAppDispatch();
  const { current: restaurant } = useAppSelector((state) => state.restaurant);
  const t = useTranslations("review");

  const [userId, setUserId] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  // Lấy userId từ localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.userId);
      }
    } catch (err) {
      console.error("Không đọc được user từ localStorage:", err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !restaurant?.id) {
      toast.error(t("error_missing_info"));
      return;
    }

    const payload = {
      userId,
      restaurantId: restaurant.id,
      rating: rating ?? 0,
      comment,
    };

    try {
      await dispatch(createReview(payload)).unwrap();
      toast.success(t("success_message"));
      setRating(null);
      setComment("");

      await dispatch(getReviewsByRestaurant(restaurant.id));
    } catch (err) {
      console.error("❌ Lỗi khi gửi review:", err);
      toast.error(t("error_message"));
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      mt={4}
      sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}
    >
      <Typography variant="h6">{t("form_title")}</Typography>

      <Rating value={rating} onChange={(_, newValue) => setRating(newValue)} />

      <TextField
        label={t("comment_label")}
        multiline
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={!userId || !restaurant}
      >
        {t("submit_button")}
      </Button>
    </Box>
  );
};

export default ReviewForm;
