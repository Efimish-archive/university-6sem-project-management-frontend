import "@/index.css";

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import Home from "@/pages/Home";
import Login from "@/pages/Login.tsx";
import NotFound from "@/pages/NotFound";
import RealtimeCheck from "@/pages/RealtimeCheck";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/realtime" element={<RealtimeCheck />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
