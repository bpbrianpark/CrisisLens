import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Livepeer } from "livepeer";
import "./index.css";
import App from "./App.jsx";

// eslint-disable-next-line no-unused-vars
const livepeer = new Livepeer({
  apiKey: import.meta.env.VITE_LIVEPEER_API_KEY,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
