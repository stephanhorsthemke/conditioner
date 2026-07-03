import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ConditionPage from "./pages/ConditionPage";
import StartingPointPage from "./pages/StartingPointPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/start/:id" element={<StartingPointPage />} />
        <Route path="/condition/:id" element={<ConditionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
