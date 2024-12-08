import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./assets/fonts/Vazirmatn-Bold.ttf";
import "./assets/fonts/Vazirmatn-Medium.ttf";
import "./assets/fonts/Vazirmatn-Regular.ttf";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
