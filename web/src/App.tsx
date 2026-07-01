import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import ConditionList from "./pages/ConditionList";
import ConditionPage from "./pages/ConditionPage";
import StartingPointPage from "./pages/StartingPointPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConditionList spaceId="main" />} />
        <Route path="/space/ibs" element={<Navigate to="/start/ibs" replace />} />
        <Route path="/space/brain_fog" element={<Navigate to="/start/brain_fog" replace />} />
        <Route path="/space/:spaceId" element={<ConditionList />} />
        <Route path="/start/:id" element={<StartingPointPage />} />
        <Route path="/condition/:id" element={<ConditionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
