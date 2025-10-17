"use client";

import Link from "next/link";
import { Typography, Divider, IconButton } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import MailIcon from "@mui/icons-material/Mail";
import FacebookIcon from "@mui/icons-material/Facebook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { SiTiktok } from "react-icons/si";

import styles from "./styles.module.scss";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        {/* Liên hệ */}
        <div className={styles.section}>
          <Typography variant="h6" gutterBottom>
            Liên Hệ Với Chúng Tôi
          </Typography>
          <Divider className={styles.divider} />

          <Link href="/" className={styles.link}>
            <LocationOnIcon className={styles.icon} />
            <Typography>Địa Chỉ Các Chi Nhánh</Typography>
          </Link>

          <Link href="mailto:admin@gmail.com" className={styles.link}>
            <MailIcon className={styles.icon} />
            <Typography>admin@gmail.com</Typography>
          </Link>

          <Link href="tel:0987654321" className={styles.link}>
            <PhoneIcon className={styles.icon} />
            <Typography>0987654321</Typography>
          </Link>
        </div>

        {/* Về chúng tôi */}
        <div className={styles.section}>
          <Typography variant="h6" gutterBottom>
            Về Chúng Tôi
          </Typography>
          <Divider className={styles.divider} />
          <Typography>Đội ngũ vận hành</Typography>
        </div>

        {/* Mạng xã hội */}
        <div className={styles.section}>
          <Typography variant="h6" gutterBottom>
            Theo dõi qua
          </Typography>
          <Divider className={styles.divider} />
          <div className={styles.socials}>
            <IconButton component={Link} href="/" className={styles.facebook}>
              <FacebookIcon fontSize="large" />
            </IconButton>
            <IconButton component={Link} href="/" className={styles.tiktok}>
              <SiTiktok size={28} />
            </IconButton>
          </div>
        </div>

        {/* Giờ mở cửa */}
        <div className={styles.section}>
          <Typography variant="h6" gutterBottom>
            Giờ Mở Cửa
          </Typography>
          <Divider className={styles.divider} />
          <div className={styles.opening}>
            <AccessTimeIcon className={styles.icon} />
            <Typography>
              Hằng Ngày
              <br />
              07:00 AM - 23:00 PM
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
