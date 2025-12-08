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
      variant="outlined"
      sx={{
        height: 300,
        width: 250,
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 200ms ease",
        // "&:hover": { boxShadow: 6 },
      }}
    >
      <Box
        sx={{ position: "relative", width: "100%", height: 160, flexShrink: 0 }}
      >
        <Image
          src={dish.imageUrl}
          alt={dish.name}
          fill
          style={{ objectFit: "cover" }}
        />
      </Box>

      <CardContent
        sx={{
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          flex: 1,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Typography
            variant="h6"
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
          <Stack direction="column" alignItems="flex-end">
            {!dish.isActive && (
              <Chip label="Ngưng bán" color="error" size="small" />
            )}
            {showDiscount && (
              <Chip
                label="KM"
                sx={{ color: "error.main", mt: 1 }}
                size="small"
              />
            )}
          </Stack>
        </Stack>

        <Box mt={0.5}>
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
                fontWeight="bold"
                sx={{ color: "error.main", fontSize: "1rem" }}
              >
                {discountedPrice!.toLocaleString()}đ
              </Typography>
            </Stack>
          ) : (
            <Typography fontWeight="bold" sx={{ color: "text.primary" }}>
              {dish.price.toLocaleString()}đ
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
