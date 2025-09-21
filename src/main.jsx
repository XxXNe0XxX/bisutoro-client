import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Load fonts so CSS variables can reference them
import "@fontsource-variable/inter";
import "@fontsource/lusitana";
import "@fontsource/istok-web";
import "@fontsource-variable/oswald";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { BrowserRouter } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
