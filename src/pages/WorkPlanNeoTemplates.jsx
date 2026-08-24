import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import { newId } from "../workPlanNeoData.js";

// 行ごとの操作メニュー（⋮）。マスタは編集・削除不可で、複製して自現場用に使う。
function RowMenu({ template, onEdit, onDuplicate, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const isMaster = template.kind === "master";
  const run = (fn) => () => {
    setAnchor(null);
    fn();
  };

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="操作メニュー">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem dense onClick={run(onEdit)}>{isMaster ? "内容を確認" : "編集"}</MenuItem>
        <MenuItem dense onClick={run(onDuplicate)}>複製</MenuItem>
        {!isMaster && (
          <MenuItem dense sx={{ color: "error.main" }} onClick={run(onDelete)}>
            削除
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default function WorkPlanNeoTemplates() {
  const navigate = useNavigate();
  const { templates, saveTemplate, removeTemplate } = useWpn();
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(0);

  const total = templates.length;
  const start = page * perPage;
  const rows = templates.slice(start, start + perPage);

  function duplicate(t) {
    saveTemplate({
      ...t,
      id: newId("tpl"),
      kind: "custom",
      name: `${t.name.replace(/^【テンプレート用】/, "")}（コピー）`,
      updatedBy: "元請 田中",
    });
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h1">作業計画書テンプレート設定一覧</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            sx={{ ml: "auto" }}
            onClick={() => navigate("/workplan-neo/templates/new")}
          >
            追加
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>テンプレート名</TableCell>
                <TableCell sx={{ width: 220 }}>種別</TableCell>
                <TableCell sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: "text.secondary", py: 4 }}>
                    テンプレートがありません。
                  </TableCell>
                </TableRow>
              )}
              {rows.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => navigate(`/workplan-neo/templates/${t.id}`)}
                      sx={{
                        fontSize: 12.5,
                        textAlign: "left",
                        // マスタは自現場で編集しないため、控えめな色にする
                        color: t.kind === "master" ? "text.secondary" : "primary.main",
                      }}
                    >
                      {t.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {t.kind === "master" && <Chip size="small" label="マスタ" variant="outlined" />}
                  </TableCell>
                  <TableCell align="center">
                    <RowMenu
                      template={t}
                      onEdit={() => navigate(`/workplan-neo/templates/${t.id}`)}
                      onDuplicate={() => duplicate(t)}
                      onDelete={() => {
                        if (confirm(`「${t.name}」を削除しますか？`)) removeTemplate(t.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          rowsPerPageOptions={[25, 50, 100]}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          labelRowsPerPage="ページあたりの行数:"
          labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count}`}
        />
      </CardContent>
    </Card>
  );
}
