import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import { FONT_SCALE, useKynext } from "./KynextContext.jsx";
import { STATUS_COLOR, STATUS_JA } from "../../kynextData.js";

// ===== KY-NEXT デモ共通部品（本番 @repo/ui / components/kynext 相当） =====

// 画面幅の判定（本番 useMobile / useTablet）
export const useIsMobile = () => useMediaQuery("(max-width:600px)");
export const useIsTabletOrMobile = () => useMediaQuery("(max-width:900px)");

// ステータスチップ（本番 KYNEXTSheetStatusChip）
export function StatusChip({ status, ...rest }) {
  if (!status) return <Chip label="－" size="small" {...rest} />;
  return <Chip label={STATUS_JA[status]} color={STATUS_COLOR[status]} size="small" sx={{ fontWeight: 600 }} {...rest} />;
}

// 必須マーク（本番 RequiredMark）
export function RequiredMark({ disabled }) {
  return (
    <Box
      component="span"
      sx={{
        ml: 0.5,
        px: 0.75,
        py: 0.125,
        fontSize: 11,
        lineHeight: 1.4,
        borderRadius: "99999px",
        bgcolor: disabled ? "action.disabled" : "#D5592E",
        color: "common.white",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      必須
    </Box>
  );
}

// 「ラベル｜値」の1行（本番 InfoRowBox）。isLarge のときは縦並び。
export const LABEL_COLUMN_WIDTH = 160;
export function InfoRow({ title, value, isLarge = false }) {
  const values = Array.isArray(value) ? value : [value];
  return (
    <Box sx={{ display: "flex", flexDirection: isLarge ? "column" : "row", width: "100%", gap: isLarge ? 0 : 2 }}>
      <Typography color="text.secondary" sx={isLarge ? undefined : { width: LABEL_COLUMN_WIDTH, flexShrink: 0, wordBreak: "break-word" }}>
        {title}
      </Typography>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        {values.length === 0 ? <Typography>-</Typography> : values.map((v, i) => <Typography key={i} sx={{ wordBreak: "break-word" }}>{v || "-"}</Typography>)}
      </Stack>
    </Box>
  );
}

// 文字サイズ切替（本番 FontSizeToggle）。詳細画面などの右上に置く。
export function FontSizeToggle() {
  const { fontSize, setFontSize } = useKynext();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={fontSize}
      onChange={(_, v) => v && setFontSize(v)}
      aria-label="文字サイズ"
      sx={{ "& .MuiToggleButton-root": { px: 1.25, py: 0.25, fontSize: 12 } }}
    >
      <ToggleButton value="normal">
        <FormatSizeIcon sx={{ fontSize: 14, mr: 0.5 }} />標準
      </ToggleButton>
      <ToggleButton value="medium">中</ToggleButton>
      <ToggleButton value="large">大</ToggleButton>
    </ToggleButtonGroup>
  );
}

// 文字サイズ切替を反映する枠（本番 FontSizeThemeProvider の簡易版）
export function FontSizeScope({ children }) {
  const { fontSize } = useKynext();
  const scale = FONT_SCALE[fontSize] ?? 1;
  return <Box sx={{ fontSize: `${scale}em`, "& .MuiTypography-root, & .MuiButton-root, & .MuiChip-label": { fontSize: scale === 1 ? undefined : "1em" } }}>{children}</Box>;
}

// 無効化した要素にツールチップで理由を出す（本番 TextAlignCenterTooltip）
export function DisabledTooltip({ disabled, title, children }) {
  if (!disabled || !title) return children;
  return (
    <Tooltip title={title} arrow>
      <span style={{ display: "inline-flex" }}>{children}</span>
    </Tooltip>
  );
}

// 確認ダイアログ（本番 useSimpleDialog）。confirm() が { accepted } を resolve する。
export function useConfirmDialog({ title, children, yesLabel = "はい", noLabel = "キャンセル", color = "primary" }) {
  const [state, setState] = useState(null);
  const confirm = () => new Promise((resolve) => setState({ resolve }));
  const close = (accepted) => {
    state?.resolve({ accepted });
    setState(null);
  };
  const renderDialog = (extra) => (
    <Dialog open={!!state} onClose={() => close(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      {(children || extra) && (
        <DialogContent>
          {typeof children === "string" ? <Typography>{children}</Typography> : children}
          {extra}
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={() => close(false)}>
          {noLabel}
        </Button>
        <Button variant="contained" color={color} onClick={() => close(true)}>
          {yesLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
  return { confirm, renderDialog };
}

// 通知（本番 notistack SnackbarProvider）。KynextProvider の toasts を表示する。
export function KynextToasts() {
  const { toasts } = useKynext();
  return (
    <Stack spacing={1} sx={{ position: "fixed", left: 16, bottom: 16, zIndex: 2000 }}>
      {toasts.map((t) => (
        <Snackbar key={t.id} open anchorOrigin={{ vertical: "bottom", horizontal: "left" }} sx={{ position: "static", transform: "none" }}>
          <Alert severity={t.variant} variant="filled" sx={{ minWidth: 260 }}>
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}

// 手書きサイン枠（本番 @repo/features/src/signature の SignaturePad）
// ref 経由で { isEmpty(), toDataURL(), clear() } を使えるように onReady で API を渡す。
export function SignaturePad({ disabled = false, height = 180, onReady }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2437";
    onReady?.({
      isEmpty: () => !dirtyRef.current,
      toDataURL: () => canvas.toDataURL("image/png"),
      clear: () => {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        dirtyRef.current = false;
        setDirty(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dirtyRef = useRef(false);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const start = (e) => {
    if (disabled) return;
    e.preventDefault();
    drawing.current = true;
    dirtyRef.current = true;
    setDirty(true);
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    try {
      canvasRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    drawing.current = false;
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    dirtyRef.current = false;
    setDirty(false);
  };

  return (
    <Box>
      <Box
        component="canvas"
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        sx={{
          display: "block",
          width: "100%",
          height,
          border: "1px solid",
          borderColor: disabled ? "action.disabled" : "#9e9e9e",
          borderRadius: 1,
          bgcolor: disabled ? "action.hover" : "#fff",
          touchAction: "none",
          cursor: disabled ? "not-allowed" : "crosshair",
          opacity: disabled ? 0.6 : 1,
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button size="small" variant="outlined" onClick={clear} disabled={disabled || !dirty}>
          クリア
        </Button>
      </Box>
    </Box>
  );
}

// 画面下部の操作ボタン群（本番 SplitFab）。スマホ・タブレットでは画面下に固定して並べる。
export const SPLIT_FAB_HEIGHT = 80;
export function SplitFab({ actions, disabled = false, visible = true, overlay = null, liftBy = 0 }) {
  return (
    <>
      <Box sx={{ height: SPLIT_FAB_HEIGHT + liftBy }} />
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 12 + liftBy,
          zIndex: 1200,
          px: 2,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 520, position: "relative", pointerEvents: "auto" }}>
          {overlay && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", zIndex: 1 }}>
              {overlay}
            </Box>
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              opacity: visible ? 1 : 0,
              transition: "opacity .3s",
              "& .MuiButton-root": { flex: 1, minHeight: 44, borderRadius: 2, boxShadow: 6 },
            }}
          >
            {actions.map((a) => (
              <Button key={a.label} variant="contained" startIcon={a.icon} disabled={disabled || a.disabled} onClick={a.onClick} color={a.color}>
                {a.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  );
}
