import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ReplayIcon from "@mui/icons-material/Replay";
import SyncIcon from "@mui/icons-material/Sync";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { DIRECT_NOTIFICATION_JA, DIRECT_STATUS_JA, DIRECT_TALK_ROOMS } from "../../kynextData.js";

// ===== ダイレクト連携（本番 pages/integration/direct → features/direct/DirectApplications） =====
// 連携アプリケーション（ダイレクトのアカウント接続）の一覧と、連携ごとの通知設定。
// 本番の DataGrid（操作列の … メニュー）は MUI Table ＋ Menu で組む。

const STATUS_COLOR = { Connected: "success", Disconnected: "default", Error: "error" };

// 接続状況チップ（本番 components/Chip/DirectConnectionStatus）
function DirectConnectionStatusChip({ status }) {
  return <Chip label={DIRECT_STATUS_JA[status] ?? status} color={STATUS_COLOR[status] ?? "default"} size="small" />;
}

// 本番 @repo/ui の SimpleDialog 相当
function SimpleDialog({ title, open, onClose, maxWidth = "sm", children }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

// 連携アプリケーションの登録（本番 RegisterDirectApplicationDialog + RegisterDirectApplicationForm）
function RegisterDirectApplicationDialog({ open, onClose }) {
  const { addDirectApplication, notify } = useKynext();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const nameError = touched && !name.trim() ? "連携用の名前を入力してください" : undefined;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!name.trim()) return;
    addDirectApplication({ name: name.trim(), note });
    // 本番はダイレクトの認証ページを別タブで開く
    notify("ダイレクトのページで認証を行ってください", "info");
    setName("");
    setNote("");
    setTouched(false);
    onClose();
  };

  return (
    <SimpleDialog title="連携アプリケーションの登録" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          事前に連携を行いたいダイレクトのアカウントでログインが必要です
        </Alert>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="subtitle1">連携名</Typography>
            <TextField fullWidth required size="small" placeholder="接続先を区別するための名前を入力してください" value={name} onChange={(e) => setName(e.target.value)} error={!!nameError} helperText={nameError} />
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle1">備考</Typography>
            <TextField fullWidth size="small" placeholder="備考" value={note} onChange={(e) => setNote(e.target.value)} />
          </Grid>
          <Grid size={12}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button type="button" variant="contained" color="inherit" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                追加
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </SimpleDialog>
  );
}

// 通知先の追加（本番 AddDirectNotificationDialog + AddDirectNotificationForm）。複数行をまとめて追加する。
const emptyNotification = () => ({ notificationType: "", talkRoom: "", note: "" });
function AddDirectNotificationDialog({ open, onClose, application }) {
  const { addDirectNotifications, notify } = useKynext();
  const [rows, setRows] = useState([emptyNotification()]);
  const [submitted, setSubmitted] = useState(false);
  const setRow = (i, patch) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const errorsOf = (r) => ({
    notificationType: submitted && !r.notificationType ? "通知を選択してください" : undefined,
    talkRoom: submitted && !r.talkRoom ? "通知先のトークルームを選択してください" : undefined,
  });
  const allRooms = DIRECT_TALK_ROOMS.flatMap((d) => d.talkRooms);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (rows.length === 0 || rows.some((r) => !r.notificationType || !r.talkRoom)) return;
    // 通知先はトークルーム名で保持する（一覧の「通知先(トークルーム)」に出す）
    addDirectNotifications(
      application.id,
      rows.map((r) => ({ notificationType: r.notificationType, talkRoom: allRooms.find((t) => t.id === r.talkRoom)?.name ?? r.talkRoom, note: r.note }))
    );
    notify("通知先の追加できました");
    setRows([emptyNotification()]);
    setSubmitted(false);
    onClose();
  };

  return (
    <SimpleDialog title="通知先の追加" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {rows.map((r, index) => {
          const errors = errorsOf(r);
          return (
            <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
              <Grid size={12}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                    通知先: {index + 1}
                  </Typography>
                  <IconButton aria-label="削除" color="error" onClick={() => setRows((x) => x.filter((_, j) => j !== index))}>
                    <HighlightOffIcon />
                  </IconButton>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle1">通知</Typography>
                <FormControl fullWidth size="small" error={!!errors.notificationType}>
                  <Select value={r.notificationType} displayEmpty onChange={(e) => setRow(index, { notificationType: e.target.value })}>
                    {Object.entries(DIRECT_NOTIFICATION_JA).map(([k, label]) => (
                      <MenuItem key={k} value={k}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.notificationType && <FormHelperText>{errors.notificationType}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle1">ダイレクトトークルーム</Typography>
                <FormControl fullWidth size="small" error={!!errors.talkRoom}>
                  <Select value={r.talkRoom} displayEmpty onChange={(e) => setRow(index, { talkRoom: e.target.value })}>
                    {DIRECT_TALK_ROOMS.flatMap(({ domainName, talkRooms }) => [
                      <ListSubheader key={domainName}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {domainName}
                        </Typography>
                      </ListSubheader>,
                      ...talkRooms.map(({ id, name }) => (
                        <MenuItem value={id} key={id}>
                          {name}
                        </MenuItem>
                      )),
                    ])}
                  </Select>
                  {errors.talkRoom && <FormHelperText>{errors.talkRoom}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle1">備考</Typography>
                <TextField fullWidth size="small" value={r.note} onChange={(e) => setRow(index, { note: e.target.value })} />
              </Grid>
            </Grid>
          );
        })}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <IconButton aria-label="追加" color="info" onClick={() => setRows((x) => [...x, emptyNotification()])}>
            <AddCircleOutlineIcon />
          </IconButton>
        </Box>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="contained" color="inherit" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={rows.length === 0}>
            追加
          </Button>
        </Stack>
      </form>
    </SimpleDialog>
  );
}

// 通知一覧ダイアログ（本番 DirectNotificationsDialog + DirectNotificationsDataGrid）
function DirectNotificationsDialog({ application, open, onClose }) {
  const { deleteDirectNotification, notify } = useKynext();
  const [addOpen, setAddOpen] = useState(false);
  const [menu, setMenu] = useState(null); // { el, notification }
  const canAdd = !!application?.scope?.fileWrite;

  return (
    <SimpleDialog title="通知一覧" open={open} onClose={onClose} maxWidth="md">
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {application?.name}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
          <Button variant="contained" startIcon={<AddIcon />} disabled={!canAdd} onClick={() => setAddOpen(true)}>
            通知追加
          </Button>
        </Stack>
        {!canAdd && (
          <Typography color="error" sx={{ textAlign: "right" }}>
            通知を追加するには再連携が必要です
          </Typography>
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>ID</TableCell>
                <TableCell>通知内容</TableCell>
                <TableCell>通知先(トークルーム)</TableCell>
                <TableCell>備考</TableCell>
                <TableCell align="center" sx={{ width: 56 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {(application?.notifications ?? []).map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{n.id}</TableCell>
                  <TableCell>{DIRECT_NOTIFICATION_JA[n.notificationType] ?? n.notificationType}</TableCell>
                  <TableCell>{n.talkRoom}</TableCell>
                  <TableCell>{n.note}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, notification: n })} aria-label="操作">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(application?.notifications ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: "text.secondary" }}>
                    通知がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onClose}>
            閉じる
          </Button>
        </Stack>
      </Stack>
      <Menu anchorEl={menu?.el ?? null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            setMenu(null);
            notify("トークルーム名の同期に成功しました");
          }}
        >
          <ListItemIcon>
            <SyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>トークルーム同期</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            deleteDirectNotification(application.id, menu.notification.id);
            setMenu(null);
            notify("ダイレクト通知設定の削除に成功しました");
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>
      {application && <AddDirectNotificationDialog open={addOpen} onClose={() => setAddOpen(false)} application={application} />}
    </SimpleDialog>
  );
}

export default function KynextDirect() {
  const { me, directApplications, reRegisterDirectApplication, deleteDirectApplication, notify } = useKynext();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [menu, setMenu] = useState(null); // { el, app }
  const [notificationsId, setNotificationsId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const notificationsApp = directApplications.find((a) => a.id === notificationsId) ?? null;

  // 協力会社ロールは連携権限が無い（本番は /404 へ）
  if (!me.integratable) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" action={<Button component={RouterLink} to="/kynext" color="inherit" size="small">一覧へ</Button>}>
          ダイレクト連携の権限がありません
        </Alert>
      </Container>
    );
  }

  const closeMenu = () => setMenu(null);

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Link component="button" onClick={() => notify("Direct連携マニュアルをダウンロードしました（デモ）", "info")}>
          Direct連携マニュアル
        </Link>
      </Box>
      <Card>
        <CardHeader
          action={
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Button variant="contained" color="success" onClick={() => setRegisterOpen(true)}>
                連携アプリケーション追加
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>ID</TableCell>
                  <TableCell>連携名</TableCell>
                  <TableCell>接続状況</TableCell>
                  <TableCell>備考</TableCell>
                  <TableCell align="center" sx={{ width: 56 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {directApplications.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>
                      <DirectConnectionStatusChip status={a.connectStatus} />
                    </TableCell>
                    <TableCell>{a.note}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, app: a })} aria-label="操作">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {directApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "text.secondary" }}>
                      連携アプリケーションがありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 操作メニュー（本番 GridActionsCellItem showInMenu） */}
      <Menu anchorEl={menu?.el ?? null} open={!!menu} onClose={closeMenu}>
        {menu?.app.connectStatus === "Connected" && (
          <MenuItem
            onClick={() => {
              setNotificationsId(menu.app.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <NotificationsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>通知設定</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            reRegisterDirectApplication(menu.app.id);
            closeMenu();
            notify("ダイレクトのページで認証を行ってください", "info");
          }}
        >
          <ListItemIcon>
            <ReplayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>再連携</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteTarget(menu.app);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>

      <RegisterDirectApplicationDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <DirectNotificationsDialog application={notificationsApp} open={!!notificationsApp} onClose={() => setNotificationsId(null)} />

      {/* 削除確認（本番 DeleteDirectApplicationGridActionsCellItem） */}
      <SimpleDialog title="連携アプリケーションの削除" open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <Typography variant="body1">本当に連携アプリケーションを削除しますか？</Typography>
        <Typography variant="body1">削除した場合、すべての通知も削除され元に戻すことはできません。</Typography>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 2 }}>
          <Button variant="contained" color="inherit" onClick={() => setDeleteTarget(null)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              deleteDirectApplication(deleteTarget.id);
              setDeleteTarget(null);
              notify("ダイレクトアプリケーションの削除に成功しました");
            }}
          >
            削除
          </Button>
        </Stack>
      </SimpleDialog>
    </Container>
  );
}
