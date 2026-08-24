import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ScopedCssBaseline,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { WpnProvider, useWpn } from "./wpn/WpnContext.jsx";
import { WPN_PROJECT } from "../workPlanNeoData.js";

const WIDTH = 232;
const MINI = 64;

// サイドメニュー。QRコード画面の中身（発行できる種類）は設定のON/OFFで変わる。
const NAV = [
  { key: "plans", label: "作業計画書一覧", to: "/workplan-neo/plans", Icon: DescriptionOutlinedIcon },
  { key: "templates", label: "作業計画書テンプレート設定", to: "/workplan-neo/templates", Icon: TableChartOutlinedIcon },
  { key: "floor-plan", label: "作業配置図設定", to: "/workplan-neo/floor-plan", Icon: MapOutlinedIcon },
  { key: "approval-flow", label: "承認フロー設定", to: "/workplan-neo/approval-flow", Icon: AccountTreeOutlinedIcon },
  { key: "settings", label: "設定", to: "/workplan-neo/settings", Icon: SettingsOutlinedIcon },
  { key: "qr", label: "QRコード", to: "/workplan-neo/qr", Icon: QrCode2OutlinedIcon },
  { key: "manual", label: "マニュアル", to: "/workplan-neo/manual", Icon: MenuBookOutlinedIcon },
];

function RoleSwitch() {
  const { role, setRole } = useWpn();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={role}
      onChange={(_, v) => v && setRole(v)}
      aria-label="閲覧ロール切替"
      sx={{
        ml: "auto",
        "& .MuiToggleButton-root": {
          border: 0,
          px: 1.5,
          py: 0.4,
          fontSize: 11.5,
          borderRadius: 999,
          color: "text.secondary",
        },
        "& .MuiToggleButton-root.Mui-selected": {
          color: "#fff",
          bgcolor: "primary.main",
          "&:hover": { bgcolor: "primary.dark" },
        },
        bgcolor: "#f7f8fb",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 999,
        p: "2px",
      }}
    >
      <ToggleButton value="prime">元請</ToggleButton>
      <ToggleButton value="foreman">職長</ToggleButton>
    </ToggleButtonGroup>
  );
}

function WorkPlanNeoLayoutInner() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role } = useWpn();
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? MINI : WIDTH;

  // 設定系メニューは元請（ゼネコン）のみ。職長には一覧とマニュアルのみ見せる。
  const FOREMAN_MENU = ["plans", "manual"];
  const navItems = NAV.filter((n) => role === "prime" || FOREMAN_MENU.includes(n.key));

  return (
    <ScopedCssBaseline sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "background.default" }}>
      <Drawer
        variant="permanent"
        sx={{
          width,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: "width .18s ease",
          },
        }}
      >
        <Toolbar sx={{ minHeight: 56, gap: 1.25, px: 1.75 }}>
          <Box
            component={Link}
            to="/workplan-neo"
            title="作業計画書NEO"
            sx={{
              width: 34,
              height: 34,
              flex: "none",
              borderRadius: 2,
              bgcolor: "#1f2437",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Arch
          </Box>
          {!collapsed && (
            <>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
                作業計画書
              </Typography>
              <IconButton size="small" sx={{ ml: "auto" }} onClick={() => setCollapsed(true)} aria-label="メニューを折りたたむ">
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Toolbar>
        <Divider />

        <List sx={{ p: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {navItems.map(({ key, label, to, Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Tooltip key={key} title={collapsed ? label : ""} placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => navigate(to)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.25,
                    minHeight: 40,
                    px: 1.25,
                    "&.Mui-selected": {
                      bgcolor: "primary.light",
                      color: "primary.main",
                      "&:hover": { bgcolor: "primary.light" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.25, color: "inherit" }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={label}
                      slotProps={{
                        primary: {
                          sx: { fontSize: 12.5, fontWeight: active ? 600 : 500, lineHeight: 1.35 },
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
          {collapsed && (
            <ListItemButton sx={{ borderRadius: 2, minHeight: 40, px: 1.25 }} onClick={() => setCollapsed(false)}>
              <ListItemIcon sx={{ minWidth: 0 }}>
                <ChevronRightIcon fontSize="small" />
              </ListItemIcon>
            </ListItemButton>
          )}
        </List>

        <Divider />
        <Box
          component={Link}
          to="/"
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            fontSize: 11.5,
            color: "text.secondary",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 14 }} />
          {!collapsed && "デモ画面一覧へ戻る"}
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Toolbar
          sx={{
            minHeight: 56,
            flex: "0 0 56px",
            gap: 1.5,
            px: 2.5,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
            {WPN_PROJECT}
          </Typography>
          <RoleSwitch />
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light", color: "primary.main", fontSize: 13, fontWeight: 700 }}>
            A
          </Avatar>
        </Toolbar>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, md: "24px 32px 40px" } }}>
          <Box sx={{ maxWidth: 1120, mx: "auto" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}

export default function WorkPlanNeoLayout() {
  return (
    <WpnProvider>
      <WorkPlanNeoLayoutInner />
    </WpnProvider>
  );
}
