import { useState, useRef } from "react";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

const STATUS = {
  converted: { label: "変換済", cls: "badge-green" },
  unconverted: { label: "未変換", cls: "badge-gray" },
};

function emptyForm() {
  return { id: "", floorName: "", note: "", image: null };
}

export default function WorkAdjustFloorPlanSetting() {
  const { templates: items, setTemplates: setItems } = useWaSettings();
  const [view, setView] = useState("list"); // list | register | detail
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null); // ⋮メニューを開いている行id
  const [seq, setSeq] = useState(items.length);
  const fileRef = useRef(null);

  const detail = items.find((x) => x.id === detailId);

  function openRegister() {
    setForm(emptyForm());
    setView("register");
  }
  function openDetail(item) {
    setDetailId(item.id);
    setMenuOpen(null);
    setView("detail");
  }
  function removeItem(item) {
    setMenuOpen(null);
    if (window.confirm(`「${item.floorName}」を削除しますか？`)) {
      setItems((xs) => xs.filter((x) => x.id !== item.id));
    }
  }
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm((x) => ({ ...x, image: reader.result }));
    reader.readAsDataURL(f);
    e.target.value = "";
  }
  function saveForm() {
    if (!form.floorName.trim()) {
      window.alert("フロア名を入力してください。");
      return;
    }
    const status = form.image ? "converted" : "unconverted";
    const n = seq + 1;
    setSeq(n);
    setItems((xs) => [...xs, { ...form, id: "FP-" + String(n).padStart(3, "0"), status }]);
    setView("list");
    setForm(null);
  }

  // ===== 登録 =====
  if (view === "register") {
    return (
      <div>
        <div className="page-title">作業配置図設定登録</div>

        <div className="fps-section">
          <div className="fps-section-title">基本情報</div>
          <div className="field full" style={{ marginBottom: 16 }}>
            <input
              className="cmp-input"
              placeholder="フロア名 *"
              value={form.floorName}
              onChange={(e) => setForm((f) => ({ ...f, floorName: e.target.value }))}
            />
          </div>
          <div className="field full">
            <textarea
              className="cmp-input"
              placeholder="備考"
              rows={4}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        <div className="fps-section">
          <div className="fps-section-title">平面図</div>
          <button className="fps-filebtn" onClick={() => fileRef.current?.click()}>
            ファイルを選択
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFile}
          />
          {form.image && (
            <img className="fps-preview" src={form.image} alt="平面図プレビュー" />
          )}
        </div>

        <div className="fps-foot">
          <button className="ghost-btn" onClick={() => { setView("list"); setForm(null); }}>
            ✕ キャンセル
          </button>
          <button className="primary-btn" onClick={saveForm}>
            登録
          </button>
        </div>
      </div>
    );
  }

  // ===== 詳細 =====
  if (view === "detail" && detail) {
    return (
      <div>
        <button className="linklike" onClick={() => setView("list")} style={{ fontSize: 14, marginBottom: 14 }}>
          ← 一覧に戻る
        </button>
        <div className="fps-section">
          <div className="fps-section-title">作業配置図設定: {detail.floorName}</div>
          <div className="fps-detail-note">
            <span className="da-label">備考</span>
            <div>{detail.note ? detail.note : "—"}</div>
          </div>
          {detail.image ? (
            <img className="fps-preview" src={detail.image} alt={detail.floorName} />
          ) : (
            <div className="fps-planbox">平面図（アップロードした画像を表示します）</div>
          )}
        </div>
      </div>
    );
  }

  // ===== 一覧 =====
  return (
    <div>
      <div className="page-title">作業配置図設定</div>
      <div className="fps-listcard">
        <div className="fps-listhead">
          <strong>作業配置図設定一覧</strong>
          <button className="primary-btn" onClick={openRegister}>＋ 追加</button>
        </div>
        {items.length === 0 ? (
          <div className="empty">作業配置図がありません。</div>
        ) : (
          <table className="fps-table">
            <thead>
              <tr>
                <th>フロア名</th>
                <th>ステータス</th>
                <th>備考</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.floorName}</td>
                  <td>
                    <span className={STATUS[it.status].cls}>{STATUS[it.status].label}</span>
                  </td>
                  <td>{it.note || <span className="subtle">—</span>}</td>
                  <td style={{ textAlign: "right", position: "relative" }}>
                    <button
                      className="kebab-btn"
                      onClick={() => setMenuOpen(menuOpen === it.id ? null : it.id)}
                    >
                      ⋮
                    </button>
                    {menuOpen === it.id && (
                      <div className="kebab-menu">
                        <button onClick={() => openDetail(it)}>ⓘ 詳細</button>
                        <button className="danger" onClick={() => removeItem(it)}>🗑 削除</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
