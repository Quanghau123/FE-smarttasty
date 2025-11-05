"use client";

import {
  Box,
  Typography,
  CircularProgress,
  Rating,
  Button,
} from "@mui/material";
import React, { useMemo, useState, useEffect } from "react";
import styles from "./styles.module.scss";
import { useTranslations } from "next-intl";
import { Pagination } from "@mui/material";

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
  const [selectedStar, setSelectedStar] = useState<number | null>(null);

  // counts[1] .. counts[5]
  const counts = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0];
    if (!reviews) return arr;
    for (const r of reviews) {
      const v = Math.round(r.rating);
      if (v >= 1 && v <= 5) arr[v]++;
    }
    return arr;
  }, [reviews]);

  const maskWord = (word: string) => {
    const w = word.trim();
    const len = w.length;
    if (len <= 1) return w;
    if (len === 2) return w[0] + "*";
    return w[0] + "*".repeat(len - 2) + w[len - 1];
  };

  const maskName = (name: string) => {
    if (!name) return name;
    // mask each token (preserve spaces)
    return name
      .split(/(\s+)/) // keep separators so we can join back with same spacing
      .map((part) => (part.trim() === "" ? part : maskWord(part)))
      .join("");
  };

  const filtered = useMemo(() => {
    if (!selectedStar) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStar);
  }, [reviews, selectedStar]);

  // pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.max(
    1,
    Math.ceil((filtered?.length ?? 0) / itemsPerPage)
  );

  useEffect(() => {
    // reset page when filter or reviews change
    setPage(1);
  }, [selectedStar, reviews]);

  const paginated = useMemo(() => {
    if (!filtered) return [] as Review[];
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

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

      {/* Filter and counts */}
      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("filter_by_rating") ?? "Lọc theo số sao"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <Button
              key={n}
              onClick={() => setSelectedStar((s) => (s === n ? null : n))}
              variant={selectedStar === n ? "contained" : "outlined"}
              size="small"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                textTransform: "none",
              }}
            >
              <Typography variant="body2">
                {n} {t("star") ?? "sao"} ({counts[n] ?? 0})
              </Typography>
            </Button>
          ))}

          {selectedStar ? (
            <Button size="small" onClick={() => setSelectedStar(null)}>
              {t("clear") ?? "Bỏ lọc"}
            </Button>
          ) : null}
        </Box>

        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
          {filtered.length} {t("reviews_count_text") ?? "đánh giá hiển thị"}
        </Typography>
      </Box>

      {/* List of reviews (paginated) */}
      {paginated.map((r) => (
        <Box key={r.id} className={styles.reviewCard}>
          <Box className={styles.reviewHeader}>
            <Typography variant="subtitle1" className={styles.reviewer}>
              {maskName(r.userName)}
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

      {/* Pagination controls */}
      {(filtered.length ?? 0) > itemsPerPage ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          {/*
            Condensed pagination: when there are many pages, show first 2 and last 2
            with an ellipsis in between (e.g. 1 2 ... 5 6). We use MUI's
            boundaryCount and siblingCount to control this.
          */}
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
            boundaryCount={totalPages > 4 ? 2 : 1}
            siblingCount={totalPages > 4 ? 0 : 1}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export default ReviewList;
