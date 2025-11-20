"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import LanguageIcon from "@mui/icons-material/Language";

const locales = ["en", "vi"];

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (locale: string) => {
    const segments = pathname.split("/");

    if (locales.includes(segments[1])) {
      segments[1] = locale;
    } else {
      segments.splice(1, 0, locale);
    }

    router.replace(segments.join("/") || "/");
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-transparent text-text hover:bg-button-hover transition duration-300 ease-in-out border-none focus:outline-none"
        aria-label="Change language"
      >
        <LanguageIcon />
      </button>

      {isOpen && (
        <ul
          className="absolute right-0 mt-2 w-32 text-text z-50 rounded-lg"
          style={{
            backgroundColor: "var(--button-bg)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            padding: 8,
          }}
        >
          {locales.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => handleChange(lang)}
                className="block w-full mb-1 py-2 px-4 hover:bg-button-hover text-sm rounded-md transition duration-300 border border-[var(--border-color)] text-left focus:outline-none"
                style={{
                  backgroundColor: "var(--button-bg)",
                }}
              >
                {lang === "vi" ? "Tiếng Việt" : "English"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
