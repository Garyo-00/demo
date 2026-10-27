import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  ScopedCssBaseline,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";

// 点検実施画面（機械／仮設・その他のタブ切替）。
// 添付イメージのレイアウトを再現するデモ実装（各ボタンは表示のみ）。
// 表示パターン（済／未・実施人数・実施事由の表示など）は、コンテンツ左右の余白に
// 配置したデモ用メニュー（DemoPanel）から切り替えてビューを確認できる。

// 現場アプリの実画面に合わせた配色。テーマのパレットには無い色なのでこの画面に閉じて定義する。
const TEAL = "#35b7c4"; // 主要アクションの色
const TEAL_DARK = "#0e7c8a";

// 点検状態。淡い地色に状態色の文字とアイコンを重ねる。
const STATUS = {
  done: { bg: "#e3edfd", fg: "#2563eb", Icon: CheckCircleIcon }, // 済＝青
  undone: { bg: "#fce7f3", fg: "#db2777", Icon: ErrorOutlineIcon }, // 未＝ピンク
  red: { bg: "#fee2e2", fg: "#dc2626", Icon: ErrorOutlineIcon }, // 未（要対応）＝赤
};

// カードの共通スタイル。角丸は大きめ、影はごく薄く1段だけ。
const CARD = {
  bgcolor: "#fff",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "14px",
  boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 8px 20px rgba(16,24,40,.05)",
};

// 仮設・始業前点検の実施者サンプル（使用者ごとに複数名になり得る）
const TEMP_INSPECTORS = [
  "佐藤 健",
  "鈴木 一郎",
  "高橋 誠",
  "伊藤 大輔",
  "渡辺 浩",
];
const TEMP_MAX_INSPECTORS = TEMP_INSPECTORS.length;
// 組立後等点検：実施者プールと、実施事由の選択肢（複数選択可）
const ASSEMBLY_INSPECTORS = [
  "田中 太郎",
  "山本 健太",
  "渡辺 浩",
  "伊藤 大輔",
  "林 大樹",
];
const ASSEMBLY_REASONS = [
  "組立後等",
  "悪天候後",
  "地震後",
  "定期",
  "一部解体後",
  "変更後",
  "その他",
];

/**
 * 点検実施パネルの操作ボタン（表示のみ）。
 * primary＝その画面でいま実施すべき操作。塗りつぶして1つだけ目立たせる。
 * それ以外は淡いグレー枠に落とし、主要アクションが埋もれないようにする。
 * 現場でのスマホ操作を想定し、高さは48px以上を確保する。
 * スマホにはホバーが無いため、ホバー効果は持たせず、
 * 下端の影で浮きを出し、押した瞬間に沈ませて触感を返す。
 */
function ActionButton({ children, disabled, primary, compact, wide }) {
  const raised = primary
    ? {
        bgcolor: TEAL,
        color: "#fff",
        boxShadow: `0 3px 0 ${TEAL_DARK}, 0 6px 14px rgba(53,183,196,.34)`,
        "&:hover": {
          bgcolor: TEAL,
          boxShadow: `0 3px 0 ${TEAL_DARK}, 0 6px 14px rgba(53,183,196,.34)`,
        },
        "&:active": {
          transform: "translateY(2px)",
          boxShadow: `0 1px 0 ${TEAL_DARK}, 0 2px 6px rgba(53,183,196,.28)`,
        },
      }
    : {
        bgcolor: "#fff",
        borderColor: "#d7dbe4",
        color: "text.primary",
        boxShadow: "0 2px 0 #e8ebf0, 0 4px 10px rgba(16,24,40,.07)",
        "&:hover": {
          bgcolor: "#fff",
          borderColor: "#d7dbe4",
          boxShadow: "0 2px 0 #e8ebf0, 0 4px 10px rgba(16,24,40,.07)",
        },
        "&:active": {
          transform: "translateY(2px)",
          boxShadow: "0 0 0 #e8ebf0, 0 2px 5px rgba(16,24,40,.08)",
        },
      };

  return (
    <Button
      variant={primary ? "contained" : "outlined"}
      disabled={disabled}
      sx={{
        width: "100%",
        minHeight: 48,
        borderRadius: "12px",
        px: compact && !wide ? 1 : 2,
        ...(wide ? { gridColumn: "1 / -1" } : null),
        fontSize: primary ? 15 : compact && !wide ? 12.5 : 14,
        fontWeight: primary ? 700 : 500,
        lineHeight: 1.3,
        transition: "transform .08s ease, box-shadow .08s ease",
        "&.Mui-disabled": { boxShadow: "none" },
        ...raised,
      }}
    >
      {children}
    </Button>
  );
}

/**
 * スマホのモックアップ枠。この画面は現場のスマホで見る前提のため、
 * 実機の画面サイズ（390×844）で中身を確認できるようにする。
 * デモ用の操作（表示切替・戻る）は実機には映らないので枠の外に置く。
 */
function PhoneFrame({ children }) {
  return (
    <Box
      sx={{
        width: 390,
        maxWidth: "100%",
        height: 844,
        mx: "auto",
        bgcolor: "#fff",
        border: "12px solid #1f2437",
        borderRadius: "48px",
        boxShadow: "0 24px 60px rgba(16,24,40,.22)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* ノッチ */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 140,
          height: 24,
          bgcolor: "#1f2437",
          borderRadius: "0 0 16px 16px",
          zIndex: 2,
        }}
      />
      {/* アプリのヘッダー（実画面と同じ水色の帯） */}
      <Box sx={{ flex: "none", height: 48, bgcolor: TEAL }} />
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: "14px 14px 16px" }}>
        {children}
      </Box>
    </Box>
  );
}

// 2列に並べるボタン群（1画面に収めるため、主要アクション以外は半分幅にする）
function ButtonGrid({ children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 点検表が紐づいていないときの案内。
 * 点検表は資機材（QRコード）に紐づけて設定するため、未設定だと点検を開始できない。
 * 表示するのは「どちらの点検表も紐づいていない」ときのみ。片方だけなら出さない。
 */
function NoSheetNotice() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        bgcolor: "#fff7ed",
        border: "1px solid #fed7aa",
        borderRadius: "14px",
        p: 1.25,
        my: 0.75,
        textAlign: "left",
      }}
    >
      <ErrorOutlineIcon sx={{ color: "#c2410c", fontSize: 22, mt: "1px", flex: "none" }} />
      <Typography sx={{ fontSize: 13, color: "#9a3412", lineHeight: 1.5 }}>
        「点検用QRコード印刷」で点検表を設定してください
      </Typography>
    </Box>
  );
}

// セクションの区切り（管理者メニューなど）
function SectionLabel({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        mt: 1,
        mb: 0.5,
      }}
    >
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: "text.secondary",
          letterSpacing: ".06em",
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
    </Box>
  );
}

// 機械・仮設の基本情報カード（名称＋状態バッジ＋明細）
function HeaderCard({ name, badge, rows }) {
  return (
    <Paper elevation={0} sx={{ ...CARD, p: 1.5, textAlign: "left", mb: 1.25 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          mb: 1.25,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
          {name}
        </Typography>
        {badge && (
          <Chip
            size="small"
            label={badge}
            sx={{
              bgcolor: "#fee2e2",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: 11,
            }}
          />
        )}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: 2,
          rowGap: 0.5,
          fontSize: 13,
          alignItems: "baseline",
        }}
      >
        {rows.map(([k, v]) => (
          <Box key={k} sx={{ display: "contents" }}>
            <Typography
              sx={{
                fontSize: 12,
                color: "text.secondary",
                whiteSpace: "nowrap",
              }}
            >
              {k}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>
              {v || "—"}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

// 補足文（ボタンが押せない理由など）
function Help({ children }) {
  return (
    <Typography sx={{ fontSize: 12, color: "#98a2b3", mt: "-3px" }}>
      {children}
    </Typography>
  );
}

// 状態切替トグル（value は "undone" / "done"）。labels でボタン表示を差し替え可能。
function StateToggle({ value, onChange, labels = ["未", "済"] }) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, v) => v && onChange(v)}
      aria-label="表示切替（デモ）"
      sx={{
        "& .MuiToggleButton-root": {
          px: 1.75,
          py: 0.5,
          fontSize: 12,
          fontWeight: 700,
          color: "text.secondary",
          borderColor: "divider",
        },
        "& .MuiToggleButton-root.Mui-selected": {
          bgcolor: "#374151",
          color: "#fff",
          "&:hover": { bgcolor: "#374151" },
        },
      }}
    >
      <ToggleButton value="undone">{labels[0]}</ToggleButton>
      <ToggleButton value="done">{labels[1]}</ToggleButton>
    </ToggleButtonGroup>
  );
}

// 数値の増減ステッパー（点検人数など）
function Stepper({ value, onChange, min = 0, max = 9 }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "stretch",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="減らす"
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          minWidth: 36,
          textAlign: "center",
          alignSelf: "stretch",
          fontSize: 13,
          fontWeight: 700,
          borderLeft: "1px solid",
          borderRight: "1px solid",
          borderColor: "divider",
          lineHeight: "30px",
        }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="増やす"
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

// 複数選択（点検事由など）。選択済みの項目をチェックで増減する。
function MultiSelect({ options, selected, onToggle }) {
  return (
    <FormGroup sx={{ width: "100%" }}>
      {options.map((o) => (
        <FormControlLabel
          key={o}
          control={
            <Checkbox
              size="small"
              checked={selected.includes(o)}
              onChange={() => onToggle(o)}
              sx={{ p: 0.5 }}
            />
          }
          label={o}
          slotProps={{
            typography: {
              sx: {
                fontSize: 12.5,
                fontWeight: selected.includes(o) ? 600 : 400,
              },
            },
          }}
          sx={{ ml: 0, gap: 0.875 }}
        />
      ))}
    </FormGroup>
  );
}

// 左右の余白に置くデモ用メニュー（タブに応じて操作項目を出し分け）
function DemoPanel({ tab, m, t }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        position: "fixed",
        top: 84,
        right: 24,
        width: 214,
        zIndex: 30,
        maxHeight: "calc(100vh - 108px)",
        overflowY: "auto",
        p: "14px 16px",
        textAlign: "left",
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(16,24,40,.10)",
        // 狭い画面ではコンテンツ上部にインライン表示
        "@media(max-width:960px)": {
          position: "static",
          width: "auto",
          maxWidth: 390,
          mx: "auto",
          mt: 1,
          boxShadow: "none",
          borderStyle: "dashed",
          bgcolor: "#fafbfc",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: "text.secondary",
          pb: 1,
          mb: 0.75,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        表示切替（デモ）
      </Typography>
      {tab === "machine" ? (
        <>
          <DemoRow label="始業前点検の点検表">
            <StateToggle
              value={m.startSheet ? "done" : "undone"}
              onChange={(v) => m.setStartSheet(v === "done")}
              labels={["なし", "あり"]}
            />
          </DemoRow>
          <DemoRow label="始業前点検">
            <StateToggle value={m.start} onChange={m.setStart} />
          </DemoRow>
          <DemoRow label="月例点検の点検表">
            <StateToggle
              value={m.monthlySheet ? "done" : "undone"}
              onChange={(v) => m.setMonthlySheet(v === "done")}
              labels={["なし", "あり"]}
            />
          </DemoRow>
          <DemoRow label="月例点検" last>
            <StateToggle value={m.monthly} onChange={m.setMonthly} />
          </DemoRow>
        </>
      ) : (
        <>
          <DemoRow label="始業前点検の点検表">
            <StateToggle
              value={t.startSheet ? "done" : "undone"}
              onChange={(v) => t.setStartSheet(v === "done")}
              labels={["なし", "あり"]}
            />
          </DemoRow>
          <DemoRow label="始業前点検 実施回数">
            <Stepper
              value={t.startCount}
              onChange={t.setStartCount}
              min={0}
              max={TEMP_MAX_INSPECTORS}
            />
          </DemoRow>
          <DemoRow label="組立後等点検の点検表">
            <StateToggle
              value={t.assemblySheet ? "done" : "undone"}
              onChange={(v) => t.setAssemblySheet(v === "done")}
              labels={["なし", "あり"]}
            />
          </DemoRow>
          {/* 1回の点検＝事由1つ。選んだ事由の数がそのまま実施回数になる */}
          <DemoRow label="組立後等点検 実施した事由（1つ＝1回）" last>
            <MultiSelect
              options={ASSEMBLY_REASONS}
              selected={t.assemblyReasons}
              onToggle={t.toggleReason}
            />
          </DemoRow>
        </>
      )}
    </Paper>
  );
}

function DemoRow({ label, last, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.75,
        py: 1.125,
        borderBottom: last ? "none" : "1px dashed",
        borderColor: "divider",
      }}
    >
      <Typography sx={{ fontSize: 12.5, color: "#374151" }}>{label}</Typography>
      {children}
    </Box>
  );
}

// 点検状態の帯（済／未）。淡い地色をベタ塗りし、アイコンと状態色の文字で示す。
function Banner({ tone, title, sub }) {
  const c = STATUS[tone];
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        bgcolor: c.bg,
        borderRadius: "14px",
        p: 1.25,
        my: 0.75,
        textAlign: "left",
      }}
    >
      <c.Icon sx={{ color: c.fg, fontSize: 22, mt: "1px", flex: "none" }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: ".04em",
            color: c.fg,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.25 }}>
          {sub}
        </Typography>
      </Box>
    </Box>
  );
}

// 実施者・実施事由などの中立表示（色を変えず情報だけ表示）
function InfoBox({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{ ...CARD, p: "12px 14px", my: 1, textAlign: "left" }}
    >
      <Typography
        sx={{ fontWeight: 700, fontSize: 14, color: "#374151", mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography
        component="div"
        sx={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}
      >
        {children}
      </Typography>
    </Paper>
  );
}

// 機械タブ：ELV-2 の点検実施パネル
function MachinePanel({ start, monthly, startSheet, monthlySheet }) {
  const startDone = start === "done";
  const monthlyDone = monthly === "done";
  // 点検表が紐づいていない種類は、点検記録も存在しない
  const hasRecords = (startSheet && startDone) || (monthlySheet && monthlyDone);
  const monthlyLatest = monthlyDone ? "2026/07/03" : "2026/06/05";

  return (
    <>
      <HeaderCard
        name="ELV - 2"
        badge="使用期限切れ"
        rows={[
          ["使用期間", "2026/05/26 〜 2026/05/29"],
          // 点検表が紐づいていなければ当日の点検自体が存在しないため「—」
          ["7月17日", startSheet ? (startDone ? "点検済" : "点検未") : ""],
          ["取扱責任者（正）", ""],
          ["取扱責任者（副）", ""],
        ]}
      />

      {/* 点検表が紐づいている種類だけ帯を出す */}
      {startSheet && (
        <Banner
          tone={startDone ? "done" : "undone"}
          title={`始業前点検　${startDone ? "済" : "未"}`}
          sub={
            startDone
              ? "本日の始業前点検は実施済みです。"
              : "始業前点検を実施してください。"
          }
        />
      )}

      {monthlySheet && (
        <Banner
          tone={monthlyDone ? "done" : "undone"}
          title={`月例点検　${monthlyDone ? "済" : "未"}`}
          sub={`最新点検日：${monthlyLatest}${monthlyDone ? "（今月実施済）" : "（今月未実施）"}`}
        />
      )}

      {/* 点検表がどちらも紐づいていないときだけ設定を促す */}
      {!startSheet && !monthlySheet && <NoSheetNotice />}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* 点検を始める操作は全幅。主要アクションは常に塗りつぶして目立たせる */}
        <ActionButton primary disabled={!startSheet}>
          始業前点検開始
        </ActionButton>
        <ActionButton disabled={!monthlySheet}>月例点検開始</ActionButton>
        <ButtonGrid>
          {/* 2列分の幅をとる */}
          <ActionButton compact wide disabled>
            作業計画書・指示書確認
          </ActionButton>
          <ActionButton compact>記録確認</ActionButton>
          <ActionButton compact disabled={startDone}>
            非稼働登録
          </ActionButton>
          <ActionButton compact>受理証確認</ActionButton>
          <ActionButton compact>本日の予約</ActionButton>
        </ButtonGrid>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          mt: 0.5,
        }}
      >
        <SectionLabel>管理者メニュー</SectionLabel>
        <ButtonGrid>
          <ActionButton compact disabled={!hasRecords}>
            点検元請確認
          </ActionButton>
          <ActionButton compact>持込点検表一覧</ActionButton>
          <ActionButton compact>過去点検記録確認</ActionButton>
        </ButtonGrid>
        {!hasRecords && <Help>点検記録がありません</Help>}
      </Box>
    </>
  );
}

// 仮設・その他タブ：わくぐみあしば の点検実施パネル
// ・始業前点検：実施0回＝赤色で「未」。1回以上は「済」とはせず実施者名のみ表示
//   （同じ足場でも使用者ごとに点検が必要で、何回で「済」とするかは現場ごとに異なるため）
// ・組立後等点検：「未」ステータスは持たず、1回の点検＝実施者1名＋事由1つ。
//   繰り返し実施すると組が増えるため、実施者と事由はセットで1行ずつ並べる。
function TempPanel({ startCount, assemblyReasons, startSheet, assemblySheet }) {
  const startDone = startCount > 0;
  // 選んだ事由1つ＝1回の点検。実施者を順に割り当ててセットにする
  const assemblyRounds = ASSEMBLY_REASONS.filter((r) =>
    assemblyReasons.includes(r),
  ).map((reason, i) => ({ reason, inspector: ASSEMBLY_INSPECTORS[i] }));
  const assemblyDone = assemblyRounds.length > 0;
  const startInspectors = TEMP_INSPECTORS.slice(0, startCount).join("、");
  const hasRecords = (startSheet && startDone) || (assemblySheet && assemblyDone);

  return (
    <>
      {/* 仮設・その他は当日のステータスを持たない（使用者ごとに点検が必要で「済」の基準が無いため） */}
      <HeaderCard
        name="わくぐみあしば"
        rows={[
          ["取扱責任者（正）", ""],
          ["取扱責任者（副）", ""],
        ]}
      />

      {/* 点検表が紐づいている種類だけ出す。実施なし＝赤帯／実施ありは実施者名のみ */}
      {startSheet &&
        (startDone ? (
          <InfoBox title="始業前点検">実施者：{startInspectors}</InfoBox>
        ) : (
          <Banner
            tone="red"
            title="始業前点検　未"
            sub="始業前点検を実施してください。"
          />
        ))}

      {/* 組立後等点検：1回の点検＝実施者1名＋事由1つ。実施した回数ぶん1行ずつ並べる */}
      {assemblySheet && (
        <InfoBox title="組立後等点検">
          {assemblyDone ? (
            assemblyRounds.map((r) => (
              <Box key={r.reason} component="div">
                {r.inspector}（{r.reason}）
              </Box>
            ))
          ) : (
            <Box component="span" sx={{ display: "inline-block", minHeight: 20 }}>
              &nbsp;
            </Box>
          )}
        </InfoBox>
      )}

      {/* 点検表がどちらも紐づいていないときだけ設定を促す */}
      {!startSheet && !assemblySheet && <NoSheetNotice />}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* 点検を始める操作は全幅。主要アクションは常に塗りつぶして目立たせる */}
        <ActionButton primary disabled={!startSheet}>
          始業前点検開始
        </ActionButton>
        <ActionButton disabled={!assemblySheet}>組立後等点検開始</ActionButton>
        <ButtonGrid>
          {/* 2列分の幅をとる */}
          <ActionButton compact wide disabled>
            作業計画書・指示書確認
          </ActionButton>
          <ActionButton compact>記録確認</ActionButton>
          <ActionButton compact>非稼働登録</ActionButton>
        </ButtonGrid>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          mt: 0.5,
        }}
      >
        <SectionLabel>管理者メニュー</SectionLabel>
        <ButtonGrid>
          <ActionButton compact disabled={!hasRecords}>
            点検元請確認
          </ActionButton>
          <ActionButton compact>持込点検表一覧</ActionButton>
          <ActionButton compact>過去点検記録確認</ActionButton>
        </ButtonGrid>
        {!hasRecords && <Help>点検記録がありません</Help>}
      </Box>
    </>
  );
}

export default function InspectionRun() {
  const [tab, setTab] = useState("machine"); // machine | temp
  // 機械タブの表示状態
  const [mStart, setMStart] = useState("undone");
  const [mMonthly, setMMonthly] = useState("done");
  // 点検表（点検用QRコード印刷で資機材に紐づける）の有無
  const [mStartSheet, setMStartSheet] = useState(true);
  const [mMonthlySheet, setMMonthlySheet] = useState(true);
  // 仮設タブの表示状態
  const [tStartCount, setTStartCount] = useState(0);
  const [tAssemblyReasons, setTAssemblyReasons] = useState(["悪天候後"]);
  const [tStartSheet, setTStartSheet] = useState(true);
  const [tAssemblySheet, setTAssemblySheet] = useState(true);
  const toggleReason = (r) =>
    setTAssemblyReasons((rs) =>
      rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r],
    );

  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Box sx={{ p: "20px 16px 56px" }}>
        {/* デモ用のヘッダー（実機には映らないので枠の外） */}
        <Box sx={{ maxWidth: 390, mx: "auto", mb: 2 }}>
          <Button
            component={Link}
            to="/"
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            sx={{ fontSize: 12 }}
          >
            デモ画面一覧へ戻る
          </Button>
          <Typography
            component="h1"
            sx={{
              fontSize: 18,
              fontWeight: 700,
              textAlign: "center",
              mt: 1.25,
            }}
          >
            点検実施画面
          </Typography>
        </Box>

        {/* 表示対象の切替はデモ用の操作なので、枠の外（モックアップの上）に置く */}
        <Box sx={{ maxWidth: 390, mx: "auto", mb: 2 }}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={tab}
            onChange={(_, v) => v && setTab(v)}
            aria-label="点検対象の切替"
            sx={{
              p: "4px",
              bgcolor: "#f1f3f5",
              borderRadius: "999px",
              "& .MuiToggleButton-root": {
                border: 0,
                borderRadius: "999px !important",
                py: 1,
                fontSize: 13.5,
                fontWeight: 600,
                color: "text.secondary",
              },
              "& .MuiToggleButton-root.Mui-selected": {
                bgcolor: "#fff",
                color: "text.primary",
                boxShadow: "0 1px 3px rgba(16,24,40,.12)",
                "&:hover": { bgcolor: "#fff" },
              },
            }}
          >
            <ToggleButton value="machine">機械</ToggleButton>
            <ToggleButton value="temp">仮設・その他</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <PhoneFrame>
          <Box sx={{ textAlign: "center" }}>
            {tab === "machine" ? (
              <MachinePanel
                start={mStart}
                monthly={mMonthly}
                startSheet={mStartSheet}
                monthlySheet={mMonthlySheet}
              />
            ) : (
              <TempPanel
                startCount={tStartCount}
                assemblyReasons={tAssemblyReasons}
                startSheet={tStartSheet}
                assemblySheet={tAssemblySheet}
              />
            )}
          </Box>
        </PhoneFrame>

        {/* デモ用メニュー。実機には映らないので枠の外（広い画面は右端に固定、狭い画面はモックアップの下） */}
        <DemoPanel
          tab={tab}
          m={{
            start: mStart,
            setStart: setMStart,
            monthly: mMonthly,
            setMonthly: setMMonthly,
            startSheet: mStartSheet,
            setStartSheet: setMStartSheet,
            monthlySheet: mMonthlySheet,
            setMonthlySheet: setMMonthlySheet,
          }}
          t={{
            startCount: tStartCount,
            setStartCount: setTStartCount,
            assemblyReasons: tAssemblyReasons,
            toggleReason,
            startSheet: tStartSheet,
            setStartSheet: setTStartSheet,
            assemblySheet: tAssemblySheet,
            setAssemblySheet: setTAssemblySheet,
          }}
        />
      </Box>
    </ScopedCssBaseline>
  );
}
