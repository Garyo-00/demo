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
import PatrolLayout from "./components/PatrolLayout.jsx";
import PatrolRecords from "./pages/PatrolRecords.jsx";
import PatrolRecordDetail from "./pages/PatrolRecordDetail.jsx";
import PatrolProviderRoute from "./components/patrol/PatrolProviderRoute.jsx";
import PatrolRun from "./pages/PatrolRun.jsx";
import PatrolQrSheet from "./pages/PatrolQrSheet.jsx";
import PatrolItemSettings from "./pages/PatrolItemSettings.jsx";
import PatrolAnswerSettings from "./pages/PatrolAnswerSettings.jsx";
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
import NoAccountPage from "./pages/NoAccountPage.jsx";
import NoAccountQr from "./pages/NoAccountQr.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import MachineList from "./pages/MachineList.jsx";
import MachineDetail from "./pages/MachineDetail.jsx";
import MachineForm from "./pages/MachineForm.jsx";
import InspectionRun from "./pages/InspectionRun.jsx";
import WorkPlanOutputPreview from "./pages/WorkPlanOutputPreview.jsx";
import KynextProviderRoute from "./components/kynext/KynextProviderRoute.jsx";
import KynextLayout from "./components/KynextLayout.jsx";
import KynextSheets from "./pages/kynext/KynextSheets.jsx";
import KynextExport from "./pages/kynext/KynextExport.jsx";
import KynextQrCodes from "./pages/kynext/KynextQrCodes.jsx";
import KynextDirect from "./pages/kynext/KynextDirect.jsx";
import KynextTemplates from "./pages/kynext/KynextTemplates.jsx";
import KynextTemplateDetail from "./pages/kynext/KynextTemplateDetail.jsx";
import KynextSheetReference from "./pages/kynext/KynextSheetReference.jsx";
import KynextSheetForm from "./pages/kynext/KynextSheetForm.jsx";
import KynextSheetDetail from "./pages/kynext/KynextSheetDetail.jsx";
import KynextSafetyInstructions from "./pages/kynext/KynextSafetyInstructions.jsx";
import KynextChecklist from "./pages/kynext/KynextChecklist.jsx";
import KynextConfirmSign from "./pages/kynext/KynextConfirmSign.jsx";
import KynextWorkerCheck from "./pages/kynext/KynextWorkerCheck.jsx";
import KynextSheetQr from "./pages/kynext/KynextSheetQr.jsx";
import KynextProjectDetail from "./pages/kynext/KynextProjectDetail.jsx";
import KynextProjectSelect from "./pages/kynext/KynextProjectSelect.jsx";
import KynextLogin from "./pages/kynext/KynextLogin.jsx";

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
      {/* アカウントなし。QRコード発行画面と、QRを読み取った先の画面（ログイン必須／不要）。 */}
      <Route path="/no-account/fire-permit" element={<NoAccountQr />} />
      <Route path="/no-account/fire-permit/:kind" element={<NoAccountPage />} />
      <Route path="/no-account/work-plan" element={<NoAccountPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inspection" element={<InspectionRecords />} />
        <Route path="approval" element={<ApprovalRequests />} />
        <Route path="machines" element={<MachineList />} />
        <Route path="machines/new" element={<MachineForm />} />
        <Route path="machines/:id" element={<MachineDetail />} />
        <Route path="machines/:id/edit" element={<MachineForm />} />
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
      {/* 巡回/パトロール。記録はQR読み取り時に作成されるため、一覧からの新規作成は無い。
          実施入力はサイドバー無しの独立ページだが、一覧と状態を共有する。 */}
      <Route element={<PatrolProviderRoute />}>
      {/* 巡回のQR発行と、その読み取り先の実施入力。kind は login（ログイン必須）／guest（ログイン不要）。
          一覧・詳細と状態を共有するため、いずれも Provider の内側に置く。 */}
      <Route path="/no-account/owner-patrol" element={<PatrolQrSheet />} />
      <Route path="/no-account/owner-patrol/:kind" element={<PatrolRun />} />
      <Route path="/patrol" element={<PatrolLayout />}>
        <Route index element={<Navigate to="/patrol/records" replace />} />
        <Route path="records" element={<PatrolRecords />} />
        <Route path="records/:id" element={<PatrolRecordDetail />} />
        {/* 設定系メニュー（元請のみ閲覧可） */}
        <Route path="items" element={<PatrolItemSettings />} />
        <Route path="answers" element={<PatrolAnswerSettings />} />
      </Route>
      </Route>
      {/* KY-NEXT（デジタルKY）。本番 kynext/ の router.tsx と同じ URL 構成を /kynext 配下に置く。
          ログイン・現場選択・シート単体のQRはサイドバー無しの独立ページだが、シート等の状態は共有する。 */}
      <Route element={<KynextProviderRoute />}>
        <Route path="/kynext/login" element={<KynextLogin />} />
        <Route path="/kynext/projects/select" element={<KynextProjectSelect />} />
        <Route path="/kynext/ky-sheets/:id/qr-code" element={<KynextSheetQr />} />
        <Route path="/kynext" element={<KynextLayout />}>
          <Route index element={<KynextSheets />} />
          <Route path="export" element={<KynextExport />} />
          <Route path="ky-sheets/qr-codes" element={<KynextQrCodes />} />
          <Route path="integration/direct" element={<KynextDirect />} />
          <Route path="templates" element={<KynextTemplates />} />
          <Route path="templates/:template" element={<KynextTemplateDetail readOnly />} />
          <Route path="templates/:template/edit" element={<KynextTemplateDetail />} />
          <Route path="ky-sheets/create/reference" element={<KynextSheetReference />} />
          <Route path="ky-sheets/create" element={<KynextSheetForm mode="create" />} />
          <Route path="ky-sheets/:id" element={<KynextSheetDetail />} />
          <Route path="ky-sheets/:id/edit" element={<KynextSheetForm mode="edit" />} />
          <Route path="ky-sheets/:id/safety-instructions" element={<KynextSafetyInstructions />} />
          <Route path="ky-sheets/:id/checklists/:checklist" element={<KynextChecklist />} />
          <Route path="ky-sheets/:id/create-confirm/sign" element={<KynextConfirmSign kind="create" />} />
          <Route path="ky-sheets/:id/complete-confirm/sign" element={<KynextConfirmSign kind="complete" />} />
          <Route path="ky-sheets/:id/worker-check/procedures" element={<KynextWorkerCheck step="procedures" />} />
          <Route path="ky-sheets/:id/worker-check/risks" element={<KynextWorkerCheck step="risks" />} />
          <Route path="ky-sheets/:id/worker-check/checklist" element={<KynextWorkerCheck step="checklist" />} />
          <Route path="ky-sheets/:id/worker-check/sign" element={<KynextWorkerCheck step="sign" />} />
          <Route path="projects/detail" element={<KynextProjectDetail />} />
        </Route>
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
