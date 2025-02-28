import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ClerkProvider, UserButton } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Floating UserButton component
const FloatingUserButton = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <UserButton />
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: window.matchMedia("(prefers-color-scheme: dark)").matches
            ? dark
            : undefined,
          variables: {
            colorPrimary: "#E84A27",
            colorTextOnPrimaryBackground: "#FFFFFF",
          },
        }}
      >
        <FloatingUserButton />
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </StrictMode>,
);
