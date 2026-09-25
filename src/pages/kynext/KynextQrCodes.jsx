import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Alert, Box, Button, Container, GlobalStyles, Stack, Tab, Tabs, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { useIsMobile } from "../../components/kynext/KynextCommon.jsx";

// CSS の mm → px は 96dpi 固定
const A4_LANDSCAPE_WIDTH_PX = (297 / 25.4) * 96;
const A4_LANDSCAPE_HEIGHT_PX = (210 / 25.4) * 96;

// 要素の幅を追いかける（本番 useElementWidth）
function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/**
 * A4 横（297mm × 210mm）固定の印刷レイアウトを、画面幅に収まるよう縮小して表示する（本番 A4LandscapePreview）。
 * レイアウト自体をレスポンシブにすると印刷物が画面幅で変わってしまうため、DOM は印刷サイズのまま transform で見た目だけ縮める。
 * 印刷時は等倍に戻す。
 */
function A4LandscapePreview({ children }) {
  const ref = useRef(null);
  const width = useElementWidth(ref);
  const scale = width > 0 ? Math.min(1, width / A4_LANDSCAPE_WIDTH_PX) : 1;
  return (
    <Box ref={ref} sx={{ width: "100%", height: `${A4_LANDSCAPE_HEIGHT_PX * scale}px`, "@media print": { height: "auto" } }}>
      <Box sx={{ transform: `scale(${scale})`, transformOrigin: "top left", "@media print": { transform: "none" } }}>{children}</Box>
    </Box>
  );
}

// A4 横の用紙（灰色の台紙の中に白い枠）。印刷時は用紙そのものになる。
function A4Sheet({ children, pageBreakAfter = "auto" }) {
  return (
    <Box
      sx={{
        width: "297mm",
        height: "210mm",
        py: "15mm",
        px: "10mm",
        mx: "auto",
        bgcolor: "#f5f5f5",
        "@media print": { width: "auto", height: "auto", p: 0, bgcolor: "transparent" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          border: "1px solid #ccc",
          bgcolor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "@media print": { width: "277mm", height: "180mm", border: "1px solid #000", bgcolor: "transparent", pageBreakAfter },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// 現場名（長い名前でも1〜2行に収まるよう縮める。本番 useFitText の簡易版）
function ProjectName({ name, base }) {
  const fontSize = name.length > 24 ? base * 0.6 : name.length > 14 ? base * 0.8 : base;
  return (
    <Typography variant="h1" sx={{ fontSize: `${fontSize}rem`, textAlign: "center", lineHeight: 1.25, wordBreak: "break-word" }}>
      {name}
    </Typography>
  );
}

// 現場掲示用（本番 KYNEXTSheetsQRCodesBox）。職長も作業員も同じ URL で開けるため QR は 1 つ。
function ProjectQrBox({ url }) {
  const { project } = useKynext();
  return (
    <A4Sheet>
      <Stack sx={{ alignItems: "center", width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30mm", mb: "8mm", px: "10mm", width: "100%" }}>
          <ProjectName name={project.name} base={3} />
        </Box>
        <Typography variant="h1" sx={{ fontSize: "2.5rem", textAlign: "center", mb: "8mm" }}>
          KYシート一覧
        </Typography>
        <Typography variant="h2" sx={{ fontSize: "1.5rem", mt: "5mm", mb: "2mm" }}>
          職長・作業員共用
        </Typography>
        <a href={url} style={{ display: "contents" }}>
          <QRCodeSVG value={url} size={280} level="M" />
        </a>
      </Stack>
    </A4Sheet>
  );
}

// マイコード（本番 KYNEXTSheetsPerUserQRCodesBox）。ユーザーを特定した URL で、読み取るだけで確認・サインができる。
function PerUserQrBox({ url }) {
  const { project, me } = useKynext();
  return (
    <A4Sheet pageBreakAfter="always">
      <Stack sx={{ alignItems: "center", width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30mm", mb: "8mm", px: "10mm", width: "100%" }}>
          <ProjectName name={project.name} base={2.5} />
        </Box>
        <Typography variant="h2" sx={{ fontSize: "2.5rem", textAlign: "center", mb: "5mm" }}>
          {me.name}
        </Typography>
        <Box sx={{ mt: "3mm", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <a href={url} style={{ display: "contents" }}>
            <QRCodeSVG value={url} size={280} level="M" />
          </a>
          <Alert
            severity="warning"
            variant="filled"
            sx={{ mt: "5mm", fontSize: "1.25rem", fontWeight: 700, px: "6mm", py: "3mm", maxWidth: "100%", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
          >
            QRコードを読み取るだけで、本日のKYシートの確認とサインができます。
          </Alert>
        </Box>
      </Stack>
    </A4Sheet>
  );
}

/**
 * QRコード発行（本番 pages/kySheets/qr-codes/index.tsx + KYNEXTSheetsQRCodes）。
 * 「現場掲示用」「マイコード」を A4 横でプレビューし、そのまま印刷する。
 * `?type=per-user` で初期タブを切り替える。
 */
export default function KynextQrCodes() {
  const mobile = useIsMobile();
  const { me } = useKynext();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("type") === "per-user" ? "per-user" : "project");

  // 読み取り用は絶対URL（現場のスマホから開けるように）
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const projectUrl = `${origin}/kynext`;
  const perUserUrl = `${origin}/kynext?user=${me.id}`;

  return (
    <>
      {/* 印刷は A4 横。index.css の帳票用ルール（body *{visibility:hidden}）が全ページに掛かるため、
          この画面の用紙だけ表示を戻して用紙の先頭に寄せる。サイドバー・ヘッダ・タブ行は出さない。 */}
      <GlobalStyles
        styles={{
          "@page": { size: "A4 landscape", margin: "15mm 10mm" },
          "@media print": {
            ".kynext-qr-print, .kynext-qr-print *": { visibility: "visible" },
            ".kynext-qr-print": { position: "absolute", left: 0, top: 0, width: "100%" },
            ".kynext-qr-toolbar, .MuiDrawer-root, .MuiAppBar-root": { display: "none !important" },
          },
        }}
      />
      <Container>
        <Stack
          className="kynext-qr-toolbar"
          direction={mobile ? "column" : "row"}
         
         
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: mobile ? "stretch" : "center", mb: 2 }}
        >
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="現場掲示用" value="project" />
            <Tab label="マイコード" value="per-user" />
          </Tabs>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ alignSelf: mobile ? "flex-end" : undefined }}>
            印刷
          </Button>
        </Stack>
        <Box className="kynext-qr-print">
          <A4LandscapePreview>
            {tab === "project" && <ProjectQrBox url={projectUrl} />}
            {tab === "per-user" && <PerUserQrBox url={perUserUrl} />}
          </A4LandscapePreview>
        </Box>
      </Container>
    </>
  );
}
