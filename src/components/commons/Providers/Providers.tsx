"use client";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";
import { MuiProviders } from "@/components/commons/Providers/MuiProviders";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <MuiProviders>{children}</MuiProviders>
    </ReduxProvider>
  );
}
