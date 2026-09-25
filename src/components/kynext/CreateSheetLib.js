// ===== KYシート作成・修正フローの共通ロジック =====
// 本番 features/create/custom/{lib,validation,suggestionCandidates,editLocationState}.ts と
// CreateCustomKYNEXTSheetContext.tsx の下書き保存を、静的データ用に移植したもの。
import { TODAY, emptyRisk, isItemVisible, isMergedProcedure, riskSectionTitle } from "../../kynextData.js";

// 新規作成フローの下書きを置く sessionStorage のキー（本番 STORAGE_KEY）
export const DRAFT_KEY = "customKYNEXTSheet_draft";
// 現在ステップを持つクエリパラメータ名（本番 STEP_PARAM）
export const STEP_PARAM = "step";
// リスク評価カードに統合した作業内容欄のラベル（本番 MergedProcedureFieldLabel）
export const MERGED_PROCEDURE_LABEL = "作業内容";

export const TEXT_MAX_LENGTH = 100;
export const RISK_TEXT_MAX_LENGTH = 255;
export const ACTION_GOAL_MAX_LENGTH = 500;
export const MAX_FILES = 5;

// ---------- 入力状態 ----------
// { formInputs, fileInputs, riskAssessments, groupNotUse, copySchedule, entryStep }
//   formInputs   … 項目ID → 回答値（basicDetails と同じ形）
//   fileInputs   … 項目ID → [{ id, name, path }]（File 項目の添付）
//   riskAssessments … 配列位置 = selectRiskCatalogs の並び。{ workSteps: [{ step, risk }], actionGoal }
//   groupNotUse  … グループID → 「該当なし」
//   copySchedule … { startAt, endAt } | undefined（定期作成）
//   entryStep    … 修正フローで「確定」を押して確認画面へ入ったステップ（「戻る」の戻り先）
export const emptyState = () => ({
  formInputs: {},
  fileInputs: {},
  riskAssessments: [],
  groupNotUse: {},
  copySchedule: undefined,
  entryStep: undefined,
});

export const loadDraft = () => {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? { ...emptyState(), ...JSON.parse(saved) } : null;
  } catch {
    return null;
  }
};

// AI提案の候補は再訪時に作り直せるので下書きには残さない（本番 saveStoredState と同じ）
export const saveDraft = (state) => {
  try {
    const storable = {
      ...state,
      riskAssessments: (state.riskAssessments ?? []).map(({ suggestionCandidates: _c, ...rest }) => rest),
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(storable));
  } catch {
    /* sessionStorage に書けなくても動作には支障がない */
  }
};

export const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
};

// カタログのリスク評価件数に長さを揃える（本番 normalizeRiskAssessments）
export const normalizeRiskAssessments = (values, count) =>
  Array.from({ length: count }, (_, i) => values?.[i] ?? { workSteps: [] });

// 項目タイプごとの未入力値
export const defaultItemValue = (item) => {
  switch (item.type) {
    case "ButtonSelection":
    case "NumberPicker":
      return null;
    case "CheckboxSelection":
    case "File":
      return [];
    default:
      return "";
  }
};

export const findItemByInternalUseType = (catalog, type) =>
  (catalog?.basicDetailCatalog?.groups ?? []).flatMap((g) => g.items ?? []).find((i) => i.internalUseType === type) ?? null;

// 既存シートから入力状態を組み立てる（本番 buildEditLocationState / buildCopyLocationState）。
// overrideDateToToday … コピー時は作業日を今日に置き換える
export const stateFromSheet = (sheet, { overrideDateToToday = false } = {}) => {
  const groups = sheet?.catalog?.basicDetailCatalog?.groups ?? [];
  const formInputs = {};
  const fileInputs = {};
  groups.forEach((group) =>
    (group.items ?? []).forEach((item) => {
      const value = sheet.basicDetails?.[item.id];
      if (item.type === "File") {
        fileInputs[item.id] = Array.isArray(value) ? value : [];
        formInputs[item.id] = fileInputs[item.id];
        return;
      }
      if (item.internalUseType === "WorkDate" && overrideDateToToday) {
        formInputs[item.id] = TODAY;
        return;
      }
      formInputs[item.id] = value ?? defaultItemValue(item);
    })
  );
  return {
    ...emptyState(),
    formInputs,
    fileInputs,
    riskAssessments: (sheet.riskAssessments ?? []).map((r) => ({
      workSteps: (r.workSteps ?? []).map((ws) => ({ step: ws.step ?? "", risk: { ...emptyRisk(), ...(ws.risk ?? {}) } })),
      actionGoal: r.actionGoal ?? "",
    })),
    groupNotUse: { ...(sheet.groupNotUse ?? {}) },
    // コピーでは定期作成は引き継がない
    copySchedule: overrideDateToToday ? undefined : (sheet.copySchedule ?? undefined),
  };
};

export const isEmptyValue = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

// 基本情報の必須・形式チェック（本番 useCustomKYNEXTSheetInputForm.validateAndSave + validateCustomItems）。
// errors … 項目ID → { type, message }（フォームに出す）
// messages … 「○○を入力してください」（確認画面の提出時に通知で出す）
export const validateBasicItems = (catalog, { formInputs = {}, fileInputs = {}, groupNotUse = {} }) => {
  const errors = {};
  const messages = [];
  (catalog?.basicDetailCatalog?.groups ?? []).forEach((group) => {
    if (group.optional && groupNotUse[group.id]) return;
    (group.items ?? []).forEach((item) => {
      if (!isItemVisible(item, formInputs)) return;
      const value = item.type === "File" ? (fileInputs[item.id] ?? []) : formInputs[item.id];
      if (!item.optional && isEmptyValue(value)) {
        const isSelect = item.type === "ButtonSelection" || item.type === "CheckboxSelection" || item.type === "NumberPicker";
        errors[item.id] = { type: "required", message: isSelect ? "選択してください" : "入力してください" };
        messages.push(`${item.name}を入力してください`);
        return;
      }
      if (isEmptyValue(value)) return;

      if (item.type === "Text" && String(value).length > TEXT_MAX_LENGTH) {
        errors[item.id] = { type: "maxLength", message: `${TEXT_MAX_LENGTH}文字以下で入力してください` };
        messages.push(`${item.name}は${TEXT_MAX_LENGTH}文字以下で入力してください`);
      }
      if (item.type === "HourMinutes" && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(String(value))) {
        errors[item.id] = { type: "pattern", message: "HH:MM の形式で入力してください" };
        messages.push(`${item.name}は HH:MM の形式で入力してください`);
      }
      if (item.type === "Number") {
        const num = Number(value);
        const ns = item.settings?.numberSettings;
        if (Number.isNaN(num)) {
          errors[item.id] = { type: "pattern", message: "数値を入力してください" };
          messages.push(`${item.name}は数値を入力してください`);
        } else if (ns?.min != null && num < ns.min) {
          errors[item.id] = { type: "min", message: `${ns.min}以上の値を入力してください` };
          messages.push(`${item.name}は${ns.min}以上の値を入力してください`);
        } else if (ns?.max != null && num > ns.max) {
          errors[item.id] = { type: "max", message: `${ns.max}以下の値を入力してください` };
          messages.push(`${item.name}は${ns.max}以下の値を入力してください`);
        }
      }
      // 選択肢に付いた自由記述（hasText）の必須・文字数
      if (item.type === "ButtonSelection" || item.type === "CheckboxSelection") {
        const selected = Array.isArray(value) ? value : [value];
        for (const v of selected) {
          const opt = (item.options ?? []).find((o) => o.id === v?.id);
          if (!opt?.hasText) continue;
          if (opt.textRequired && !v.text) {
            errors[item.id] = { type: "textRequired", message: "入力してください" };
            messages.push(`${item.name}の${opt.textLabel || "自由記述"}を入力してください`);
            break;
          }
          if (v.text && v.text.length > TEXT_MAX_LENGTH) {
            errors[item.id] = { type: "textMaxLength", message: `${TEXT_MAX_LENGTH}文字以下で入力してください` };
            messages.push(`${item.name}の${opt.textLabel || "自由記述"}は${TEXT_MAX_LENGTH}文字以下で入力してください`);
            break;
          }
        }
      }
    });
  });
  return { errors, messages };
};

// 定期作成（開始日〜終了日）のチェック
export const validateCopySchedule = (copy) => {
  const errors = {};
  if (!copy?.enabled) return errors;
  if (!copy.startAt) errors.startAt = "開始日を入力してください";
  if (!copy.endAt) errors.endAt = "終了日を入力してください";
  if (copy.startAt && copy.endAt && copy.endAt < copy.startAt) errors.endAt = "終了日は開始日以降にしてください";
  return errors;
};

// 提出用の basicDetails（項目ID → 値）。File は fileInputs から取る
export const buildBasicDetails = (catalog, { formInputs = {}, fileInputs = {} }) => {
  const details = {};
  (catalog?.basicDetailCatalog?.groups ?? []).forEach((group) =>
    (group.items ?? []).forEach((item) => {
      if (item.omit) return;
      details[item.id] = item.type === "File" ? (fileInputs[item.id] ?? []) : (formInputs[item.id] ?? defaultItemValue(item));
    })
  );
  return details;
};

// ---------- リスク評価 ----------
// リスク評価フォームの初期値（本番 buildRiskFormDefaultValues）。
// 作業手順ありのカタログでは入力欄が最初から一定数並ぶよう空の手順で埋める
export const buildRiskFormDefaultValues = (rc, value) => {
  const isWithoutProcedure = rc?.assessmentType === "WithoutProcedure";
  const minCount = rc?.minProcedureCount ?? 3;
  const maxCount = rc?.maxProcedureCount ?? 5;
  const initialCount = Math.min(minCount >= 6 ? minCount : 5, maxCount);
  const stored = (value?.workSteps ?? []).map((ws) => ({ step: ws.step ?? "", risk: { ...emptyRisk(), ...(ws.risk ?? {}) } }));
  const blank = () => ({ step: "", risk: emptyRisk() });
  // 統合パターン（品質KY・その他KY）は作業内容なしと同じ項目型で、表示している行がそのまま入力対象。空手順で水増ししない
  const workSteps =
    isWithoutProcedure || isMergedProcedure(rc)
      ? stored.length > 0
        ? stored
        : Array.from({ length: minCount }, blank)
      : [...stored, ...Array.from({ length: Math.max(0, initialCount - stored.length) }, blank)];
  return { workSteps, actionGoal: value?.actionGoal ?? "" };
};

// 回答として扱う行だけ残す（本番 handleSubmitRisk / buildRiskItems の filter）
export const filterAnsweredWorkSteps = (rc, workSteps) =>
  rc?.assessmentType === "WithoutProcedure" ? workSteps.filter((ws) => !!ws.risk?.dangerPoint) : workSteps.filter((ws) => !!ws.step);

// リスク評価ステップのフォームエラー（本番 createSchema の superRefine）。index → { step, dangerPoint, ... }
export const validateRiskForm = (rc, workSteps) => {
  const isWithoutProcedure = rc?.assessmentType === "WithoutProcedure";
  const merged = isMergedProcedure(rc);
  const errors = {};
  workSteps.forEach((ws, i) => {
    const shouldValidate = isWithoutProcedure || merged || !!ws.step;
    if (!shouldValidate) return;
    const e = {};
    const risk = ws.risk ?? {};
    if (merged && !ws.step?.trim()) e.step = "入力してください";
    if (ws.step && ws.step.length > TEXT_MAX_LENGTH) e.step = `${TEXT_MAX_LENGTH}文字以下で入力してください`;
    if (!risk.dangerPoint?.trim()) e.dangerPoint = "入力してください";
    else if (risk.dangerPoint.length > RISK_TEXT_MAX_LENGTH) e.dangerPoint = `${RISK_TEXT_MAX_LENGTH}文字以下で入力してください`;
    if (!risk.countermeasure?.trim()) e.countermeasure = "入力してください";
    else if (risk.countermeasure.length > RISK_TEXT_MAX_LENGTH) e.countermeasure = `${RISK_TEXT_MAX_LENGTH}文字以下で入力してください`;
    if (risk.doubleSafety && risk.doubleSafety.length > RISK_TEXT_MAX_LENGTH) e.doubleSafety = `${RISK_TEXT_MAX_LENGTH}文字以下で入力してください`;
    if (!risk.severity) e.severity = "選択してください";
    if (!risk.possibility) e.possibility = "選択してください";
    if (!risk.improvedSeverity) e.improvedSeverity = "選択してください";
    if (!risk.improvedPossibility) e.improvedPossibility = "選択してください";
    if (risk.improvedSeverity && risk.severity && risk.improvedSeverity > risk.severity) e.improvedSeverity = "対策前より大きくなっています";
    if (risk.improvedPossibility && risk.possibility && risk.improvedPossibility > risk.possibility) e.improvedPossibility = "対策前より大きくなっています";
    if (Object.keys(e).length) errors[i] = e;
  });
  return errors;
};

// 提出時の全リスク評価チェック（本番 validateAllRiskAssessments）。複数あるときは見出しを前置する
export const validateAllRiskAssessments = (riskCatalogs, riskAssessments) =>
  riskCatalogs.flatMap((rc, i) => {
    const isWithoutProcedure = rc.assessmentType === "WithoutProcedure";
    const errors = [];
    for (const ws of riskAssessments[i]?.workSteps ?? []) {
      const shouldValidate = isWithoutProcedure ? !!ws.risk : !!ws.step && !!ws.risk;
      if (!shouldValidate) continue;
      if (!ws.risk?.dangerPoint?.trim()) errors.push("危険ポイントを入力してください");
      if (!ws.risk?.countermeasure?.trim()) errors.push("対策を入力してください");
      if (!ws.risk?.severity) errors.push("重篤度を選択してください");
      if (!ws.risk?.possibility) errors.push("可能性を選択してください");
      if (ws.risk?.improvedSeverity && ws.risk?.severity && ws.risk.improvedSeverity > ws.risk.severity) errors.push("対策後の重篤度が対策前より大きくなっています");
      if (ws.risk?.improvedPossibility && ws.risk?.possibility && ws.risk.improvedPossibility > ws.risk.possibility) errors.push("対策後の可能性が対策前より大きくなっています");
    }
    const label = rc.title || (rc.type === "Quality" ? "品質KY" : "");
    const prefix = riskCatalogs.length > 1 && label ? `${label}: ` : "";
    return errors.map((e) => `${prefix}${e}`);
  });

// 提出用の riskAssessments（INITIAL_SHEETS と同じ形）
export const buildRiskAssessmentAnswers = (riskCatalogs, riskAssessments) =>
  riskCatalogs.map((rc, i) => ({
    workSteps: filterAnsweredWorkSteps(rc, riskAssessments[i]?.workSteps ?? []).map((ws) => ({
      step: rc.assessmentType === "WithoutProcedure" ? "" : ws.step,
      risk: { ...emptyRisk(), ...(ws.risk ?? {}) },
    })),
    actionGoal: riskAssessments[i]?.actionGoal ?? "",
  }));

export { riskSectionTitle };

// ---------- AI提案（デモ用の固定データ） ----------
// 本番は getSuggestion API に問い合わせる。デモでは作業内容の語句から手順・危険ポイントを組み立てる。
const STEP_TEMPLATES = [
  { match: /足場/, steps: ["材料の荷揚げ", "建枠・筋交いの取付", "足場板の敷設", "手摺・巾木の設置", "壁つなぎの設置"] },
  { match: /配筋|鉄筋/, steps: ["鉄筋の小運搬", "配筋・結束", "スペーサーの設置", "配筋検査"] },
  { match: /型枠/, steps: ["型枠パネルの揚重", "パネルの建込・固定", "セパレーターの取付", "建入れ直し"] },
  { match: /電気|配線|ケーブル/, steps: ["高所作業車の設置", "ケーブルラックの取付", "配線作業", "結線・絶縁確認"] },
  { match: /塗装|塗り/, steps: ["ゴンドラの点検・搭乗", "下地処理（ケレン）", "下塗り塗布", "養生の撤去"] },
  { match: /配管/, steps: ["配管材の搬入", "配管の切断・接続", "支持金物の取付", "水圧試験"] },
  { match: /解体|撤去/, steps: ["撤去範囲の養生", "解体作業", "廃材の小運搬", "積込・搬出"] },
];
const DEFAULT_STEPS = ["作業前点検・KY", "資材の搬入・小運搬", "本作業", "片付け・清掃"];

// 作業内容に応じた作業手順を count 件返す（足りない分は空文字）
export const suggestWorkSteps = (workContent, count) => {
  const template = STEP_TEMPLATES.find((t) => t.match.test(workContent ?? ""));
  const steps = template ? template.steps : DEFAULT_STEPS;
  return Array.from({ length: count }, (_, i) => steps[i] ?? "");
};

const scores = (severity, possibility, improvedSeverity, improvedPossibility) => ({ severity, possibility, improvedSeverity, improvedPossibility });
const RISK_POOLS = [
  {
    match: /荷揚げ|揚重|搬入|運搬|積込|搭乗/,
    risks: [
      { dangerPoint: "吊り荷・運搬中の資材が落下し、下の作業員に当たる", counterMeasure: "作業範囲を立入禁止にし、合図者を配置して有資格者が玉掛けする", scores: scores(3, 2, 3, 1) },
      { dangerPoint: "資材を担いで移動中につまずき転倒する", counterMeasure: "通路を整理し、2人で声を掛け合って運搬する", scores: scores(2, 2, 1, 1) },
      { dangerPoint: "重量物を持ち上げて腰を痛める", counterMeasure: "台車を使い、持ち上げる時は膝を曲げて2人で行う", scores: scores(2, 3, 2, 1) },
    ],
  },
  {
    match: /取付|建込|組立|設置|敷設|結束/,
    risks: [
      { dangerPoint: "高所で足を踏み外し墜落する", counterMeasure: "親綱を先行して張り、フルハーネスを常時使用する", scores: scores(3, 2, 2, 1) },
      { dangerPoint: "固定前の部材が倒れて挟まれる", counterMeasure: "仮固定してから手を離し、部材の倒れる方向に立たない", scores: scores(3, 2, 2, 1) },
      { dangerPoint: "工具・部材が落下して下の作業員に当たる", counterMeasure: "工具に落下防止ひもを付け、下部を立入禁止にする", scores: scores(2, 2, 1, 1) },
    ],
  },
  {
    match: /配線|電気|結線|絶縁/,
    risks: [
      { dangerPoint: "活線に触れて感電する", counterMeasure: "作業前に検電し、停電表示札を掲示する", scores: scores(3, 1, 3, 1) },
      { dangerPoint: "脚立上でバランスを崩し転落する", counterMeasure: "脚立の天板に乗らず、2人で支えて作業する", scores: scores(2, 2, 1, 1) },
      { dangerPoint: "ケーブルの端部で手を切る", counterMeasure: "手袋を着用し、端部は養生してから扱う", scores: scores(1, 3, 1, 1) },
    ],
  },
  {
    match: /塗|ケレン|溶剤/,
    risks: [
      { dangerPoint: "有機溶剤で中毒・引火する", counterMeasure: "換気を行い、火気厳禁の表示をする", scores: scores(3, 2, 3, 1) },
      { dangerPoint: "粉じんを吸い込み健康障害を起こす", counterMeasure: "防じんマスクを着用し、集じん機を併用する", scores: scores(2, 3, 2, 1) },
      { dangerPoint: "ゴンドラ・足場から墜落する", counterMeasure: "乗る前に安全帯のフックを掛け、始業前点検を行う", scores: scores(3, 1, 3, 1) },
    ],
  },
  {
    match: /解体|撤去|切断/,
    risks: [
      { dangerPoint: "切断片が飛来して目に当たる", counterMeasure: "保護メガネを着用し、周囲に人がいないことを確認する", scores: scores(2, 3, 2, 1) },
      { dangerPoint: "撤去した部材が倒れて下敷きになる", counterMeasure: "倒れる方向を決めて2人で支え、控えを取ってから外す", scores: scores(3, 2, 2, 1) },
      { dangerPoint: "電動工具で手を切る", counterMeasure: "刃の前に手を置かず、停止を確認してから持ち替える", scores: scores(2, 2, 1, 1) },
    ],
  },
];
const GENERIC_RISKS = [
  { dangerPoint: "足元の段差につまずき転倒する", counterMeasure: "作業前に足元を整理し、段差には注意表示をする", scores: scores(2, 2, 1, 1) },
  { dangerPoint: "作業中に工具で手を挟む・切る", counterMeasure: "保護手袋を着用し、手元を確認して作業する", scores: scores(1, 3, 1, 1) },
  { dangerPoint: "炎天下の作業で熱中症になる", counterMeasure: "こまめに休憩と水分補給を行い、声掛けで体調を確認する", scores: scores(2, 2, 1, 1) },
];

// 作業手順ごとの危険ポイント・対策を候補 candidateCount 件で返す（本番 riskAssessmentSuggestionCandidates の形）
export const suggestRiskCandidates = (steps, candidateCount = 1) =>
  Array.from({ length: candidateCount }, (_, k) => ({
    index: k,
    items: steps.map((step, i) => {
      const pool = RISK_POOLS.find((p) => p.match.test(step))?.risks ?? GENERIC_RISKS;
      const item = pool[(i + k) % pool.length];
      return { workProcedure: step, ...item };
    }),
  }));

// 1手順ぶんの選択肢を候補をまたいで集める（本番 candidateOptionsForStep）
export const candidateOptionsForStep = (candidates, stepIndex, stepName) =>
  candidates.flatMap((candidate) => {
    const item = stepName ? candidate.items.find((i) => i.workProcedure === stepName) : candidate.items[stepIndex];
    if (!item) return [];
    return [{ candidateIndex: candidate.index, dangerPoint: item.dangerPoint, counterMeasure: item.counterMeasure, scores: item.scores }];
  });

// 提案の危険ポイント・対策・スコアをリスクの値に重ねる（本番 applyItemToRisk）
export const applyItemToRisk = (risk, item) => ({
  ...emptyRisk(),
  ...risk,
  dangerPoint: item.dangerPoint,
  countermeasure: item.counterMeasure,
  ...(item.scores ?? {}),
});

// 候補1件だけの現場向け。入力済みの手順は残し、手順名が一致する行の危険ポイント・対策だけ置き換える
export const applyCandidateToWorkSteps = (workSteps, candidate) =>
  workSteps.map((ws) => {
    const item = candidate.items.find((i) => i.workProcedure === ws.step);
    return item ? { ...ws, risk: applyItemToRisk(ws.risk, item) } : ws;
  });

// 作業手順ページが無いパターン用。候補の作業手順をそのまま行にする
export const candidateToWorkSteps = (candidate) => candidate.items.map((item) => ({ step: item.workProcedure, risk: applyItemToRisk(undefined, item) }));
export const candidateWorkStepsWithoutRisk = (candidate) => candidate.items.map((item) => ({ step: item.workProcedure, risk: emptyRisk() }));
