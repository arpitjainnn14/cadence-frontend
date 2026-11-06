import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { MotionProvider } from "./ui/MotionProvider";
import { makeQueryClient } from "./data/queries";
import "./index.css";

const useMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true";

async function start() {
  if (useMocks) {
    // Fake backend running inside the browser (see src/mocks). It uses its
    // own service worker, so we don't register sw.js in mock mode: two
    // workers can't both control the same scope.
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  } else if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={makeQueryClient()}>
        <MotionProvider>
          <App />
        </MotionProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

start();
