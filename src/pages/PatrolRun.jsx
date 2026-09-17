import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  ScopedCssBaseline,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { usePatrol } from "../components/patrol/PatrolContext.jsx";
import { PATROL_PHOTO_MAX, PATROL_PROJECT, fmtDate } from "../patrolData.js";

const DRAFT_KEY = "patrol-run-draft";

// 見出しの帯
function Band({ children }) {
  return (
    <Typography
      sx={{
        fontSize: 12.5,
        fontWeight: 700,
        textAlign: "center",
        bgcolor: "#f7f8fb",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        py: 0.75,
        mt: 3,
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

// 自動で入る項目（実施会社・一次会社・実施者）の表示行
function ReadOnlyRow({ label, value }) {
  return (
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1.25 }}>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}

/**
 * 巡回実施入力（QR読み取り後の画面・サイドバー無し）。
 * 確認項目と回答の選択肢は、設定画面（項目編集・回答編集）のマスタから組み立てる。
 * 登録すると確認ダイアログを挟み、登録後は巡回記録の一覧へ移動する。
 *
 * QRの種別で入力のされ方が変わる。
 *  - login（ログイン必須）… 一次会社はログインユーザーの所属会社を初期表示（編集可）、実施者は自動表示
 *  - guest（ログイン不要）… ユーザーを特定できないため、一次会社・実施者とも空欄で手入力する
 */
export default function PatrolRun() {
  const navigate = useNavigate();
  const { kind } = useParams();
  const guest = kind === "guest";
  const { currentUser, patrolItems, answerOptions, answerSettings, addRecord, setListSearch } = usePatrol();
  const today = new Date().toISOString().slice(0, 10);

  const [accompany, setAccompany] = useState("");
  // 実施会社は実施ユーザーの登録会社名（本番は users.company_name）。
  // ログイン不要で入った場合はユーザーを特定できないため手入力させる。
  const [guestHostCompany, setGuestHostCompany] = useState("");
  const hostCompany = guest ? guestHostCompany : currentUser.company;
  // 一次会社は入力欄。ログイン時は所属会社を初期値に入れたうえで、変更もできるようにする。
  const [primaryCompany, setPrimaryCompany] = useState(guest ? "" : currentUser.company);
  // 実施者はログイン不要のときだけ手入力する
  const [guestName, setGuestName] = useState("");
  const [photos, setPhotos] = useState([]);
  // 確認項目の回答。{ [itemId]: { answer, extra } }
  const [answers, setAnswers] = useState({});
  const [hearing, setHearing] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [last, setLast] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  const inspector = guest ? guestName : currentUser.name;
  const optionOf = (label) => answerOptions.find((o) => o.label === label);
  const setAnswer = (id, v) => setAnswers((a) => ({ ...a, [id]: { ...a[id], ...v } }));

  function addPhotos(files) {
    const room = PATROL_PHOTO_MAX - photos.length;
    const picked = [...files].slice(0, room).map((f) => ({
      id: `ph${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
      src: URL.createObjectURL(f),
      caption: "",
    }));
    if (picked.length) setPhotos((p) => [...p, ...picked]);
  }

  // 登録前のチェック。未回答・必須の追加入力・ヒアリング所見の必須設定を見る。
  function validate() {
    if (guest && !guestHostCompany.trim()) return "実施会社を入力してください。";
    if (!primaryCompany.trim()) return "一次会社を入力してください。";
    if (guest && !guestName.trim()) return "実施者を入力してください。";
    for (const it of patrolItems) {
      const a = answers[it.id];
      if (!a?.answer) return `「${it.text}」に回答してください。`;
      const opt = optionOf(a.answer);
      if (opt?.extra && opt.required && !a.extra?.trim()) {
        return `「${it.text}」の「${a.answer}」の追加入力は必須です。`;
      }
    }
    // ヒアリング・所見の必須／任意は回答編集で設定する
    if (answerSettings.hearingRequired && !hearing.trim()) return "ヒアリング・所見を入力してください。";
    return "";
  }

  function openConfirm() {
    const e = validate();
    setError(e);
    if (!e) setConfirmOpen(true);
  }

  function submit() {
    addRecord({
      plannedDate: "",
      date: today,
      nextDate: last ? "" : nextDate,
      company: hostCompany,
      primaryCompany: primaryCompany.trim(),
      inspector: inspector.trim(),
      accompany,
      hearing,
      confirmedDate: "",
      confirmedBy: "",
      siteComment: "",
      items: patrolItems.map((it, i) => ({
        no: i + 1,
        text: it.text,
        rating: answers[it.id]?.answer || "",
        comment: answers[it.id]?.extra || "",
        fix: "",
      })),
      photos: photos.map((p) => ({ id: p.id, src: p.src, caption: p.caption, fixSrc: "", fixComment: "" })),
      notes: [],
    });
    setConfirmOpen(false);
    // 登録した記録が見えるよう、一覧の巡回月を実施日の月に合わせてから移動する
    setListSearch((v) => ({ ...v, month: today.slice(0, 7) }));
    navigate("/patrol/records");
  }

  function saveDraft() {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        accompany, photos, answers, hearing, nextDate, last, primaryCompany, guestName, guestHostCompany,
      })
    );
    setToast("一時保存しました。");
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return setToast("一時保存された内容はありません。");
    const d = JSON.parse(raw);
    setAccompany(d.accompany || "");
    setPrimaryCompany(d.primaryCompany ?? (guest ? "" : currentUser.company));
    setGuestHostCompany(d.guestHostCompany || "");
    setGuestName(d.guestName || "");
    setPhotos(d.photos || []);
    setAnswers(d.answers || {});
    setHearing(d.hearing || "");
    setNextDate(d.nextDate || "");
    setLast(!!d.last);
    return setToast("一時保存した内容を読み込みました。");
  }

  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 860, mx: "auto", p: { xs: 2, sm: "24px 24px 48px" } }}>
        <Button size="small" component={Link} to="/no-account/owner-patrol" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
          戻る
        </Button>

        <Typography component="h1" align="center" sx={{ fontSize: 20, fontWeight: 700 }}>
          {PATROL_PROJECT}
        </Typography>
        <Typography align="center" color="text.secondary" sx={{ fontSize: 13, mt: 0.5, mb: 2 }}>
          実施日：{fmtDate(today)}
        </Typography>

        <Alert severity="info" sx={{ fontSize: 12.5, py: 0.25, mb: 2 }}>
          画面一番下の［一時保存］ボタンより入力内容を保存できます。
        </Alert>

        {guest ? (
          <Box sx={{ py: 1.25 }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75 }}>
              実施会社
            </Typography>
            <TextField fullWidth value={guestHostCompany} onChange={(e) => setGuestHostCompany(e.target.value)} />
          </Box>
        ) : (
          <ReadOnlyRow label="実施会社" value={hostCompany} />
        )}
        {/* 一次会社は入力欄。ログイン時は実施ユーザーの所属会社を初期値に入れ、必要なら変更できる。 */}
        <Box sx={{ py: 1.25 }}>
          <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75 }}>
            一次会社
          </Typography>
          <TextField fullWidth value={primaryCompany} onChange={(e) => setPrimaryCompany(e.target.value)} />
        </Box>
        {guest ? (
          // ログイン不要のQRから入った場合はユーザーを特定できないため実施者も手入力させる
          <Box sx={{ py: 1.25 }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75 }}>
              実施者
            </Typography>
            <TextField fullWidth value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </Box>
        ) : (
          <ReadOnlyRow label="実施者" value={inspector} />
        )}

        <Box sx={{ py: 1.25 }}>
          <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75 }}>
            同行会社・名前（任意）
          </Typography>
          <TextField fullWidth value={accompany} onChange={(e) => setAccompany(e.target.value)} />
        </Box>

        <Band>写真</Band>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PhotoCameraOutlinedIcon />}
            onClick={() => fileRef.current?.click()}
            disabled={photos.length >= PATROL_PHOTO_MAX}
          >
            写真を追加
          </Button>
          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            {photos.length} / {PATROL_PHOTO_MAX} 枚
          </Typography>
          <Box
            component="input"
            type="file"
            accept="image/*"
            multiple
            ref={fileRef}
            onChange={(e) => {
              addPhotos(e.target.files || []);
              e.target.value = "";
            }}
            sx={{ display: "none" }}
          />
        </Box>
        {photos.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 1.5 }}>
            {photos.map((p) => (
              <Box key={p.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                <Box
                  component="img"
                  src={p.src}
                  alt=""
                  sx={{ width: 96, height: 96, objectFit: "cover", border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
                />
                <TextField
                  fullWidth
                  placeholder="写真のコメントを入力"
                  value={p.caption}
                  onChange={(e) =>
                    setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))
                  }
                />
                <IconButton size="small" onClick={() => setPhotos((list) => list.filter((x) => x.id !== p.id))} aria-label="写真を削除">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Band>確認項目</Band>
        {patrolItems.map((it, i) => {
          const a = answers[it.id] || {};
          const opt = optionOf(a.answer);
          return (
            <Box key={it.id} sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1.5 }}>
              <Typography sx={{ fontSize: 13.5, mb: 0.5 }}>
                {i + 1}. {it.text}
              </Typography>
              <RadioGroup
                row
                value={a.answer || ""}
                onChange={(e) => setAnswer(it.id, { answer: e.target.value })}
                sx={{ gap: 1 }}
              >
                {answerOptions.map((o) => (
                  <FormControlLabel
                    key={o.id}
                    value={o.label}
                    control={<Radio size="small" />}
                    label={o.label}
                    slotProps={{ typography: { sx: { fontSize: 13 } } }}
                  />
                ))}
              </RadioGroup>
              {/* 追加入力は回答の選択肢ごとの設定に従う（回答編集で設定） */}
              {opt?.extra && (
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  placeholder={`「${a.answer}」の追加入力${opt.required ? "（必須）" : ""}`}
                  value={a.extra || ""}
                  onChange={(e) => setAnswer(it.id, { extra: e.target.value })}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          );
        })}

        <Band>ヒアリング・所見{answerSettings.hearingRequired && "（必須）"}</Band>
        <TextField
          fullWidth
          multiline
          minRows={4}
          placeholder={answerSettings.hearingRequired ? "コメント（必須）" : "コメント"}
          value={hearing}
          onChange={(e) => setHearing(e.target.value)}
        />

        <Band>次回巡回予定</Band>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <TextField
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            disabled={last}
            sx={{ width: 200 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={last}
                onChange={(e) => {
                  setLast(e.target.checked);
                  if (e.target.checked) setNextDate("");
                }}
              />
            }
            label="今回で最後"
            slotProps={{ typography: { sx: { fontSize: 13 } } }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, fontSize: 12.5 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mt: 4 }}>
          <Button variant="outlined" onClick={saveDraft}>
            一時保存
          </Button>
          <Button variant="outlined" onClick={loadDraft}>
            読込
          </Button>
          <Button variant="contained" onClick={openConfirm}>
            登録
          </Button>
        </Box>
      </Box>

      {/* 登録前の確認ダイアログ */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 17, fontWeight: 700 }}>巡回記録登録の確認</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: 13, mb: 2 }}>入力内容で巡回記録を登録しますか？</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>入力内容確認</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 0.75, fontSize: 12.5 }}>
            {[
              ["実施会社", hostCompany],
              ["一次会社", primaryCompany],
              ["実施者", inspector],
              ["同行会社・名前", accompany || "なし"],
              ["ヒアリング・所見", hearing || "なし"],
              ["次回巡回予定", last ? "今回で最後" : nextDate || "なし"],
            ].map(([k, v]) => (
              <Box key={k} sx={{ display: "contents" }}>
                <Box sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{k}:</Box>
                <Box sx={{ overflowWrap: "anywhere" }}>{v}</Box>
              </Box>
            ))}
          </Box>

          <Typography color="primary" sx={{ fontSize: 13, fontWeight: 700, mt: 2, mb: 0.5 }}>
            確認項目 ({patrolItems.length}件)
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: 12.5 }}>
            {patrolItems.map((it) => {
              const a = answers[it.id] || {};
              return (
                <Box component="li" key={it.id} sx={{ mb: 0.5 }}>
                  {it.text} — {a.answer}
                  {a.extra && (
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                      コメント: {a.extra}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {photos.length > 0 && (
            <>
              <Typography color="primary" sx={{ fontSize: 13, fontWeight: 700, mt: 2, mb: 0.5 }}>
                写真 ({photos.length}件)
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {photos.map((p) => (
                  <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      component="img"
                      src={p.src}
                      alt=""
                      sx={{ width: 84, height: 84, objectFit: "cover", border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                    />
                    <Typography sx={{ fontSize: 12.5 }}>{p.caption || "（コメントなし）"}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={submit}>
            登録
          </Button>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </ScopedCssBaseline>
  );
}
