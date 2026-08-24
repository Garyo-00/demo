import { Routes, Route, Navigate } from "react-router-dom";
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
import WorkPlanNeoLayout from "./components/WorkPlanNeoLayout.jsx";
import WorkPlanNeoTemplates from "./pages/WorkPlanNeoTemplates.jsx";
import WorkPlanNeoTemplateForm from "./pages/WorkPlanNeoTemplateForm.jsx";
import WorkPlanNeoBlank from "./pages/WorkPlanNeoBlank.jsx";
import WorkPlanNeoSettings from "./pages/WorkPlanNeoSettings.jsx";
import WorkPlanNeoQr from "./pages/WorkPlanNeoQr.jsx";
import WorkPlanNeoSign from "./pages/WorkPlanNeoSign.jsx";
import WorkPlanNeoPlans from "./pages/WorkPlanNeoPlans.jsx";
import WorkPlanNeoPlanNew from "./pages/WorkPlanNeoPlanNew.jsx";
import WorkPlanNeoPlanDetail from "./pages/WorkPlanNeoPlanDetail.jsx";
import WorkAdjustLayout from "./components/WorkAdjustLayout.jsx";
import WorkAdjustSchedule from "./pages/WorkAdjustSchedule.jsx";
import WorkAdjustReservation from "./pages/WorkAdjustReservation.jsx";
import WorkAdjustReserveExport from "./pages/WorkAdjustReserveExport.jsx";
import WorkAdjustFloorPlan from "./pages/WorkAdjustFloorPlan.jsx";
import WorkAdjustQr from "./pages/WorkAdjustQr.jsx";
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
      {/* 打合せサイン用QR読み取り後のサイン画面（サイドバー無しの独立ページ） */}
      <Route path="/workplan-neo/sign" element={<WorkPlanNeoSign />} />
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
      {/* 作業計画書NEO（現時点はテンプレート設定のみ実装。他メニューは空ページ） */}
      <Route path="/workplan-neo" element={<WorkPlanNeoLayout />}>
        <Route index element={<Navigate to="/workplan-neo/plans" replace />} />
        <Route path="templates" element={<WorkPlanNeoTemplates />} />
        <Route path="templates/new" element={<WorkPlanNeoTemplateForm />} />
        <Route path="templates/:id" element={<WorkPlanNeoTemplateForm />} />
        <Route path="plans" element={<WorkPlanNeoPlans />} />
        <Route path="plans/new" element={<WorkPlanNeoPlanNew />} />
        <Route path="plans/:id" element={<WorkPlanNeoPlanDetail />} />
        <Route path="floor-plan" element={<WorkPlanNeoBlank />} />
        <Route path="approval-flow" element={<WorkPlanNeoBlank />} />
        <Route path="settings" element={<WorkPlanNeoSettings />} />
        <Route path="qr" element={<WorkPlanNeoQr />} />
        <Route path="manual" element={<WorkPlanNeoBlank />} />
      </Route>
      <Route path="/workadjust" element={<WorkAdjustLayout />}>
        <Route index element={<WorkAdjustSchedule />} />
        <Route path="reservation" element={<WorkAdjustReservation />} />
        <Route path="reserve-export" element={<WorkAdjustReserveExport />} />
        <Route path="floor-plan" element={<WorkAdjustFloorPlan />} />
        <Route path="qr" element={<WorkAdjustQr />} />
        <Route path="floor-plan-setting" element={<WorkAdjustFloorPlanSetting />} />
        <Route path="registry" element={<WorkAdjustRegistry />} />
        <Route path="companies" element={<WorkAdjustCompanies />} />
        <Route path="settings" element={<WorkAdjustSettings />} />
        <Route path="placeholder/:name" element={<Placeholder />} />
      </Route>
    </Routes>
  );
}
