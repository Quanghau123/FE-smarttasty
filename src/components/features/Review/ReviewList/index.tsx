"use client";

import { Box, Typography, CircularProgress, Rating } from "@mui/material";
import styles from "./styles.module.scss";
import { useTranslations } from "next-intl";

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  error?: string | null;
}

const ReviewList = ({ reviews, loading, error }: ReviewListProps) => {
  const t = useTranslations("review");

  if (loading) return <CircularProgress />;
  if (error) {
    return (
      <Typography color="error">
        {error === "No reviews found" ? t("no_reviews") : error}
      </Typography>
    );
  }

  if (!reviews || reviews.length === 0) {
    return <Typography>{t("no_reviews")}</Typography>;
  }

  return (
    <Box className={styles.reviewList}>
      <Typography variant="h5" className={styles.sectionTitle}>
        {t("list_title")}
      </Typography>

      {reviews.map((r) => (
        <Box key={r.id} className={styles.reviewCard}>
          <Box className={styles.reviewHeader}>
            <Typography variant="subtitle1" className={styles.reviewer}>
              {r.userName}
            </Typography>
            <Typography variant="caption" className={styles.date}>
              {new Date(r.createdAt).toLocaleString()}
            </Typography>
          </Box>

          {/* ⭐ Rating component của MUI */}
          <Rating
            name={`review-${r.id}`}
            value={r.rating}
            // precision={0.5} // cho phép nửa sao, có thể bỏ nếu muốn chỉ nguyên sao
            readOnly
            size="small"
            sx={{ color: "var(--star-color)" }}
          />

          <Typography className={styles.comment}>{r.comment}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ReviewList;
