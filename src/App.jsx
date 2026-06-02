import { Routes, Route } from "react-router-dom";
import DemoList from "./pages/DemoList.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InspectionRecords from "./pages/InspectionRecords.jsx";
import Placeholder from "./pages/Placeholder.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoList />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inspection" element={<InspectionRecords />} />
        <Route path="placeholder/:name" element={<Placeholder />} />
      </Route>
    </Routes>
  );
}
