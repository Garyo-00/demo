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
  useMediaQuery,
} from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import { PatrolProvider, usePatrol } from "./patrol/PatrolContext.jsx";
import { PATROL_PROJECT } from "../patrolData.js";

const WIDTH = 232;
const MINI = 64;

const NAV = [{ key: "records", label: "巡回パトロール一覧", to: "/patrol/records", Icon: FactCheckOutlinedIcon }];

function RoleSwitch() {
  const { role, setRole } = usePatrol();
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
      <ToggleButton value="partner">協力会社</ToggleButton>
    </ToggleButtonGroup>
  );
}

function PatrolLayoutInner() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // 768px 以下はサイドメニューをドロワー（一時表示）に切り替える
  const mobile = useMediaQuery("(max-width:768px)");
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const width = mobile ? WIDTH : collapsed ? MINI : WIDTH;
  const mini = collapsed && !mobile;

  return (
    <ScopedCssBaseline sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "background.default" }}>
      <Drawer
        variant={mobile ? "temporary" : "permanent"}
        open={mobile ? navOpen : true}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: mobile ? 0 : width,
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
            to="/patrol"
            title="巡回/パトロール"
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
          {!mini && (
            <>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
                巡回/パトロール
              </Typography>
              {!mobile && (
                <IconButton size="small" sx={{ ml: "auto" }} onClick={() => setCollapsed(true)} aria-label="メニューを折りたたむ">
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Toolbar>
        <Divider />

        <List sx={{ p: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {NAV.map(({ key, label, to, Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Tooltip key={key} title={mini ? label : ""} placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => {
                    setNavOpen(false);
                    navigate(to);
                  }}
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
                  <ListItemIcon sx={{ minWidth: 0, mr: mini ? 0 : 1.25, color: "inherit" }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  {!mini && (
                    <ListItemText
                      primary={label}
                      slotProps={{ primary: { sx: { fontSize: 12.5, fontWeight: active ? 600 : 500, lineHeight: 1.35 } } }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
          {mini && (
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
          {!mini && "デモ画面一覧へ戻る"}
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Toolbar
          sx={{
            minHeight: 56,
            flex: "0 0 56px",
            gap: 1.5,
            px: { xs: 1.5, md: 2.5 },
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {mobile && (
            <IconButton size="small" edge="start" onClick={() => setNavOpen(true)} aria-label="メニューを開く">
              <MenuIcon />
            </IconButton>
          )}
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, minWidth: 0 }}>
            {PATROL_PROJECT}
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

export default function PatrolLayout() {
  return (
    <PatrolProvider>
      <PatrolLayoutInner />
    </PatrolProvider>
  );
}
