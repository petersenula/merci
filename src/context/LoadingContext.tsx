'use client';

import { createContext, useContext, useState } from "react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

const LoadingContext = createContext({
  show: () => {},
  hide: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return (
    <LoadingContext.Provider value={{ show, hide }}>
      {children}
      <LoadingOverlay show={visible} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
