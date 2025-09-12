"use client";

import Link from "next/link";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  FacebookFilled,
  MailOutlined,
} from "@ant-design/icons";
import { SiTiktok } from "react-icons/si";
import styles from "@/components/layouts/Footer/styles.module.scss";

console.log("Styles loaded: ", styles);

const Footer = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.yard}>
        {/* Liên hệ */}
        <div className={styles.areaLeft}>
          <div className={styles.blockTitle}>
            <span>Liên Hệ Với Chúng Tôi</span>
            <hr />
          </div>

          <div className={styles.blockAddress}>
            <Link href="/" className={styles.linkAddress}>
              <EnvironmentOutlined style={{ marginRight: 10 }} />
              <span>Địa Chỉ Các Chi Nhánh</span>
            </Link>
          </div>
          <div className={styles.blockEmail}>
            <Link href="mailto:admin@gmail.com" className={styles.linkEmail}>
              <MailOutlined style={{ marginRight: 10 }} />
              <span>admin@gmail.com</span>
            </Link>
          </div>
          <div className={styles.blockPhone}>
            <Link href="tel:0987654321" className={styles.linkPhone}>
              <PhoneOutlined style={{ marginRight: 10 }} />
              <span>0987654321</span>
            </Link>
          </div>
        </div>

        {/* Về chúng tôi */}
        <div className={styles.areaBetween}>
          <div className={styles.blockTitle}>
            <span>Về Chúng Tôi</span>
            <hr />
          </div>
          <div className={styles.blockContent}>
            <span>Đội ngũ vận hành</span>
          </div>
        </div>

        {/* Mạng xã hội */}
        <div className={styles.blockContact}>
          <div className={styles.blockTitle}>
            <span>Theo dõi qua</span>
            <hr />
          </div>
          <div className={styles.blockFacebook}>
            <Link href="/" className={styles.linkFacebook}>
              <FacebookFilled style={{ fontSize: 30, color: "#1877F2" }} />
            </Link>
            <Link href="/" className={styles.linkTiktok}>
              <SiTiktok style={{ fontSize: 30, color: "#fff" }} />
            </Link>
          </div>
        </div>

        {/* Giờ mở cửa */}
        <div className={styles.areaRight}>
          <div className={styles.blockTitle}>
            <span>Giờ Mở Cửa</span>
            <hr />
          </div>
          <div className={styles.blockContent}>
            <span>
              Hằng Ngày
              <br />
              07:00 AM - 23:00 PM
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
