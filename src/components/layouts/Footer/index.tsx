"use client";

import Link from "next/link";
import { IconButton } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import MailIcon from "@mui/icons-material/Mail";
import FacebookIcon from "@mui/icons-material/Facebook";
import { SiTiktok } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[var(--background-phs)] to-[rgba(0,0,0,0.6)] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          <div className="md:w-1/3">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="text-xl font-bold">SmartTasty</div>
                <div className="text-sm text-white/80">
                  Ngon miệng, giao nhanh
                </div>
              </div>
            </div>

            <p className="text-sm text-white/80 leading-relaxed">
              SmartTasty — nền tảng đặt món, giao hàng nhanh. Tìm nhà hàng gần
              bạn và đặt món yêu thích chỉ trong vài bước.
            </p>

            <div className="flex items-center mt-4 gap-3">
              <IconButton
                component={Link}
                href="/"
                className="w-10 h-10 bg-white/10 text-white hover:bg-white/20"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component={Link}
                href="/"
                className="w-10 h-10 bg-white/10 text-white hover:bg-white/20"
              >
                <SiTiktok size={18} />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:w-2/3">
            <div>
              <div className="font-semibold mb-3">Liên hệ</div>
              <ul className="text-sm text-white/80 space-y-2">
                <li className="flex items-center gap-2">
                  <LocationOnIcon className="text-white/80" />
                  <span>123 Đường A, Quận B</span>
                </li>
                <li className="flex items-center gap-2">
                  <MailIcon className="text-white/80" />
                  <a
                    href="mailto:admin@gmail.com"
                    className="hover:text-primary"
                  >
                    admin@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="text-white/80" />
                  <a href="tel:0987654321" className="hover:text-primary">
                    0987654321
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-3">Về chúng tôi</div>
              <ul className="text-sm text-white/80 space-y-2">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-primary">
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-3">Nhận tin</div>
              <p className="text-sm text-white/80 mb-3">
                Đăng ký nhận ưu đãi và tin tức mới nhất
              </p>
              <div className="flex gap-2">
                <input
                  aria-label="email"
                  placeholder="Email của bạn"
                  className="w-full px-3 py-2 rounded-md bg-white/10 placeholder-white/60 text-white outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="px-4 py-2 rounded-md bg-primary text-white hover:opacity-90">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/70">
          © {new Date().getFullYear()} SmartTasty. All rights reserved. &nbsp; •
          &nbsp;{" "}
          <Link href="/privacy" className="hover:text-white">
            Chính sách bảo mật
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
