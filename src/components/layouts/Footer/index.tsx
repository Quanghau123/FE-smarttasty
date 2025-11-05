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
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
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

            <div className="flex items-center mt-4 gap-3">
              <IconButton
                component={Link}
                href="/"
                className="w-10 h-10 bg-[rgba(0,0,0,0.06)] text-[var(--text-color)] hover:opacity-80"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component={Link}
                href="/"
                className="w-10 h-10 bg-[rgba(0,0,0,0.06)] text-[var(--text-color)] hover:opacity-80"
              >
                <SiTiktok size={18} />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:w-2/3">
            <div>
              <div className="font-semibold mb-3">
                {t("contactus_btn_title")}
              </div>
              <ul className="text-sm opacity-80 space-y-2">
                <li className="flex items-center gap-2">
                  <LocationOnIcon className="text-[var(--text-color)] opacity-80" />
                  <span>123 Đường A, Quận B</span>
                </li>
                <li className="flex items-center gap-2">
                  <MailIcon className="text-[var(--text-color)] opacity-80" />
                  <a
                    href="mailto:admin@gmail.com"
                    className="hover:text-primary"
                  >
                    admin@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="text-[var(--text-color)] opacity-80" />
                  <a href="tel:0987654321" className="hover:text-primary">
                    0987654321
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-3">{t("aboutus_btn_title")}</div>
              <ul className="text-sm opacity-80 space-y-2">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    {t("link_intro")}
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-primary">
                    {t("link_careers")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    {t("link_contact")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-3">
                {t("followme_btn_title")}
              </div>
              <p className="text-sm opacity-80 mb-3">{t("subscribe_text")}</p>
              <div className="flex gap-2">
                <input
                  aria-label="email"
                  placeholder={t("subscribe_placeholder")}
                  className="w-full px-3 py-2 rounded-md outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--button-bg)",
                    color: "var(--text-color)",
                  }}
                />
                <button
                  className="px-4 py-2 rounded-md hover:opacity-90"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--text-color)",
                  }}
                >
                  {t("subscribe_button")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-10 border-t pt-6 text-center text-sm opacity-70"
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
