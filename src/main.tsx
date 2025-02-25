import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
      <App />
    </ClerkProvider>
  </StrictMode>,
);
