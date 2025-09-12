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
        className="flex items-center gap-2 rounded-full bg-button border border-border text-text hover:bg-button-hover transition duration-300 ease-in-out"
      >
        <LanguageIcon />
      </button>

      {isOpen && (
        <ul className="absolute mt-2 w-32 bg-transparent text-text z-50 rounded-lg">
          {locales.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => handleChange(lang)}
                className="block w-full text-left mb-1 py-2 px-4 hover:bg-button-hover text-sm rounded-md transition duration-300"
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
