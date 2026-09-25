import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_DIRECT_APPLICATIONS,
  INITIAL_PROJECT_TEMPLATE_IDS,
  INITIAL_SHEETS,
  INITIAL_TEMPLATES,
  KYNEXT_PROJECT,
  KYNEXT_PROJECTS,
  LINE_GROUPS,
  USERS,
  newId,
  newSheetId,
  nowIso,
  TODAY,
} from "../../kynextData.js";

// KY-NEXT デモ用の状態。本番では GraphQL（urql）で取得・更新する内容をブラウザ上で保持する。
const KynextContext = createContext(null);

// 文字サイズ切替（本番 fontSizeAtom）。詳細・作業員チェック画面で使う。
export const FONT_SCALE = { normal: 1, medium: 1.375, large: 1.75 };

export function KynextProvider({ children }) {
  const [sheets, setSheets] = useState(INITIAL_SHEETS);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  // 現場設定。currentTemplateId … 使用中テンプレート／allowCreateGuestSheet … 未ログインユーザーによる作成を許可
  const [settings, setSettings] = useState({ currentTemplateId: 11, allowCreateGuestSheet: false });
  // 元請（general）／協力会社（partner）の閲覧ロール
  const [role, setRole] = useState("general");
  const [project, setProject] = useState(KYNEXT_PROJECT);
  const [directApplications, setDirectApplications] = useState(INITIAL_DIRECT_APPLICATIONS);
  const [lineGroups, setLineGroups] = useState(LINE_GROUPS);
  const [fontSize, setFontSize] = useState("normal");
  // 元請の他現場に適用中のテンプレート（一括適用）と元請設定（会社共通の AI 設定）
  const [projectTemplateIds, setProjectTemplateIds] = useState(INITIAL_PROJECT_TEMPLATE_IDS);
  const [companySettings, setCompanySettings] = useState(INITIAL_COMPANY_SETTINGS);
  // 一覧の表示状態（タブ・表示形式・検索語・日付）。画面間で保持する。
  const [listState, setListState] = useState({ tab: "date", viewMode: null, keyword: "", date: TODAY, month: TODAY.slice(0, 7) });
  // 通知（本番 notistack）。{ id, message, variant }
  const [toasts, setToasts] = useState([]);

  const me = USERS[role];
  const currentTemplate = templates.find((t) => t.id === settings.currentTemplateId) || null;
  const catalog = currentTemplate?.catalog ?? null;

  const notify = useCallback((message, variant = "success") => {
    const id = newId();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo(() => {
    const patchSheet = (id, fn) => setSheets((list) => list.map((s) => (s.id === Number(id) ? fn(s) : s)));
    const confirmer = { name: me.name };

    return {
      // --- 参照 ---
      project,
      projects: KYNEXT_PROJECTS,
      me,
      role,
      setRole,
      sheets,
      templates,
      settings,
      currentTemplate,
      catalog,
      directApplications,
      lineGroups,
      fontSize,
      setFontSize,
      listState,
      setListState,
      toasts,
      notify,
      getSheet: (id) => sheets.find((s) => s.id === Number(id)) || null,
      getTemplate: (id) => templates.find((t) => t.id === Number(id)) || null,

      // --- 現場 ---
      switchProject: (id) => {
        const p = KYNEXT_PROJECTS.find((x) => x.id === Number(id));
        if (p) setProject({ id: p.id, name: p.name });
      },
      // 現場情報の編集（現場名・所在地など）。デモではブラウザ上の状態だけ更新する。
      updateProject: (patch) => setProject((p) => ({ ...p, ...patch })),

      // --- KYシート ---
      // 新規作成。入力値（basicDetails / riskAssessments）から提出済みシートを作る。
      createSheet: ({ basicDetails, riskAssessments, groupNotUse, copySchedule, provisionalId }) => {
        const workDate = basicDetails[1] || TODAY;
        const base = {
          status: "NotStarted",
          workDate,
          firstCompanyName: basicDetails[2] || "",
          workContent: basicDetails[5] || "",
          catalog,
          basicDetails,
          groupNotUse: groupNotUse ?? {},
          riskAssessments,
          copySchedule: copySchedule ?? null,
        };
        if (provisionalId) {
          // 仮作成シートの本作成。シート自身のカタログに対して回答する（本番 updateKYNEXTSheet）
          patchSheet(provisionalId, (s) => ({ ...s, ...base, catalog: s.catalog, createdBy: { id: me.id, name: me.name } }));
          return Number(provisionalId);
        }
        const id = newSheetId(sheets);
        setSheets((list) => [
          ...list,
          {
            ...base,
            id,
            uuid: `uuid-${id}`,
            workerChecklists: [],
            groupPhotos: [],
            forepersonChecklistAnswer: null,
            createConfirm: null,
            workCompleteConfirm: null,
            completeConfirm: null,
            safetyInstruction: null,
            createdBy: { id: me.id, name: me.name },
            createSourceType: "ConstructionUser",
            createdAt: nowIso(),
          },
        ]);
        return id;
      },
      // 提出済みシートの修正
      updateSheet: (id, { basicDetails, riskAssessments, groupNotUse, copySchedule }) =>
        patchSheet(id, (s) => ({
          ...s,
          basicDetails,
          riskAssessments,
          groupNotUse: groupNotUse ?? s.groupNotUse,
          copySchedule: copySchedule ?? s.copySchedule,
          workDate: basicDetails[1] || s.workDate,
          firstCompanyName: basicDetails[2] || "",
          workContent: basicDetails[5] || "",
        })),
      deleteSheet: (id) => setSheets((list) => list.filter((s) => s.id !== Number(id))),

      // 確認（KY作成後 元請確認 / 作業終了後 職長確認 / 作業完了後 元請確認）とその取消
      createConfirm: (id, signature) =>
        patchSheet(id, (s) => ({ ...s, createConfirm: { confirmedAt: nowIso(), confirmer, signature: signature ? { path: signature } : null } })),
      cancelCreateConfirm: (id) => patchSheet(id, (s) => ({ ...s, createConfirm: null })),
      workCompleteConfirm: (id) =>
        patchSheet(id, (s) => ({ ...s, status: s.status === "NotStarted" ? "InProgress" : s.status, workCompleteConfirm: { confirmedAt: nowIso(), confirmer } })),
      cancelWorkCompleteConfirm: (id) => patchSheet(id, (s) => ({ ...s, workCompleteConfirm: null })),
      completeConfirm: (id, signature) =>
        patchSheet(id, (s) => ({ ...s, status: "Completed", completeConfirm: { confirmedAt: nowIso(), confirmer, signature: signature ? { path: signature } : null } })),
      cancelCompleteConfirm: (id) => patchSheet(id, (s) => ({ ...s, status: "InProgress", completeConfirm: null })),

      // 元請からの安全指示
      setSafetyInstruction: (id, text) => patchSheet(id, (s) => ({ ...s, safetyInstruction: { safetyInstruction: text, updatedAt: nowIso() } })),

      // 職長チェックリストの回答
      // groupNotUse（該当なしにしたグループ）と answerer（確認者）は詳細表示用の追加情報
      answerForepersonChecklist: (id, { answers, signature, groupNotUse, answerer }) =>
        patchSheet(id, (s) => ({
          ...s,
          forepersonChecklistAnswer: {
            answeredAt: nowIso(),
            answers,
            signature: signature ? { path: signature } : null,
            groupNotUse: groupNotUse ?? {},
            answerer: answerer ?? { name: me.name },
          },
        })),

      // 作業員チェック（サイン）。回答するとステータスは作業中になる。
      // groupNotUse は該当なしにしたグループ（詳細表示で「（該当なし）」を出す）
      addWorkerChecklist: (id, { workerName, signature, photo, riskAssessmentItems, answers, workerRiskAssessment, groupNotUse }) =>
        patchSheet(id, (s) => ({
          ...s,
          status: s.status === "NotStarted" ? "InProgress" : s.status,
          workerChecklists: [
            ...s.workerChecklists,
            {
              id: newId(),
              workerName: workerName || "",
              signature: signature ? { path: signature } : null,
              photo: photo ? { path: photo } : null,
              answeredAt: nowIso(),
              riskAssessmentItems: riskAssessmentItems ?? [],
              answers: answers ?? {},
              groupNotUse: groupNotUse ?? {},
              workerRiskAssessment: workerRiskAssessment ?? null,
            },
          ],
        })),
      deleteWorkerChecklist: (id, checklistId) =>
        patchSheet(id, (s) => ({ ...s, workerChecklists: s.workerChecklists.filter((c) => c.id !== checklistId) })),
      setGroupPhotos: (id, photos) => patchSheet(id, (s) => ({ ...s, groupPhotos: photos })),

      // --- テンプレート・設定 ---
      applySettings: ({ template, allowCreateGuestSheet }) =>
        setSettings((s) => ({
          currentTemplateId: template ?? s.currentTemplateId,
          allowCreateGuestSheet: allowCreateGuestSheet ?? s.allowCreateGuestSheet,
        })),
      updateTemplate: (id, fn) =>
        setTemplates((list) =>
          list.map((t) =>
            t.id === Number(id)
              ? (() => {
                  const next = fn(t);
                  const version = (t.latestCatalog?.version ?? 1) + 1;
                  return {
                    ...next,
                    catalog: { ...next.catalog, version, template: { id: t.id, name: next.name } },
                    latestCatalog: { version, createdAt: nowIso() },
                  };
                })()
              : t
          )
        ),
      createTemplate: (template) => {
        const id = Math.max(0, ...templates.map((t) => t.id)) + 1;
        const t = {
          ...template,
          id,
          isExternal: false,
          used: false,
          catalog: { ...template.catalog, id: 200 + id, version: 1, template: { id, name: template.name } },
          latestCatalog: { version: 1, createdAt: nowIso() },
        };
        setTemplates((list) => [...list, t]);
        return id;
      },
      deleteTemplate: (id) => setTemplates((list) => list.filter((t) => t.id !== Number(id))),
      // 一括適用（元請の他現場に現場テンプレートを適用する）。projectTemplateIds は 現場ID → テンプレートID
      projectTemplateIds,
      applyTemplateToProjects: (templateId, projectIds) =>
        setProjectTemplateIds((m) => {
          const next = { ...m };
          projectIds.forEach((p) => {
            next[p] = Number(templateId);
          });
          return next;
        }),
      // 元請設定（会社共通のリスクアセスメント AI 設定）
      companySettings,
      updateCompanySettings: (values) => setCompanySettings((s) => ({ ...s, ...values })),

      // --- ダイレクト連携 ---
      addDirectApplication: ({ name, note }) =>
        setDirectApplications((list) => [
          ...list,
          { id: Math.max(0, ...list.map((a) => a.id)) + 1, name, note, connectStatus: "Connected", scope: { fileWrite: true }, notifications: [] },
        ]),
      reRegisterDirectApplication: (id) =>
        setDirectApplications((list) => list.map((a) => (a.id === id ? { ...a, connectStatus: "Connected" } : a))),
      deleteDirectApplication: (id) => setDirectApplications((list) => list.filter((a) => a.id !== id)),
      addDirectNotifications: (appId, notifications) =>
        setDirectApplications((list) =>
          list.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  notifications: [
                    ...a.notifications,
                    ...notifications.map((n, i) => ({ ...n, id: Math.max(0, ...a.notifications.map((x) => x.id)) + i + 1 })),
                  ],
                }
              : a
          )
        ),
      deleteDirectNotification: (appId, notificationId) =>
        setDirectApplications((list) =>
          list.map((a) => (a.id === appId ? { ...a, notifications: a.notifications.filter((n) => n.id !== notificationId) } : a))
        ),

      // --- LINE ---
      unregisterLineGroup: (groupId) => setLineGroups((g) => g.filter((x) => x.id !== groupId)),
    };
  }, [sheets, templates, settings, role, me, project, directApplications, lineGroups, fontSize, listState, toasts, notify, currentTemplate, catalog, projectTemplateIds, companySettings]);

  return <KynextContext.Provider value={value}>{children}</KynextContext.Provider>;
}

export function useKynext() {
  const ctx = useContext(KynextContext);
  if (!ctx) throw new Error("useKynext must be used within KynextProvider");
  return ctx;
}
