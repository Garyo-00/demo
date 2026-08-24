import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { PLAN_STATUS, machineById } from "../../workPlanNeoPlanData.js";
import { TEMPLATE_BLOCKS } from "../../workPlanNeoData.js";
import { useWpn } from "./WpnContext.jsx";
import { AnswerTable } from "./AnswerField.jsx";

// 申請ステータス → MUI の色。一覧の絞り込みチップでも使う。
export const STATUS_COLOR = {
  applying: "warning",
  approved: "success",
  rejected: "error",
  withdrawn: "default",
};

export function StatusBadge({ status }) {
  const s = PLAN_STATUS[status] || PLAN_STATUS.applying;
  return <Chip size="small" label={s.label} color={STATUS_COLOR[status] || "default"} />;
}

// 見出し付きカード（詳細ページの各セクション）
function Section({ title, hint, action, children }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <Typography variant="h2">
            {title}
            {hint && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
                {hint}
              </Typography>
            )}
          </Typography>
          {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function None({ children }) {
  return (
    <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
      {children}
    </Typography>
  );
}

// ラベル / 値 の2列テーブル
function KeyValue({ rows }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          {rows.map(([k, v]) => (
            <TableRow key={k}>
              <TableCell component="th" sx={{ width: "26%", bgcolor: "#f7f8fb", color: "text.secondary" }}>
                {k}
              </TableCell>
              <TableCell>{v}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * 作業計画書の詳細本文。詳細ページ・ドロワー・打合せサイン画面で共用する。
 * compact=true でドロワー向けの詰めたレイアウトになる。
 */
export default function PlanDetailContent({ plan, compact = false, safetyEditor = null }) {
  const { getTemplate, settings } = useWpn();
  const tpl = getTemplate(plan.templateId);
  const machines = plan.machineIds.map(machineById).filter(Boolean);
  const blocks = tpl?.blocks || {};
  const signs = plan.meetingSigns || [];

  return (
    <Box sx={{ "& .MuiCard-root": compact ? { boxShadow: "none" } : null }}>
      <Section title="基本情報">
        <KeyValue
          rows={[
            ["作業計画書名", plan.name],
            ["テンプレート", plan.templateName],
            ["開始日時", plan.start],
            ["終了日時", plan.end],
            ["申請者", plan.applicant],
            ["作成者", plan.author],
            ["申請ステータス", <StatusBadge key="s" status={plan.status} />],
          ]}
        />
      </Section>

      <Section title={`使用機材一覧（${machines.length}台）`}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>機械名</TableCell>
                <TableCell sx={{ width: "28%" }}>現場内呼称</TableCell>
                <TableCell sx={{ width: "22%" }}>カテゴリ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {machines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 3 }}>
                    使用機材は登録されていません。
                  </TableCell>
                </TableRow>
              )}
              {machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.alias}</TableCell>
                  <TableCell>{m.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* 作業計画書の内容（テンプレートでONにしたブロックを順に表示） */}
      <Section title="作業計画書の内容">
        {TEMPLATE_BLOCKS.filter((b) => blocks[b.key]).map((b) => (
          <Box
            key={b.key}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2, mb: 1.5 }}
          >
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1.25 }}>{b.label}</Typography>
            {b.key === "basic" ? (
              <KeyValue
                rows={[
                  ["作業配置図", <Button key="d" size="small" variant="outlined">図面を表示</Button>],
                  ["作業期間", `${plan.start} 〜 ${plan.end}`],
                ]}
              />
            ) : b.key === "other" ? (
              <AnswerTable items={tpl?.other} values={plan.other} readOnly />
            ) : (
              <Box
                sx={{
                  border: "1px dashed #d7dbe4",
                  borderRadius: 2,
                  py: 3,
                  textAlign: "center",
                  fontSize: 12,
                  color: "text.secondary",
                  bgcolor: "#fbfcfe",
                }}
              >
                詳細仕様は後日設定予定です。
              </Box>
            )}
          </Box>
        ))}
      </Section>

      {/* 安全指示事項（承認時に元請が入力） */}
      {safetyEditor}
      {!safetyEditor && (
        <Section title="安全指示事項" hint="承認時に元請が作業内容ごとに入力します">
          {plan.safetyInstructions?.length ? (
            plan.safetyInstructions.map((si, i) => (
              <Box key={si.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                  <Chip size="small" label={`No.${i + 1}`} variant="outlined" />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                    {si.workLabel || "作業内容未選択"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                    最終更新：{si.updatedAt} {si.updatedBy}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>{si.text}</Typography>
              </Box>
            ))
          ) : (
            <None>安全指示事項は入力されていません</None>
          )}
        </Section>
      )}

      <Section title="添付書類">
        {plan.files.length === 0 ? (
          <None>添付書類はありません</None>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {plan.files.map((f) => (
              <Chip key={f.id} icon={<UploadFileOutlinedIcon />} label={f.name} variant="outlined" />
            ))}
          </Box>
        )}
      </Section>

      <Section title="チェックリスト">
        {plan.checklistResults?.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>チェックリスト</TableCell>
                  <TableCell sx={{ width: "22%" }}>実施者</TableCell>
                  <TableCell sx={{ width: "22%" }}>実施日時</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plan.checklistResults.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.by}</TableCell>
                    <TableCell>{r.at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <None>実施されたチェックリストはありません</None>
        )}
      </Section>

      {/* 打合せ参加者サイン（設定でONのときのみ。QRから参加者が登録する） */}
      {settings.meetingSign && (
        <Section
          title="打合せ参加者サイン"
          hint={signs.length > 0 ? `${signs.length}名` : "打合せサイン用QRから参加者が登録します"}
        >
          {signs.length === 0 ? (
            <None>サインは登録されていません</None>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 1.5,
              }}
            >
              {signs.map((sg) => (
                <Box key={sg.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.25 }}>
                  {sg.image ? (
                    <Box
                      component="img"
                      src={sg.image}
                      alt="打合せ参加者のサイン"
                      sx={{ display: "block", width: "100%", height: 72, objectFit: "contain" }}
                    />
                  ) : (
                    // 手書きできない参加者は氏名入力で代替する
                    <Box
                      sx={{
                        height: 72,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.75,
                      }}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{sg.name}</Typography>
                      <Chip size="small" label="氏名入力" variant="outlined" />
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                    sx={{ display: "block", mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    {sg.at}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Section>
      )}

      <Section title="メモ">
        {plan.memo ? (
          <Typography sx={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>{plan.memo}</Typography>
        ) : (
          <None>メモはありません</None>
        )}
      </Section>

      <Section title="承認フロー">
        {plan.approvals.map((step) => (
          <ApprovalStep key={step.no} step={step} />
        ))}
      </Section>
    </Box>
  );
}

/**
 * 承認フローの1ステップ。決裁者が多いと一覧が長くなるため、
 * 既定では決裁済み（承認・否認）の人だけを表示し、未決裁の人はアコーディオンで開く。
 */
function ApprovalStep({ step }) {
  const [open, setOpen] = useState(false);
  const decided = step.rows.filter((r) => r.status !== "applying");
  const pending = step.rows.filter((r) => r.status === "applying");
  // 誰も決裁していないときは全員（＝未決裁）を出す。畳むと空表示になってしまうため。
  const rows = decided.length === 0 || open ? step.rows : decided;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Chip size="small" color="primary" label={step.no} sx={{ width: 24, "& .MuiChip-label": { px: 0 } }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>ステップ {step.no}</Typography>
        <StatusBadge status={step.status} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4, mb: 1 }}>
        {step.group}
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "18%" }}>決裁日</TableCell>
              <TableCell>決裁者</TableCell>
              <TableCell sx={{ width: "18%" }}>決裁状況</TableCell>
              <TableCell sx={{ width: "24%" }}>コメント</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.date || "-"}</TableCell>
                <TableCell>{r.approver}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>{r.comment || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {decided.length > 0 && pending.length > 0 && (
        <Button
          size="small"
          sx={{ mt: 1 }}
          startIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "未決裁の決裁者を隠す" : `未決裁の決裁者 ${pending.length} 名を表示`}
        </Button>
      )}
    </Box>
  );
}
