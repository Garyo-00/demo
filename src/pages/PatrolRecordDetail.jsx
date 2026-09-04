import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { usePatrol } from "../components/patrol/PatrolContext.jsx";
import PatrolStatusChip from "../components/patrol/PatrolStatus.jsx";
import PatrolNotes from "../components/patrol/PatrolNotes.jsx";
import { RATING_COLOR, fmtDate, isConfirmed } from "../patrolData.js";

// ヘッダーの見出し付きセル
function Info({ label, value }) {
  return (
    <Box sx={{ display: "flex", minWidth: 0, gap: 1.25 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", width: 96, flex: "none" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12.5, minWidth: 0, overflowWrap: "anywhere" }}>{value || "－"}</Typography>
    </Box>
  );
}

// セクション見出し（帯）
function SectionTitle({ children }) {
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

export default function PatrolRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecord, role, saveFixes, confirmRecord } = usePatrol();
  const record = getRecord(id);

  const confirmed = record ? isConfirmed(record) : false;
  // 元請確認前は元請ユーザーの確認画面として編集可。確認後は「是正入力」を押した間だけ編集可。
  const [fixMode, setFixMode] = useState(false);
  const [draft, setDraft] = useState(() => (record ? { items: record.items, photos: record.photos } : null));
  const [siteComment, setSiteComment] = useState(record?.siteComment || "");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileRefs = useRef({});

  // 別レコードを開いたとき、および保存でレコードが更新されたときに下書きを取り直す
  useEffect(() => {
    if (!record) return;
    setDraft({ items: record.items, photos: record.photos });
    setSiteComment(record.siteComment || "");
  }, [record?.id, record?.items, record?.photos, record?.siteComment]);

  if (!record || !draft) {
    return (
      <Card>
        <CardContent>
          <Typography sx={{ fontSize: 13 }}>巡回記録が見つかりません。</Typography>
          <Button size="small" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate("/patrol/records")}>
            一覧へ戻る
          </Button>
        </CardContent>
      </Card>
    );
  }

  const primeConfirming = !confirmed && role === "prime";
  const editing = primeConfirming || fixMode;

  const setItemFix = (no, fix) =>
    setDraft((d) => ({ ...d, items: d.items.map((it) => (it.no === no ? { ...it, fix } : it)) }));
  const setPhoto = (pid, patch) =>
    setDraft((d) => ({ ...d, photos: d.photos.map((p) => (p.id === pid ? { ...p, ...patch } : p)) }));

  function pickPhoto(pid, file) {
    if (!file) return;
    setPhoto(pid, { fixSrc: URL.createObjectURL(file) });
  }

  function handleConfirm() {
    if (!siteComment.trim()) {
      setError("作業所コメントは必須です。入力してください。");
      return;
    }
    setError("");
    confirmRecord(record.id, { items: draft.items, photos: draft.photos, siteComment: siteComment.trim() });
    setToast("元請確認を登録しました。");
  }

  function handleSaveFixes() {
    saveFixes(record.id, { items: draft.items, photos: draft.photos });
    setFixMode(false);
    setToast("是正内容を保存しました。");
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate("/patrol/records")}>
          一覧へ戻る
        </Button>
        <PatrolStatusChip record={record} />
      </Box>

      <Card>
        <CardContent>
          {/* 基本情報 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 1.25,
              bgcolor: "#f7f8fb",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Info label="巡回記録No." value={record.no} />
            <Info label="実施日" value={fmtDate(record.date)} />
            <Info label="現場名" value="テストプロジェクト_星野" />
            <Info label="実施会社" value={record.company} />
            <Info label="一次会社" value={record.primaryCompany} />
            <Info label="実施者" value={record.inspector} />
            <Info label="同行会社・名前" value={record.accompany} />
            <Info label="元請確認日" value={fmtDate(record.confirmedDate)} />
            <Info label="元請確認者" value={record.confirmedBy} />
          </Box>

          {!confirmed && role === "partner" && (
            <Alert severity="info" sx={{ mt: 2, fontSize: 12.5, py: 0.5 }}>
              元請確認待ちです。元請ユーザーが元請確認を行うと、是正入力ができるようになります。
            </Alert>
          )}
          {confirmed && !fixMode && (
            <Alert severity="success" sx={{ mt: 2, fontSize: 12.5, py: 0.5 }}>
              元請確認済みです。作業所コメントは編集できません。是正内容は「是正入力」からいつでも何度でも更新できます。
            </Alert>
          )}

          {/* チェック項目 */}
          <SectionTitle>巡回項目</SectionTitle>
          <Typography color="text.secondary" sx={{ fontSize: 11.5, mb: 1 }}>
            「要改善」の項目に是正内容を入力できます（任意）。
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {draft.items.map((it) => (
              <Box
                key={it.no}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.25 }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", width: 24, flex: "none", textAlign: "right" }}>
                    {it.no}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                    {it.text}
                  </Typography>
                  <Chip size="small" label={it.rating} color={RATING_COLOR[it.rating] || "default"} variant="outlined" sx={{ flex: "none" }} />
                </Box>

                {it.comment && (
                  <Box sx={{ display: "flex", gap: 1.5, mt: 1, pl: { xs: 0, sm: 5 } }}>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", width: 56, flex: "none" }}>コメント</Typography>
                    <Typography sx={{ fontSize: 12.5, minWidth: 0, overflowWrap: "anywhere" }}>{it.comment}</Typography>
                  </Box>
                )}

                {/* 是正内容は「要改善」の項目にだけ出す。元請確認時は任意入力、確認後は「是正入力」中のみ編集できる。 */}
                {((editing && it.rating === "要改善") || it.fix) && (
                  <Box sx={{ display: "flex", gap: 1.5, mt: 1, pl: { xs: 0, sm: 5 }, alignItems: "flex-start" }}>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", width: 56, flex: "none", pt: 1 }}>是正内容</Typography>
                    {editing ? (
                      <TextField
                        multiline
                        minRows={2}
                        fullWidth
                        placeholder="是正内容を入力（任意）"
                        value={it.fix}
                        onChange={(e) => setItemFix(it.no, e.target.value)}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 12.5, pt: 1, minWidth: 0, overflowWrap: "anywhere" }}>{it.fix}</Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {/* ヒアリング・所見 */}
          <SectionTitle>ヒアリング・所見</SectionTitle>
          <Typography sx={{ fontSize: 12.5, px: 0.5, whiteSpace: "pre-wrap" }}>{record.hearing || "－"}</Typography>

          {/* 写真（左：巡回時の指摘写真／右：是正写真） */}
          {draft.photos.length > 0 && (
            <>
              <SectionTitle>写真</SectionTitle>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {draft.photos.map((p) => (
                  <Box
                    key={p.id}
                    sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}
                  >
                    <Box>
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1.5,
                          height: 220,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          bgcolor: "#fff",
                        }}
                      >
                        <Box component="img" src={p.src} alt="指摘写真" sx={{ maxHeight: "100%", maxWidth: "100%" }} />
                      </Box>
                      <Typography sx={{ fontSize: 12, mt: 0.75 }}>{p.caption}</Typography>
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1.5,
                          height: 220,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          bgcolor: "#fff",
                        }}
                      >
                        {p.fixSrc ? (
                          <Box component="img" src={p.fixSrc} alt="是正写真" sx={{ maxHeight: "100%", maxWidth: "100%" }} />
                        ) : editing ? (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PhotoCameraOutlinedIcon />}
                              onClick={() => fileRefs.current[p.id]?.click()}
                            >
                              写真を添付
                            </Button>
                            <Box
                              component="input"
                              type="file"
                              accept="image/*"
                              ref={(el) => (fileRefs.current[p.id] = el)}
                              onChange={(e) => pickPhoto(p.id, e.target.files?.[0])}
                              sx={{ display: "none" }}
                            />
                          </>
                        ) : (
                          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>是正写真なし</Typography>
                        )}
                      </Box>
                      {editing ? (
                        <TextField
                          multiline
                          minRows={2}
                          fullWidth
                          placeholder="コメントを入力（任意）"
                          value={p.fixComment}
                          onChange={(e) => setPhoto(p.id, { fixComment: e.target.value })}
                          sx={{ mt: 0.75 }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 12, mt: 0.75, whiteSpace: "pre-wrap" }}>{p.fixComment}</Typography>
                      )}
                      {editing && p.fixSrc && (
                        <Button size="small" sx={{ mt: 0.5 }} onClick={() => setPhoto(p.id, { fixSrc: "" })}>
                          添付を削除
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* 作業所コメント（元請確認コメント）。必須入力で、確認後は編集できない。 */}
          <SectionTitle>作業所コメント</SectionTitle>
          {confirmed ? (
            <Typography sx={{ fontSize: 12.5, px: 0.5, whiteSpace: "pre-wrap" }}>{record.siteComment}</Typography>
          ) : primeConfirming ? (
            <TextField
              multiline
              minRows={3}
              fullWidth
              required
              placeholder="コメントを入力（必須）"
              value={siteComment}
              onChange={(e) => {
                setSiteComment(e.target.value);
                if (error) setError("");
              }}
              error={!!error}
              helperText={error || "元請確認後は編集できません。"}
            />
          ) : (
            <Typography sx={{ fontSize: 12.5, px: 0.5, color: "text.secondary" }}>未入力</Typography>
          )}

          {/* 追記。実施後に気付いたことを、元請・協力会社のどちらからでも残せる。 */}
          <SectionTitle>追記</SectionTitle>
          <Typography color="text.secondary" sx={{ fontSize: 11.5, mb: 1.5 }}>
            実施済みの書類に、テキストと添付ファイルを追加できます。登録日時と登録者が記録され、編集・削除は登録した本人のみ行えます。
          </Typography>
          <PatrolNotes record={record} onSaved={setToast} />

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            <Button size="small" variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
              印刷
            </Button>
            <Box sx={{ ml: "auto", display: "flex", gap: 1.25 }}>
              {primeConfirming && (
                <Button size="small" variant="contained" onClick={handleConfirm}>
                  元請確認済みにする
                </Button>
              )}
              {confirmed && !fixMode && (
                <Button size="small" variant="contained" onClick={() => setFixMode(true)}>
                  是正入力
                </Button>
              )}
              {confirmed && fixMode && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setDraft({ items: record.items, photos: record.photos });
                      setFixMode(false);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button size="small" variant="contained" onClick={handleSaveFixes}>
                    是正内容を保存
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
