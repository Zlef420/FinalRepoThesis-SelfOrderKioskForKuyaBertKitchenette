import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SharedStateProvider } from "./context/SharedStateContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SharedStateProvider>
      <App />
    </SharedStateProvider>
  </StrictMode>
);
