import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { AppClerkProvider } from "./providers/ClerkProvider";
import { AppQueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppClerkProvider>
      <AppQueryProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AppQueryProvider>
    </AppClerkProvider>
  </React.StrictMode>,
);