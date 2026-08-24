import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  ScopedCssBaseline,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { WORKADJUST_NAV, WORKADJUST_EXTERNAL_LINKS, formatDateStr } from "../data.js";
import { WaSettingsProvider, useWaSettings } from "./wa/WaSettingsContext.jsx";
import DatePager from "./wa/DatePager.jsx";
import { listOverlaps, KIND_LABEL, fmtHour } from "./wa/rsvTimeline.js";

const NAV_WIDTH = 248;
const NARROW = "(max-width:768px)"; // CSSのブレークポイントに合わせる
// 印刷時はサイドバー・ヘッダーを隠す（QRコード掲示物の出力用）
const PRINT_HIDDEN = { "@media print": { display: "none" } };

// メニュー名 → アイコン。ラベルは data.js 側で定義しているためここで対応づける。
const MENU_ICON = {
  作業予定一覧: ListAltOutlinedIcon,
  予約: EventAvailableOutlinedIcon,
  予約実績出力: FileDownloadOutlinedIcon,
  配置図作成: MapOutlinedIcon,
  QRコード発行: QrCode2OutlinedIcon,
  設定: SettingsOutlinedIcon,
  作業配置図設定: MapOutlinedIcon,
  "資機材・ゲート登録": ConstructionOutlinedIcon,
  協力会社設定: BusinessOutlinedIcon,
  予約設定: ScheduleOutlinedIcon,
  安全セーフティ: HealthAndSafetyOutlinedIcon,
  "出面・日報管理": AssignmentOutlinedIcon,
  "KY NEXT": WarningAmberOutlinedIcon,
  作業計画書NEO: DescriptionOutlinedIcon,
};
const iconOf = (label) => MENU_ICON[label] || CircleOutlinedIcon;

const navItemSx = {
  borderRadius: 2,
  minHeight: 40,
  px: 1.5,
  "&.Mui-selected": {
    bgcolor: "primary.light",
    color: "primary.main",
    "&:hover": { bgcolor: "primary.light" },
  },
};

// ヘッダーの共通日付送り（作業日を共有）。
// 日付が意味を持つ「予約」「作業予定一覧」以外のページでは非アクティブにする。
function HeaderDatePager() {
  const { date, setDate, confirmLeave } = useWaSettings();
  const { pathname } = useLocation();
  const dateActive =
    pathname === "/workadjust" ||
    pathname === "/workadjust/" ||
    pathname.startsWith("/workadjust/reservation") ||
    pathname === "/workadjust/floor-plan" ||
    pathname.startsWith("/workadjust/floor-plan/");
  return (
    <DatePager
      value={date}
      onChange={(d) => {
        if (confirmLeave()) setDate(d);
      }}
      disabled={!dateActive}
    />
  );
}

// 閲覧ロール切替（元請 / 職長）。現状は切替の器のみで表示内容は共通。
function RoleSwitch() {
  const { role, setRole } = useWaSettings();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={role}
      onChange={(_, v) => v && setRole(v)}
      aria-label="閲覧ロール切替"
      sx={{
        bgcolor: "background.paper",
        "& .MuiToggleButton-root": {
          border: 0,
          px: { xs: 1, md: 1.75 },
          py: 0.75,
          fontSize: 12.5,
          whiteSpace: "nowrap",
          borderRadius: 2.5,
          color: "text.secondary",
        },
        "& .MuiToggleButton-root.Mui-selected": {
          color: "primary.contrastText",
          bgcolor: "primary.main",
          "&:hover": { bgcolor: "primary.dark" },
        },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        p: "2px",
      }}
    >
      <ToggleButton value="prime">元請</ToggleButton>
      <ToggleButton value="foreman">職長</ToggleButton>
    </ToggleButtonGroup>
  );
}

// 予約の重複通知ベル（通常予約のみ・スポットは対象外）
function OverlapBell() {
  const { reservations, date } = useWaSettings();
  const [anchor, setAnchor] = useState(null);
  const overlaps = listOverlaps(reservations, date);
  const n = overlaps.length;
  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        title="予約の重複通知"
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}
      >
        <Badge badgeContent={n} color="error">
          <NotificationsOutlinedIcon fontSize="small" />
        </Badge>
      </IconButton>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 360, maxWidth: "calc(100vw - 24px)", maxHeight: "70vh" } } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.75,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
            予約の重複通知（{formatDateStr(date)}）
          </Typography>
          <IconButton size="small" onClick={() => setAnchor(null)} aria-label="閉じる">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        {n === 0 ? (
          <Typography sx={{ p: 2.5, fontSize: 13 }} color="text.secondary">
            重複している通常予約はありません。
          </Typography>
        ) : (
          <>
            <Typography
              sx={{
                px: 1.75,
                py: 1.5,
                fontSize: 13,
                color: "error.main",
                bgcolor: "#fdecec",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              通常予約の重複が <strong>{n}</strong> 件あります。
            </Typography>
            <Box sx={{ p: 0.75 }}>
              {overlaps.map((o, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.25,
                    borderBottom: i === n - 1 ? 0 : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      display: "inline-block",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "primary.main",
                      bgcolor: "primary.light",
                      borderRadius: 1,
                      px: 1,
                      py: 0.25,
                      mb: 0.75,
                    }}
                  >
                    {KIND_LABEL[o.kind]}／{o.resource}
                  </Typography>
                  {o.members.map((m, k) => (
                    <Typography key={k} sx={{ fontSize: 12.5, lineHeight: 1.6, pl: 1.5 }}>
                      ・{m.company}（{m.start}〜{m.end}）
                    </Typography>
                  ))}
                  <Typography sx={{ fontSize: 12, mt: 0.5, color: "error.main" }}>
                    重複時間帯 {fmtHour(o.os)}〜{fmtHour(o.oe)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}

// サイドバー最下部のアカウントメニュー（遷移先はデモのため未実装）
const ACCOUNT_SECTIONS = [
  [
    { label: "アカウント設定", Icon: BadgeOutlinedIcon, external: true },
    { label: "ユーザー一覧", Icon: GroupOutlinedIcon, external: true },
    { label: "現場情報", Icon: AssignmentOutlinedIcon },
    { label: "現場選択", Icon: FolderOutlinedIcon },
  ],
  [
    { label: "見積依頼サービス", Icon: RequestQuoteOutlinedIcon, external: true },
    { label: "発注サービス", Icon: ShoppingCartOutlinedIcon, external: true },
    { label: "在庫管理サービス", Icon: Inventory2OutlinedIcon, external: true },
    { label: "利用規約", Icon: ArticleOutlinedIcon, external: true },
    { label: "プライバシーポリシー", Icon: ShieldOutlinedIcon, external: true },
  ],
];

function AccountMenu() {
  const [anchor, setAnchor] = useState(null);
  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
      <ListItemButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ py: 1.5, px: 2 }}>
        <Avatar sx={{ width: 30, height: 30, mr: 1.25, bgcolor: "#f2b8b5", color: "#7a271a", fontSize: 13, fontWeight: 700 }}>
          A
        </Avatar>
        <ListItemText
          primary="Arch管理者"
          secondary="テストプロジェクト"
          slotProps={{
            primary: { noWrap: true, sx: { fontSize: 13, fontWeight: 600 } },
            secondary: { noWrap: true, sx: { fontSize: 11 } },
          }}
        />
        {anchor ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Menu
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 232, maxHeight: "72vh" } } }}
      >
        <Box sx={{ display: "flex", gap: 1.25, px: 1.5, py: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: "#f2b8b5", color: "#7a271a", fontSize: 14, fontWeight: 700 }}>
            A
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              株式会社Arch
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              テストプロジェクト
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, mt: 0.25 }}>Arch管理者</Typography>
          </Box>
        </Box>
        {ACCOUNT_SECTIONS.map((section, si) => [
          <Divider key={"d" + si} />,
          ...section.map(({ label, Icon, external }) => (
            <MenuItem key={label} onClick={() => setAnchor(null)} sx={{ fontSize: 13 }}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
              {external && <OpenInNewIcon sx={{ fontSize: 13, color: "text.secondary", ml: 1 }} />}
            </MenuItem>
          )),
        ])}
        <Divider />
        <MenuItem
          onClick={() => setAnchor(null)}
          sx={{ justifyContent: "center", color: "primary.main", fontWeight: 700, fontSize: 13 }}
        >
          <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          ログアウト
        </MenuItem>
      </Menu>
    </Box>
  );
}

// パス → メニュー名（画面タイトル／アクティブ判定に使用）
// ルート（/workadjust）は作業予定一覧
const ROUTES = [
  ["/workadjust/reserve-export", "予約実績出力"],
  ["/workadjust/reservation", "予約"],
  ["/workadjust/floor-plan-setting", "作業配置図設定"],
  ["/workadjust/floor-plan", "配置図作成"],
  ["/workadjust/qr", "QRコード発行"],
  ["/workadjust/registry", "資機材・ゲート登録"],
  ["/workadjust/companies", "協力会社設定"],
  ["/workadjust/settings", "予約設定"],
];

function currentMenu(pathname) {
  for (const [path, name] of ROUTES) {
    if (pathname.startsWith(path)) return name;
  }
  return "作業予定一覧";
}

function WorkAdjustLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = currentMenu(location.pathname);
  const { role, confirmLeave } = useWaSettings();
  const narrow = useMediaQuery(NARROW);
  // 職長ビューでは「設定」グループ（＝childrenを持つ項目）と「配置図作成」を非表示にする
  // QR発行はアコーディオンを廃して単独項目にしたため、明示的に非表示にする
  // （従来は children を持つグループごと職長には出していなかった）
  const HIDDEN_FOR_FOREMAN = ["配置図作成", "QRコード発行"];
  const navItems = WORKADJUST_NAV.filter(
    (n) => !(role === "foreman" && (n.children || HIDDEN_FOR_FOREMAN.includes(n.label)))
  );
  // アコーディオン（children を持つグループ）の開閉。配下にいるグループは初期展開
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    WORKADJUST_NAV.forEach((n) => {
      if (n.children) init[n.label] = n.children.includes(active);
    });
    return init;
  });
  const toggleGroup = (label) => setOpenGroups((o) => ({ ...o, [label]: !o[label] }));
  // モバイル：サイドメニュー（ドロワー）の開閉
  const [navOpen, setNavOpen] = useState(false);

  function selectMenu(m) {
    if (!confirmLeave()) return; // 未保存の編集があれば確認
    setNavOpen(false); // 遷移したらドロワーを閉じる
    if (m === "作業予定一覧") navigate("/workadjust");
    else if (m === "予約") navigate("/workadjust/reservation");
    else if (m === "予約実績出力") navigate("/workadjust/reserve-export");
    else if (m === "配置図作成") navigate("/workadjust/floor-plan");
    else if (m === "QRコード発行") navigate("/workadjust/qr");
    else if (m === "作業配置図設定") navigate("/workadjust/floor-plan-setting");
    else if (m === "資機材・ゲート登録") navigate("/workadjust/registry");
    else if (m === "協力会社設定") navigate("/workadjust/companies");
    else if (m === "予約設定") navigate("/workadjust/settings");
  }
  // ページ離脱をともなうリンク（ブランド／デモ一覧へ戻る）の共通ハンドラ
  function guardLink(e) {
    if (!confirmLeave()) {
      e.preventDefault();
      return;
    }
    setNavOpen(false);
  }

  const drawerBody = (
    <>
      <Toolbar sx={{ minHeight: 56, px: 2.25 }}>
        <Typography
          component={Link}
          to="/workadjust"
          onClick={guardLink}
          noWrap
          sx={{ fontSize: 15, fontWeight: 700, color: "text.primary", textDecoration: "none" }}
        >
          作業間調整pro
        </Typography>
      </Toolbar>
      <Divider />

      <List sx={{ p: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = iconOf(item.label);
          if (!item.children) {
            return (
              <ListItemButton
                key={item.label}
                selected={active === item.label}
                onClick={() => selectMenu(item.label)}
                sx={navItemSx}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: { fontSize: 13, fontWeight: active === item.label ? 600 : 500 },
                    },
                  }}
                />
              </ListItemButton>
            );
          }
          const open = !!openGroups[item.label];
          return (
            <Box key={item.label}>
              <ListItemButton
                onClick={() => toggleGroup(item.label)}
                aria-expanded={open}
                sx={navItemSx}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 500 } } }}
                />
                {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </ListItemButton>
              <Collapse in={open} timeout="auto" unmountOnExit>
                {item.children.map((c) => {
                  const ChildIcon = iconOf(c);
                  return (
                    <ListItemButton
                      key={c}
                      selected={active === c}
                      onClick={() => selectMenu(c)}
                      sx={{ ...navItemSx, pl: 3 }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
                        <ChildIcon sx={{ fontSize: 17 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={c}
                        slotProps={{
                          primary: { sx: { fontSize: 12.5, fontWeight: active === c ? 600 : 500 } },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </Collapse>
            </Box>
          );
        })}

        {/* 別ドメインのサービスへの外部リンク */}
        {Object.keys(WORKADJUST_EXTERNAL_LINKS).map((m) => {
          const Icon = iconOf(m);
          return (
            <ListItemButton
              key={m}
              component="a"
              href={WORKADJUST_EXTERNAL_LINKS[m]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setNavOpen(false)}
              sx={navItemSx}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={m} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 500 } } }} />
              <OpenInNewIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <Box
        component={Link}
        to="/"
        onClick={guardLink}
        sx={{
          px: 2.5,
          py: 1.75,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          fontSize: 12,
          color: "text.secondary",
          textDecoration: "none",
          "&:hover": { color: "primary.main" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 14 }} />
        デモ画面一覧へ戻る
      </Box>

      <AccountMenu />
    </>
  );

  return (
    <ScopedCssBaseline
      sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "background.default" }}
    >
      <Drawer
        variant={narrow ? "temporary" : "permanent"}
        open={narrow ? navOpen : true}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: narrow ? 0 : NAV_WIDTH,
          flexShrink: 0,
          ...PRINT_HIDDEN,
          "& .MuiDrawer-paper": {
            width: narrow ? 270 : NAV_WIDTH,
            maxWidth: "84vw",
            boxSizing: "border-box",
          },
        }}
      >
        {drawerBody}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Toolbar
          sx={{
            minHeight: 68,
            flex: "0 0 auto",
            gap: 1.5,
            px: { xs: 1.75, md: 3.5 },
            py: 1,
            flexWrap: "wrap",
            rowGap: 1,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            ...PRINT_HIDDEN,
          }}
        >
          {narrow && (
            <IconButton onClick={() => setNavOpen(true)} aria-label="メニューを開く">
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: { xs: 1, md: 1.75 } }}>
            <RoleSwitch />
            {role === "prime" && <OverlapBell />}
            <HeaderDatePager />
          </Box>
        </Toolbar>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 1.75, md: "24px 28px" } }}>
          <Card>
            <CardContent sx={{ p: { xs: "16px 14px", md: "22px 24px" } }}>
              <Outlet />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}

export default function WorkAdjustLayout() {
  return (
    <WaSettingsProvider>
      <WorkAdjustLayoutInner />
    </WaSettingsProvider>
  );
}
