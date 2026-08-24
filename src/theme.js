import { createTheme } from "@mui/material/styles";

// 本番（/workplan）と同じ MUI ベースに揃えるためのテーマ。
// 色・角丸は現行デモのキャプチャに合わせ、挙動は MUI 標準のままにしている。
const theme = createTheme({
  palette: {
    primary: { main: "#4f5bd5", dark: "#4048b8", light: "#eceefc", contrastText: "#fff" },
    success: { main: "#2e9e4f" },
    warning: { main: "#e08c14" },
    error: { main: "#e5484d" },
    text: { primary: "#1f2437", secondary: "#6b7280" },
    background: { default: "#eef1f8", paper: "#ffffff" },
    divider: "#e6e9f0",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif',
    fontSize: 13,
    h1: { fontSize: 15, fontWeight: 700 },
    h2: { fontSize: 13, fontWeight: 700 },
    body2: { fontSize: 12.5 },
    caption: { fontSize: 11.5 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 16 },
        sizeSmall: { paddingInline: 12, fontSize: 12.5 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // カードは枠線＋薄い影（キャプチャに合わせる）
        rounded: { borderRadius: 10 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: "1px solid #e6e9f0",
          boxShadow: "0 1px 2px rgba(23,27,48,.06), 0 4px 14px rgba(23,27,48,.04)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 20, "&:last-child": { paddingBottom: 20 } } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiSelect: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: "#fff" },
        notchedOutline: { borderColor: "#d7dbe4" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: 12.5, padding: "8px 10px", borderColor: "#eef0f5" },
        head: {
          fontSize: 11.5,
          fontWeight: 600,
          color: "#6b7280",
          backgroundColor: "#f7f8fb",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        sizeSmall: { height: 22, fontSize: 11 },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 40 } },
    },
    MuiTabs: { styleOverrides: { root: { minHeight: 40 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});

export default theme;
