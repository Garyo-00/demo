import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemText as MuiListItemText,
  Menu,
  MenuItem,
  Popover,
  ScopedCssBaseline,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ListOutlinedIcon from "@mui/icons-material/ListOutlined";
import ChecklistIcon from "@mui/icons-material/Checklist";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SpeakerNotesIcon from "@mui/icons-material/SpeakerNotes";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LaunchIcon from "@mui/icons-material/Launch";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccountBoxTwoToneIcon from "@mui/icons-material/AccountBoxTwoTone";
import AccountCircleTwoToneIcon from "@mui/icons-material/AccountCircleTwoTone";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import GradingIcon from "@mui/icons-material/Grading";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import GavelIcon from "@mui/icons-material/Gavel";
import PolicyIcon from "@mui/icons-material/Policy";
import LogoutIcon from "@mui/icons-material/Logout";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { useKynext } from "./kynext/KynextContext.jsx";
import { KynextToasts } from "./kynext/KynextCommon.jsx";

const WIDTH = 240;
const MINI = 56;

// サイドメニュー（本番 router.tsx の Resources + Sider.tsx の出し分け）
// integratable … ダイレクト連携は現場設定で連携ON かつ ロールに連携権限があるときのみ
// templateEditable … 設定はテンプレート編集権限があるときのみ
const NAV = [
  { key: "list", label: "KYシート一覧", to: "/kynext", Icon: ListOutlinedIcon, exact: true },
  { key: "export", label: "KY出力", to: "/kynext/export", Icon: ChecklistIcon },
  { key: "qr", label: "QRコード発行", to: "/kynext/ky-sheets/qr-codes", Icon: QrCode2Icon },
  { key: "direct", label: "ダイレクト連携", to: "/kynext/integration/direct", Icon: SpeakerNotesIcon, needs: "integratable" },
  { key: "settings", label: "設定", to: "/kynext/templates", Icon: SettingsIcon, needs: "templateEditable" },
];

// サイダー下部「サービス」セクションの外部リンク（本番 ServiceLinks）
const SERVICE_LINKS = [
  { label: "出面・日報管理", url: "https://dnn.arch-dx.com", mark: "日報" },
  { label: "作業間調整pro", url: "https://workadjust.arch-dx.com", mark: "調整" },
];

// KY-NEXT のロゴ（本番 Title + Logo。画像の代わりに文字で表現）
function KyLogo({ collapsed }) {
  return (
    <Box component={Link} to="/kynext" sx={{ display: "flex", alignItems: "center", gap: 2, textDecoration: "none", color: "text.primary" }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          bgcolor: "#1f2437",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: ".02em",
          flex: "none",
        }}
      >
        KY
      </Box>
      {!collapsed && (
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
          KY-NEXT
        </Typography>
      )}
    </Box>
  );
}

// ロール切替（デモ用。本番にはない）。元請／協力会社でメニューと権限が変わる。
function RoleSwitch() {
  const { role, setRole } = useKynext();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={role}
      onChange={(_, v) => v && setRole(v)}
      aria-label="閲覧ロール切替"
      sx={{
        "& .MuiToggleButton-root": { border: 0, px: 1.5, py: 0.4, fontSize: 11.5, borderRadius: 999, color: "text.secondary", whiteSpace: "nowrap" },
        flexShrink: 0,
        "& .MuiToggleButton-root.Mui-selected": { color: "#fff", bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } },
        bgcolor: "#f7f8fb",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 999,
        p: "2px",
      }}
    >
      <ToggleButton value="general">元請</ToggleButton>
      <ToggleButton value="partner">協力会社</ToggleButton>
    </ToggleButtonGroup>
  );
}

// アカウントメニュー（本番 UserPopover + PopoverMenu）
function UserInfo({ collapsed, onNavigate }) {
  const { me, project } = useKynext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const close = () => setAnchorEl(null);
  const go = (to) => {
    close();
    onNavigate?.();
    navigate(to);
  };
  const external = (label, Icon) => (
    <MenuItem key={label} onClick={close} sx={{ fontSize: 13.5 }}>
      <Icon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
      <ListItemText primary={label} />
      <LaunchIcon sx={{ fontSize: 14, ml: 2, color: "text.secondary" }} />
    </MenuItem>
  );

  return (
    <>
      <Tooltip title={me.name} placement="right" disableHoverListener={!collapsed} arrow>
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: collapsed ? 1 : 2,
            py: 1.5,
            cursor: "pointer",
            borderTop: "1px solid",
            borderColor: "divider",
            justifyContent: collapsed ? "center" : "flex-start",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem", bgcolor: "primary.light", color: "primary.main", fontWeight: 700 }}>{me.name.slice(0, 1)}</Avatar>
          {!collapsed && (
            <>
              <Box sx={{ minWidth: 0, overflow: "hidden", flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", lineHeight: 1.3, wordBreak: "break-word" }}>
                  {me.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", wordBreak: "break-word" }}>
                  {project.name}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
            </>
          )}
        </Box>
      </Tooltip>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 300 } } }}
      >
        <Box sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.light", color: "primary.main", fontWeight: 700 }}>{me.name.slice(0, 1)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{me.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {me.company} / {me.role}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {project.name}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List dense sx={{ p: 1 }}>
          {external("アカウント設定", AccountBoxTwoToneIcon)}
          {external("ユーザー一覧", AccountCircleTwoToneIcon)}
          <MenuItem onClick={() => go("/kynext/projects/detail")} sx={{ fontSize: 13.5 }}>
            <ContentPasteIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <ListItemText primary="現場情報" />
          </MenuItem>
          <MenuItem onClick={() => go("/kynext/projects/select")} sx={{ fontSize: 13.5 }}>
            <GradingIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <ListItemText primary="現場選択" />
          </MenuItem>
        </List>
        <Divider />
        <List dense sx={{ p: 1 }}>
          {external("見積依頼サービス", RequestQuoteIcon)}
          {external("発注サービス", ShoppingCartIcon)}
          {external("在庫管理サービス", InventoryIcon)}
          {external("利用規約", GavelIcon)}
          {external("プライバシーポリシー", PolicyIcon)}
        </List>
        <Divider />
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Button size="small" variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={() => go("/kynext/login")}>
            ログアウト
          </Button>
        </Box>
      </Popover>
    </>
  );
}

// マニュアルのダウンロード導線（本番 ManualMenuItem）。元請は元請用／職長・作業員用を選べる。
function ManualMenuItem({ collapsed, iconSx }) {
  const { me, notify } = useKynext();
  const [anchorEl, setAnchorEl] = useState(null);
  const download = (label) => {
    setAnchorEl(null);
    notify(`マニュアル（${label}）をダウンロードしました（デモ）`, "info");
  };
  return (
    <>
      <Tooltip title="マニュアル" placement="right" disableHoverListener={!collapsed} arrow>
        <ListItemButton
          onClick={(e) => (me.templateEditable ? setAnchorEl(e.currentTarget) : download("職長・作業員用"))}
          sx={{ pl: 2, py: 1, justifyContent: "center" }}
        >
          <ListItemIcon sx={iconSx}>
            <MenuBookIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="マニュアル" slotProps={{ primary: { noWrap: true, fontSize: "14px" } }} />}
        </ListItemButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => download("元請用")}>元請用</MenuItem>
        <MenuItem onClick={() => download("職長・作業員用")}>職長・作業員用</MenuItem>
      </Menu>
    </>
  );
}

function SiderContent({ collapsed, onNavigate }) {
  const { me } = useKynext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const iconSx = { justifyContent: "center", minWidth: "24px", marginRight: collapsed ? "0px" : "12px", color: "currentColor" };
  const items = NAV.filter((n) => !n.needs || me[n.needs]);

  return (
    <List disablePadding sx={{ flexGrow: 1, pt: 2 }}>
      {items.map(({ key, label, to, Icon, exact }) => {
        const selected = exact ? pathname === to || pathname === `${to}/` || pathname.startsWith("/kynext/ky-sheets/") && !pathname.startsWith("/kynext/ky-sheets/qr-codes") : pathname.startsWith(to);
        return (
          <Tooltip key={key} title={label} placement="right" disableHoverListener={!collapsed} arrow>
            <ListItemButton
              selected={selected}
              onClick={() => {
                onNavigate?.();
                navigate(to);
              }}
              sx={{ pl: 2, py: 1, justifyContent: "center", color: selected ? "primary.main" : "text.primary", "&.Mui-selected": { bgcolor: "primary.light" } }}
            >
              <ListItemIcon sx={iconSx}>
                <Icon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary={label} slotProps={{ primary: { noWrap: true, fontSize: "14px" } }} />}
            </ListItemButton>
          </Tooltip>
        );
      })}
      <ManualMenuItem collapsed={collapsed} iconSx={iconSx} />
      {!collapsed && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", pl: 2, pt: 2, pb: 0.5 }}>
            サービス
          </Typography>
          {SERVICE_LINKS.map((s) => (
            <ListItemButton key={s.label} component="a" href={s.url} target="_blank" rel="noopener" sx={{ pl: 2, py: 1, color: "text.primary" }}>
              <ListItemIcon sx={iconSx}>
                <Box sx={{ width: 22, height: 22, borderRadius: 0.75, bgcolor: "#e8ebf5", color: "#4f5bd5", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.mark}
                </Box>
              </ListItemIcon>
              <ListItemText primary={s.label} slotProps={{ primary: { noWrap: true, fontSize: "14px" } }} />
              <LaunchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </ListItemButton>
          ))}
        </>
      )}
    </List>
  );
}

/**
 * KY-NEXT のレイアウト（本番 ThemedLayout + Header + Sider）。
 * 左：サイドメニュー（折りたたみ可・スマホはドロワー）、上：ヘッダ（ハンバーガー・天気・ロール切替）。
 */
export default function KynextLayout() {
  const { project } = useKynext();
  const mobile = useMediaQuery("(max-width:900px)");
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const width = mobile ? WIDTH : collapsed ? MINI : WIDTH;
  const mini = collapsed && !mobile;

  const footer = (
    <>
      <UserInfo collapsed={mini} onNavigate={() => setNavOpen(false)} />
      <ListItem alignItems="center" sx={{ py: 0.5 }}>
        <MuiListItemText primary={mini ? "" : "©︎ Arch, Inc. (ver. demo)"} slotProps={{ primary: { noWrap: true, sx: { textAlign: "center", fontSize: 12, color: "text.secondary" } } }} />
      </ListItem>
      <Divider />
      <Box
        component={Link}
        to="/"
        sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: mini ? "center" : "flex-start", gap: 0.75, fontSize: 11.5, color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}
      >
        <ArrowBackIcon sx={{ fontSize: 14 }} />
        {!mini && "デモ画面一覧へ戻る"}
      </Box>
    </>
  );

  return (
    <ScopedCssBaseline sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "#f5f6fa" }}>
      <Drawer
        variant={mobile ? "temporary" : "permanent"}
        open={mobile ? navOpen : true}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: mobile ? 0 : width,
          flexShrink: 0,
          "@media print": { display: "none" },
          "& .MuiDrawer-paper": { width, boxSizing: "border-box", overflowX: "hidden", transition: "width 200ms cubic-bezier(0.4, 0, 0.6, 1) 0ms", borderRight: "1px solid", borderColor: "divider" },
        }}
      >
        <Box sx={{ height: 64, display: "flex", alignItems: "center", justifyContent: mini ? "center" : "space-between", pl: mini ? 0 : 2, pr: mini ? 0 : 1, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
          <KyLogo collapsed={mini} />
          {!mini && !mobile && (
            <IconButton size="small" onClick={() => setCollapsed(true)} aria-label="メニューを折りたたむ">
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
        <Box sx={{ flexGrow: 1, overflowX: "hidden", overflowY: "auto" }}>
          <SiderContent collapsed={mini} onNavigate={() => setNavOpen(false)} />
          {mini && (
            <ListItemButton sx={{ justifyContent: "center", py: 1 }} onClick={() => setCollapsed(false)} aria-label="メニューを開く">
              <ChevronRightIcon fontSize="small" />
            </ListItemButton>
          )}
        </Box>
        {footer}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AppBar
          color="default"
          position="static"
          elevation={0}
          sx={{ height: 64, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", "@media print": { display: "none" } }}
        >
          <Toolbar sx={{ minHeight: "64px !important", gap: 2, px: { xs: 1, sm: 2, md: 3 } }}>
            {mobile && (
              <IconButton edge="start" onClick={() => setNavOpen(true)} aria-label="メニューを開く">
                <MenuIcon />
              </IconButton>
            )}
            {/* 天気予報（本番 WeatherForecastView）。現場設定で天気ONのとき中央に出る */}
            <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
              <WbSunnyOutlinedIcon sx={{ fontSize: 20, color: "#f5a524" }} />
              <CloudOutlinedIcon sx={{ fontSize: 20 }} />
              <Typography variant="body2" noWrap sx={{ display: { xs: "none", sm: "block" } }}>
                晴のち曇 26℃ / 19℃ 降水 20%
              </Typography>
            </Stack>
            {!mobile && (
              <Typography variant="body2" noWrap sx={{ color: "text.secondary", maxWidth: 240 }}>
                {project.name}
              </Typography>
            )}
            <RoleSwitch />
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 2 } }}>
          <Outlet />
        </Box>
      </Box>
      <KynextToasts />
    </ScopedCssBaseline>
  );
}
