"use client";

import Image from "next/image";
import { Card, CardContent, Box, Stack, Typography, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import type { Dish } from "@/types/dish";

type Props = {
  dish: Dish;
  discountedPrice?: number | null;
};

export default function DishCard({ dish, discountedPrice }: Props) {
  const router = useRouter();
  const showDiscount =
    discountedPrice !== null &&
    discountedPrice !== undefined &&
    discountedPrice < dish.price;

  return (
    <Card
      variant="outlined"
      sx={{
        // fixed frame so all cards are uniform
        height: 300,
        width: 250,
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 200ms ease",
        "&:hover": { boxShadow: 6 },
      }}
    >
      {/* image area fixed */}
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
      {/* content area fixed height so it cannot expand */}
      <CardContent
        sx={{
          p: 1.5,
          // keep content stacked from the top so title and price sit close together
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
              <Chip label="KM" color="secondary" size="small" sx={{ mt: 1 }} />
            )}
          </Stack>
        </Stack>

        <Box mt={0.5}>
          {showDiscount ? (
            <>
              <Typography
                sx={{ textDecoration: "line-through", color: "#777" }}
              >
                {dish.price.toLocaleString()}đ
              </Typography>
              <Typography fontWeight="bold" color="primary">
                {discountedPrice!.toLocaleString()}đ
              </Typography>
            </>
          ) : (
            <Typography fontWeight="bold" color="primary">
              {dish.price.toLocaleString()}đ
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
