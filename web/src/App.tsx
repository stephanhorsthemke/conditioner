import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import ConditionList from "./pages/ConditionList";
import ConditionPage from "./pages/ConditionPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConditionList spaceId="main" />} />
        <Route path="/space/ibs" element={<Navigate to="/condition/ibs" replace />} />
        <Route path="/space/:spaceId" element={<ConditionList />} />
        <Route path="/condition/:id" element={<ConditionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
