"use client";

import Link from "next/link";
import { Box, Typography, Divider, IconButton } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import MailIcon from "@mui/icons-material/Mail";
import FacebookIcon from "@mui/icons-material/Facebook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { SiTiktok } from "react-icons/si";

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: "#111", color: "#fff", p: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: 4,
        }}
      >
        {/* Liên hệ */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Liên Hệ Với Chúng Tôi
          </Typography>
          <Divider sx={{ bgcolor: "gray", mb: 2 }} />

          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            <LocationOnIcon sx={{ mr: 1 }} />
            <Typography>Địa Chỉ Các Chi Nhánh</Typography>
          </Link>

          <Link
            href="mailto:admin@gmail.com"
            style={{
              display: "flex",
              alignItems: "center",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            <MailIcon sx={{ mr: 1 }} />
            <Typography>admin@gmail.com</Typography>
          </Link>

          <Link
            href="tel:0987654321"
            style={{ display: "flex", alignItems: "center", color: "#fff" }}
          >
            <PhoneIcon sx={{ mr: 1 }} />
            <Typography>0987654321</Typography>
          </Link>
        </Box>

        {/* Về chúng tôi */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Về Chúng Tôi
          </Typography>
          <Divider sx={{ bgcolor: "gray", mb: 2 }} />
          <Typography>Đội ngũ vận hành</Typography>
        </Box>

        {/* Mạng xã hội */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Theo dõi qua
          </Typography>
          <Divider sx={{ bgcolor: "gray", mb: 2 }} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <IconButton component={Link} href="/" sx={{ color: "#1877F2" }}>
              <FacebookIcon fontSize="large" />
            </IconButton>
            <IconButton component={Link} href="/" sx={{ color: "#fff" }}>
              <SiTiktok size={28} />
            </IconButton>
          </Box>
        </Box>

        {/* Giờ mở cửa */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Giờ Mở Cửa
          </Typography>
          <Divider sx={{ bgcolor: "gray", mb: 2 }} />
          <Box display="flex" alignItems="center" gap={1}>
            <AccessTimeIcon />
            <Typography>
              Hằng Ngày
              <br />
              07:00 AM - 23:00 PM
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
