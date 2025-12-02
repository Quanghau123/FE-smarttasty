"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

interface ScrollContextType {
  scrollToAllRestaurants: (() => void) | null;
  setScrollToAllRestaurants: (fn: () => void) => void;
}

const noop = () => {};
const ScrollContext = createContext<ScrollContextType>({
  scrollToAllRestaurants: null,
  setScrollToAllRestaurants: noop,
});

export const useScrollContext = () => useContext(ScrollContext);

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [scrollToAllRestaurants, setScrollFn] = useState<(() => void) | null>(
    null
  );

  // Stable setter to avoid changing identity each render
  const setScrollToAllRestaurants = useCallback((fn: () => void) => {
    setScrollFn(() => fn);
  }, []);

  const value = useMemo(
    () => ({ scrollToAllRestaurants, setScrollToAllRestaurants }),
    [scrollToAllRestaurants, setScrollToAllRestaurants]
  );

  return (
    <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
  );
};
