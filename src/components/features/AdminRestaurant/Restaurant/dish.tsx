"use client";

import Image from "next/image";
import { Card, CardContent, Box, Stack, Typography, Chip } from "@mui/material";
import type { Dish } from "@/types/dish";

type Props = {
  dish: Dish;
  discountedPrice?: number | null;
};

export default function DishCard({ dish, discountedPrice }: Props) {
  const showDiscount =
    discountedPrice !== null &&
    discountedPrice !== undefined &&
    discountedPrice < dish.price;

  return (
    <Card
      elevation={4}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: (theme) => `0 10px 30px ${theme.palette.grey[900]}1a`,
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => `0 16px 36px ${theme.palette.grey[900]}26`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          pt: "62%",
          flexShrink: 0,
          overflow: "hidden",
          bgcolor: "grey.50",
        }}
      >
        <Image
          src={dish.imageUrl}
          alt={dish.name}
          fill
          style={{ objectFit: "cover" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: "absolute", top: 12, left: 12, zIndex: 1 }}
        >
          {showDiscount && (
            <Chip
              label="KM"
              color="error"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: "error.main",
                color: "common.white",
              }}
            />
          )}
        </Stack>
      </Box>

      <CardContent
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: 1,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1.5}
        >
          <Typography
            sx={{
              fontSize: "1rem",
              margin: 0,
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {dish.name}
          </Typography>
          <Typography
            variant="body2"
            color={dish.isActive ? "success.main" : "error.main"}
            fontWeight={600}
          >
            {dish.isActive ? "Đang bán" : "Tạm dừng"}
          </Typography>
        </Stack>

        <Box>
          {showDiscount ? (
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                sx={{
                  textDecoration: "line-through",
                  color: "text.secondary",
                  fontSize: "0.9rem",
                }}
              >
                {dish.price.toLocaleString()}đ
              </Typography>
              <Typography
                fontWeight={700}
                sx={{ color: "error.main", fontSize: "1.05rem" }}
              >
                {discountedPrice!.toLocaleString()}đ
              </Typography>
            </Stack>
          ) : (
            <Typography fontWeight={700} sx={{ color: "text.primary" }}>
              {dish.price.toLocaleString()}đ
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
