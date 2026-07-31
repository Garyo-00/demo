import { Routes, Route } from "react-router-dom";
import DemoList from "./pages/DemoList.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InspectionRecords from "./pages/InspectionRecords.jsx";
import ApprovalRequests from "./pages/ApprovalRequests.jsx";
import WorkPlanLayout from "./components/WorkPlanLayout.jsx";
import WorkPlanDashboard from "./pages/WorkPlanDashboard.jsx";
import WorkPlanSettings from "./pages/WorkPlanSettings.jsx";
import WorkPlanFloorPlanSetting from "./pages/WorkPlanFloorPlanSetting.jsx";
import WorkPlanApprovalFlowSetting from "./pages/WorkPlanApprovalFlowSetting.jsx";
import WorkAdjustLayout from "./components/WorkAdjustLayout.jsx";
import WorkAdjustSchedule from "./pages/WorkAdjustSchedule.jsx";
import WorkAdjustReservation from "./pages/WorkAdjustReservation.jsx";
import WorkAdjustReserveExport from "./pages/WorkAdjustReserveExport.jsx";
import WorkAdjustFloorPlan from "./pages/WorkAdjustFloorPlan.jsx";
import WorkAdjustActualQr from "./pages/WorkAdjustActualQr.jsx";
import WorkAdjustReserveQr from "./pages/WorkAdjustReserveQr.jsx";
import WorkAdjustReservePortal from "./pages/WorkAdjustReservePortal.jsx";
import WorkAdjustActualInput from "./pages/WorkAdjustActualInput.jsx";
import WorkAdjustRegistry from "./pages/WorkAdjustRegistry.jsx";
import WorkAdjustFloorPlanSetting from "./pages/WorkAdjustFloorPlanSetting.jsx";
import WorkAdjustCompanies from "./pages/WorkAdjustCompanies.jsx";
import WorkAdjustSettings from "./pages/WorkAdjustSettings.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import InspectionRun from "./pages/InspectionRun.jsx";
import WorkPlanOutputPreview from "./pages/WorkPlanOutputPreview.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoList />} />
      <Route path="/inspection-run" element={<InspectionRun />} />
      {/* 作業計画書 出力イメージ（A3横 改ページプレビュー・独立ページ） */}
      <Route path="/workplan/output-preview" element={<WorkPlanOutputPreview />} />
      {/* QR読み取り後の作業実績入力（サイドバー無しの独立ページ） */}
      <Route path="/workadjust/actual-input" element={<WorkAdjustActualInput />} />
      {/* 資機材・ゲート予約用QR読み取り後の予約ポータル（サイドバー無しの独立ページ） */}
      <Route path="/workadjust/reserve" element={<WorkAdjustReservePortal />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inspection" element={<InspectionRecords />} />
        <Route path="approval" element={<ApprovalRequests />} />
        <Route path="placeholder/:name" element={<Placeholder />} />
      </Route>
      <Route path="/workplan" element={<WorkPlanLayout />}>
        <Route index element={<WorkPlanDashboard />} />
        <Route path="approval" element={<ApprovalRequests />} />
        <Route path="settings" element={<WorkPlanSettings />} />
        <Route path="settings/floor-plan" element={<WorkPlanFloorPlanSetting />} />
        <Route path="settings/approval-flow" element={<WorkPlanApprovalFlowSetting />} />
        <Route path="placeholder/:name" element={<Placeholder />} />
      </Route>
      <Route path="/workadjust" element={<WorkAdjustLayout />}>
        <Route index element={<WorkAdjustSchedule />} />
        <Route path="reservation" element={<WorkAdjustReservation />} />
        <Route path="reserve-export" element={<WorkAdjustReserveExport />} />
        <Route path="floor-plan" element={<WorkAdjustFloorPlan />} />
        <Route path="actual-qr" element={<WorkAdjustActualQr />} />
        <Route path="reserve-qr" element={<WorkAdjustReserveQr />} />
        <Route path="floor-plan-setting" element={<WorkAdjustFloorPlanSetting />} />
        <Route path="registry" element={<WorkAdjustRegistry />} />
        <Route path="companies" element={<WorkAdjustCompanies />} />
        <Route path="settings" element={<WorkAdjustSettings />} />
        <Route path="placeholder/:name" element={<Placeholder />} />
      </Route>
    </Routes>
  );
}
