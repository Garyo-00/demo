import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ScopedCssBaseline,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { WORKPLAN_MENU, MY_PENDING_APPROVALS, todayStr } from "../data.js";

const WIDTH = 248;

// メニュー名の頭に付く小さな点。アクティブのときだけ濃くする。
function NavDot({ active }) {
  return (
    <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "currentColor", opacity: active ? 1 : 0.4 }} />
    </ListItemIcon>
  );
}

// メニュー名 → 画面タイトル
function pageTitle(pathname) {
  if (pathname === "/workplan" || pathname === "/workplan/") return "ダッシュボード";
  if (pathname.startsWith("/workplan/approval")) return "承認・申請";
  if (pathname.startsWith("/workplan/settings/floor-plan")) return "作業平面図登録";
  if (pathname.startsWith("/workplan/settings/approval-flow")) return "承認フロー設定";
  if (pathname.startsWith("/workplan/settings")) return "設定";
  if (pathname.startsWith("/workplan/placeholder/")) {
    return decodeURIComponent(pathname.split("/workplan/placeholder/")[1] || "");
  }
  return "作業計画書";
}

export default function WorkPlanLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  // 768px 以下はサイドメニューをドロワー（一時表示）に切り替える
  const mobile = useMediaQuery("(max-width:768px)");

  // 現在アクティブなメニュー判定
  let active = "ダッシュボード";
  if (location.pathname.startsWith("/workplan/approval")) active = "承認・申請";
  else if (location.pathname.startsWith("/workplan/settings")) active = "設定";
  else if (location.pathname.startsWith("/workplan/placeholder/")) {
    active = decodeURIComponent(location.pathname.split("/workplan/placeholder/")[1] || "");
  }

  const [navOpen, setNavOpen] = useState(false);

  function selectMenu(m) {
    setNavOpen(false);
    if (m === "ダッシュボード") navigate("/workplan");
    else if (m === "承認・申請") navigate("/workplan/approval");
    else if (m === "設定") navigate("/workplan/settings");
    else navigate("/workplan/placeholder/" + encodeURIComponent(m));
  }

  return (
    <ScopedCssBaseline
      sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "background.default" }}
    >
      <Drawer
        variant={mobile ? "temporary" : "permanent"}
        open={mobile ? navOpen : true}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: mobile ? "auto" : WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: WIDTH, boxSizing: "border-box" },
        }}
      >
        <Box
          component={Link}
          to="/workplan"
          onClick={() => setNavOpen(false)}
          sx={{ p: "20px 18px 14px", textDecoration: "none", color: "text.primary" }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>作業計画書システム</Typography>
          <Typography variant="caption" color="text.secondary">
            新産業の森作業所
          </Typography>
        </Box>

        <List sx={{ p: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {WORKPLAN_MENU.map((m) => (
            <ListItemButton
              key={m}
              selected={active === m}
              onClick={() => selectMenu(m)}
              sx={{
                borderRadius: 2,
                mb: 0.25,
                minHeight: 38,
                px: 1.5,
                color: "text.secondary",
                "&.Mui-selected": {
                  bgcolor: "primary.light",
                  color: "primary.main",
                  "&:hover": { bgcolor: "primary.light" },
                },
              }}
            >
              <NavDot active={active === m} />
              <ListItemText
                primary={m}
                slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: active === m ? 600 : 500 } } }}
              />
              {m === "承認・申請" && MY_PENDING_APPROVALS > 0 && (
                <Chip size="small" color="warning" label={MY_PENDING_APPROVALS} sx={{ height: 18, fontSize: 11 }} />
              )}
            </ListItemButton>
          ))}
        </List>

        <Divider />
        <Box
          component={Link}
          to="/"
          onClick={() => setNavOpen(false)}
          sx={{
            p: "14px 20px",
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
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Toolbar
          sx={{
            gap: 1.5,
            px: { xs: 1.75, md: 3.5 },
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {mobile && (
            <IconButton onClick={() => setNavOpen(true)} aria-label="メニューを開く" edge="start">
              <MenuIcon />
            </IconButton>
          )}
          <Typography component="h1" noWrap sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 700, mr: "auto" }}>
            {pageTitle(location.pathname)}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {todayStr()} 時点
          </Typography>
        </Toolbar>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: "16px 14px", md: "24px 28px" } }}>
          <Outlet />
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}
