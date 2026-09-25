// KYシート詳細まわりの判定ロジック（本番 permissions.ts / workerCheck/lib.ts の簡略版）
// API の permissions を持たないデモでは、ロール・ステータス・自社判定から不可理由の文言を組み立てる。
import { TODAY, buildVirtualSteps } from "../../kynextData.js";

export const isGeneral = (me) => me?.key === "general";
export const isOwnCompany = (sheet, me) => sheet?.firstCompanyName === me?.company;
export const isGuestCreated = (sheet) => sheet?.createSourceType === "ConstructionGuestUser";

/**
 * 詳細画面で使う操作可否をまとめて返す。
 * それぞれ「不可理由の文言 or null」。null なら操作できる。文言は本番 permissions.ts と同じ。
 */
export function resolveSheetPermissions(sheet, me) {
  const general = isGeneral(me);
  const own = isOwnCompany(sheet, me);
  const completed = sheet.status === "Completed";
  const today = sheet.workDate === TODAY;

  // 編集（permissions.editable）。作業完了後 元請確認済みなら不可
  const editDeniedReason = completed ? "元請確認済みです" : null;

  // 削除（permissions.deletable）。協力会社は自社のシートのみ
  const deleteDeniedReason = !general && !own ? "自身が作成したKYシートのみ削除できます" : completed ? "元請確認済みです" : null;

  // 作業員チェックの回答（workerChecklist.permissions.answerable）
  const workerCheckDeniedReason = completed ? "元請確認済みです" : !today ? "本日の作業ではありません" : null;

  // 作業員チェックの削除（checklists[].permissions.deletable）
  const workerChecklistDeleteDeniedReason = completed
    ? "元請確認済みです"
    : !general && !own
      ? "自社が作成したKYシートの作業員チェックのみ削除できます"
      : null;

  // 職長チェックリストの回答（forepersonChecklists[].permissions.answerable）
  const checklistAnswerDeniedReason = completed ? "元請確認済みです" : null;

  // 元請からの安全指示（permissions.safetyInstructionCreatable）。元請のみ
  const safetyInstructionEditable = general;

  // LINE 共有（permissions.lineShareable）
  const lineShareDeniedReason = general || own ? null : "自身が作成したKYシートのみLINE共有できます";

  // KY作成後 元請確認（permissions.generalContractorCreateConfirmable）
  const createConfirmDeniedReason = !general
    ? "元請確認する権限がありません"
    : sheet.createConfirm?.confirmedAt || sheet.completeConfirm?.confirmedAt
      ? "元請確認済みです"
      : null;
  const createConfirmCancellable = general && !!sheet.createConfirm?.confirmedAt && !sheet.completeConfirm?.confirmedAt;

  // 作業終了後 職長確認（permissions.forepersonConfirmable）。協力会社／元請どちらでも可
  const workCompleteConfirmDeniedReason = completed
    ? "元請確認済みです"
    : !general && !own
      ? "自身が作成したKYシートのみ職長確認できます"
      : sheet.workCompleteConfirm?.confirmedAt
        ? "職長確認済みです"
        : null;
  const workCompleteConfirmCancellable = !!sheet.workCompleteConfirm?.confirmedAt && !completed;

  // 作業完了後 元請確認（permissions.generalContractorWorkCompleteConfirmable）
  const completeConfirmDeniedReason = !general ? "元請確認する権限がありません" : sheet.completeConfirm?.confirmedAt ? "元請確認済みです" : null;
  const completeConfirmCancellable = general && !!sheet.completeConfirm?.confirmedAt;

  return {
    general,
    own,
    completed,
    editDeniedReason,
    isEditable: !editDeniedReason,
    deleteDeniedReason,
    workerCheckDeniedReason,
    workerChecklistDeleteDeniedReason,
    checklistAnswerDeniedReason,
    safetyInstructionEditable,
    lineShareDeniedReason,
    createConfirmDeniedReason,
    createConfirmCancellable,
    workCompleteConfirmDeniedReason,
    workCompleteConfirmCancellable,
    completeConfirmDeniedReason,
    completeConfirmCancellable,
  };
}

/**
 * カタログ設定から作業員チェックの入口（最初に開くサブページ）を決める（本番 resolveWorkerCheckEntry）。
 * リスク評価カタログあり → procedures（作業内容なしなら risks）、チェックリストあり → checklist、それ以外 → sign
 */
export function resolveWorkerCheckEntry(catalog) {
  const slots = catalog?.workerChecklistCatalogSlots ?? [];
  const hasChecklist = slots.length > 0;
  const firstCatalogName = slots[0]?.name ?? "";
  const signatureCatalog = catalog?.signatureCatalogV2;
  const hasSignature = signatureCatalog?.hasIndividualWorkerSignature ?? false;
  const hasPhoto = (signatureCatalog?.hasIndividualWorkerPhoto ?? false) || (signatureCatalog?.hasGroupPhoto ?? false);
  const workerRiskCatalog = catalog?.workerRiskAssessmentCatalog ?? null;
  const hasWorkerRiskAssessment = workerRiskCatalog != null;
  const isWithoutProcedure = workerRiskCatalog?.assessmentType === "WithoutProcedure";

  const suffix = hasWorkerRiskAssessment ? (isWithoutProcedure ? "risks" : "procedures") : hasChecklist ? "checklist" : "sign";
  const submitLabel = hasWorkerRiskAssessment
    ? isWithoutProcedure
      ? "リスク評価"
      : "作業内容入力"
    : hasChecklist
      ? `${firstCatalogName}に新規回答`
      : hasSignature
        ? "署名する"
        : "写真を撮影する";

  return {
    // 入力すべき項目が何も無いカタログでは入口ボタン自体を出さない
    hasEntry: hasWorkerRiskAssessment || hasChecklist || hasSignature || hasPhoto,
    suffix,
    submitLabel,
  };
}

/**
 * 「編集する」で開く修正画面のステップ id（本番 stepIndexOf 相当）。
 * target … 'WorkRiskAssessment' | 'PointingAndCalling' | undefined（基本情報）
 */
export function resolveEditStepId(catalog, target, riskIndex = 0) {
  if (!target) return "basic-details";
  const steps = buildVirtualSteps(catalog);
  const found = steps.find((s) => s.content === target && s.riskIndex === riskIndex);
  return found?.id ?? "basic-details";
}

// 丸数字（担当手順の番号表示に使う）
export const circledNumber = (n) => (n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : `(${n})`);
