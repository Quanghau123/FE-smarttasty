"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, List, ListItemButton, Paper, TextField } from "@mui/material";
import { toast } from "react-toastify";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { [k: string]: string };
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect: (address: string, lat: number, lon: number) => void;
  placeholder?: string;
  preserveHouseNumber?: boolean;
};

const AddressAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  onSelect,
  placeholder,
  preserveHouseNumber = true,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!value || !value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        // lấy tại HCM
        const hcmcViewbox = `106.45,10.50,106.95,11.05`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&addressdetails=1&limit=5&viewbox=${hcmcViewbox}&bounded=1`,
          { signal: abortRef.current.signal }
        );
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name !== "AbortError") {
          toast.error("Lỗi khi lấy gợi ý địa chỉ");
        }
      }
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const s = suggestions[activeIndex];
        const house = s.address?.house_number;
        const road =
          s.address?.road ||
          s.address?.pedestrian ||
          s.address?.residential ||
          "";
        const city =
          s.address?.city || s.address?.town || s.address?.village || "";
        let label =
          house && road
            ? `${house} ${road}${city ? `, ${city}` : ""}`
            : s.display_name;
        if (preserveHouseNumber && value) {
          const m = value.match(/^\s*([0-9]+[A-Za-z0-9\-\/]*)\b/);
          if (m) {
            const typedHouse = m[1];
            const re = new RegExp(`^\s*${typedHouse}\b`);
            if (!re.test(label)) {
              label = `${typedHouse} ${label}`;
            }
          }
        }
        onSelect(label, parseFloat(s.lat), parseFloat(s.lon));
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Box position="relative">
      <TextField
        fullWidth
        label={placeholder || "Địa chỉ"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && setOpen(suggestions.length > 0)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        InputProps={{
          readOnly: false,
        }}
      />

      {open && (
        <Paper
          elevation={3}
          sx={{ position: "absolute", left: 0, right: 0, zIndex: 1200, mt: 1 }}
        >
          <List dense>
            {suggestions.map((s, idx) => {
              const house = s.address?.house_number;
              const road =
                s.address?.road ||
                s.address?.pedestrian ||
                s.address?.residential ||
                "";
              const city =
                s.address?.city || s.address?.town || s.address?.village || "";
              const label =
                house && road
                  ? `${house} ${road}${city ? `, ${city}` : ""}`
                  : s.display_name;

              return (
                <ListItemButton
                  key={`${s.lat}-${s.lon}-${idx}`}
                  selected={idx === activeIndex}
                  onMouseDown={(ev) => ev.preventDefault()} 
                  onClick={() => {
                    let finalLabel = label;
                    if (preserveHouseNumber && value) {
                      const m = value.match(/^\s*([0-9]+[A-Za-z0-9\-\/]*)\b/);
                      if (m) {
                        const typedHouse = m[1];
                        const re = new RegExp(`^\s*${typedHouse}\b`);
                        if (!re.test(finalLabel)) {
                          finalLabel = `${typedHouse} ${finalLabel}`;
                        }
                      }
                    }
                    onSelect(finalLabel, parseFloat(s.lat), parseFloat(s.lon));
                    setOpen(false);
                  }}
                >
                  {label}
                </ListItemButton>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default AddressAutocomplete;
