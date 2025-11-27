"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { IconButton } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import MailIcon from "@mui/icons-material/Mail";
import FacebookIcon from "@mui/icons-material/Facebook";
import { SiTiktok } from "react-icons/si";

const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[var(--footer-bg)] text-[var(--text-color)]">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row md:justify-center md:items-start gap-12">
          <div className="md:w-1/3">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="text-xl font-bold">SmartTasty</div>
                <div className="text-sm opacity-80">{t("tagline")}</div>
              </div>
            </div>

            <p className="text-sm opacity-80 leading-relaxed">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <div className="font-semibold mb-3">{t("aboutus_btn_title")}</div>
              <ul className="text-sm opacity-80 space-y-2">
                <li>
                  <Link href="#" className="hover:text-primary">
                    {t("link_intro")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    {t("link_careers")}
                  </Link>
                </li>
                <li>
                  <Link href="contact" className="hover:text-primary">
                    {t("link_contact")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-3">
                {t("followme_btn_title")}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex flex-row items-center">
                  <IconButton
                    component={Link}
                    href="/"
                    className="w-10 h-10 text-[var(--text-color)] opacity-80"
                  >
                    <FacebookIcon />
                  </IconButton>
                  <p className="text-[var(--text-color)] opacity-80">
                    Facebook
                  </p>
                </div>
                <div className="flex flex-row items-center">
                  <IconButton
                    component={Link}
                    href="/"
                    className="w-10 h-10 text-[var(--text-color)] opacity-80"
                  >
                    <SiTiktok />
                  </IconButton>
                  <p className="text-[var(--text-color)] opacity-80">TikTok</p>
                </div>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-3">
                {t("contactus_btn_title")}
              </div>
              <ul className="text-sm opacity-80 space-y-2">
                <li className="flex items-center gap-2">
                  <LocationOnIcon className="text-[var(--text-color)] opacity-80" />
                  <span>
                    12 Nguyễn Văn Bảo, phường Hạnh Thông, Quận Gò Vấp, TP.HCM
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <MailIcon className="text-[var(--text-color)] opacity-80" />
                  <a href="#" className="hover:text-primary">
                    admin@smarttasty.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="text-[var(--text-color)] opacity-80" />
                  <a href="#" className="hover:text-primary">
                    0399999999
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="mt-5 border-t pt-5 text-center text-sm opacity-70"
          style={{ borderColor: "var(--border-color)" }}
        >
          © {new Date().getFullYear()} SmartTasty. All rights reserved. &nbsp; •
          &nbsp;{" "}
          <Link href="/privacy" className="hover:text-primary">
            {t("privacy_policy")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
