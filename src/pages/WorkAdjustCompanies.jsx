import { useState, useRef } from "react";
import {
  WA_COMPANY_LIST,
  WA_INDUSTRIES,
  WA_JOBTYPES_BY_INDUSTRY,
  WA_FOREMAN_USERS,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";

function emptyEntry() {
  return { industry: "", jobType: "", show: true, foremen: [] };
}
function emptyCompany() {
  return { id: "", name: "", entries: [emptyEntry()] };
}

// CSVセルのエスケープ／簡易パース
function csvCell(v) {
  return /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
}
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export default function WorkAdjustCompanies() {
  const [companies, setCompanies] = useState(WA_COMPANY_LIST);
  const [view, setView] = useState("list"); // list | form
  const [form, setForm] = useState(null); // 編集中の会社
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [seq, setSeq] = useState(WA_COMPANY_LIST.length);
  const [showRef, setShowRef] = useState(false);
  const fileRef = useRef(null);

  const isEdit = form && form.id;
  const filtered = applied
    ? companies.filter((c) => c.name.includes(applied))
    : companies;

  // 一覧の表示設定チェック切替
  function toggleShow(companyId, idx) {
    setCompanies((cs) =>
      cs.map((c) =>
        c.id === companyId
          ? {
              ...c,
              entries: c.entries.map((e, i) =>
                i === idx ? { ...e, show: !e.show } : e
              ),
            }
          : c
      )
    );
  }

  // フォーム操作
  function openCreate() {
    setForm(emptyCompany());
    setView("form");
  }
  function openEdit(c) {
    setForm({ ...c, entries: c.entries.map((e) => ({ ...e })) });
    setView("form");
  }
  function setEntry(i, patch) {
    setForm((f) => ({
      ...f,
      entries: f.entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }));
  }
  function addEntry() {
    setForm((f) => ({ ...f, entries: [...f.entries, emptyEntry()] }));
  }
  function removeEntry(i) {
    setForm((f) => ({ ...f, entries: f.entries.filter((_, idx) => idx !== i) }));
  }
  function saveForm() {
    if (!form.name.trim()) {
      window.alert("協力会社名を入力してください。");
      return;
    }
    const valid = form.entries.filter((e) => e.industry && e.jobType);
    if (valid.length === 0) {
      window.alert("業種名・職種名を選択してください。");
      return;
    }
    const rec = { ...form, entries: valid };
    if (form.id) {
      setCompanies((cs) => cs.map((c) => (c.id === form.id ? rec : c)));
    } else {
      const n = seq + 1;
      setSeq(n);
      setCompanies((cs) => [...cs, { ...rec, id: "C-" + String(n).padStart(3, "0") }]);
    }
    setView("list");
    setForm(null);
  }

  // エクスポート（協力会社名／業種名／職種名）
  function exportCsv() {
    const rows = [["協力会社名", "業種名", "職種名"]];
    companies.forEach((c) =>
      c.entries.forEach((e) => rows.push([c.name, e.industry, e.jobType]))
    );
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "協力会社一覧.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  // インポート（同形式のCSV）
  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result).replace(/^﻿/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length <= 1) {
        window.alert("取り込むデータがありません。");
        return;
      }
      // 1行目はヘッダーとしてスキップ
      const parsed = lines.slice(1).map(parseCsvLine);
      setCompanies((cs) => {
        const next = cs.map((c) => ({ ...c, entries: c.entries.map((e) => ({ ...e })) }));
        let n = seq;
        parsed.forEach(([name, industry, jobType]) => {
          if (!name) return;
          let c = next.find((x) => x.name === name);
          if (!c) {
            n += 1;
            c = { id: "C-" + String(n).padStart(3, "0"), name, entries: [] };
            next.push(c);
          }
          const dup = c.entries.some(
            (e) => e.industry === industry && e.jobType === jobType
          );
          if (!dup) c.entries.push({ industry, jobType, show: true, foremen: [] });
        });
        setSeq(n);
        return next;
      });
      window.alert("インポートが完了しました。");
    };
    reader.readAsText(file, "UTF-8");
  }

  // ===== フォーム画面 =====
  if (view === "form") {
    return (
      <div>
        <div className="page-title">協力会社設定</div>
        <div className="section-title first">{isEdit ? "編集" : "新規作成"}</div>

        <div className="cmp-form">
          <div className="cmp-form-row">
            <label className="cmp-label">
              協力会社名<span className="req">*</span>
            </label>
            <input
              className="cmp-input"
              placeholder="協力会社名を入力してください"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <button className="ghost-btn accent-outline cmp-ref" onClick={() => setShowRef(true)}>
            参考：使用できる業種・職種
          </button>

          {form.entries.map((en, i) => (
            <div className="cmp-block" key={i}>
              <div className="cmp-block-head">
                <span className="cmp-block-title">業種・職種 {i + 1}</span>
                {form.entries.length > 1 && (
                  <button className="mini-btn danger" onClick={() => removeEntry(i)}>
                    削除
                  </button>
                )}
              </div>
              <div className="cmp-form-row">
                <label className="cmp-label">
                  業種名<span className="req">*</span>
                </label>
                <select
                  className="cmp-input"
                  value={en.industry}
                  onChange={(e) => setEntry(i, { industry: e.target.value, jobType: "" })}
                >
                  <option value="">業種名を選択してください</option>
                  {WA_INDUSTRIES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="cmp-form-row">
                <label className="cmp-label">
                  職種名<span className="req">*</span>
                </label>
                <select
                  className="cmp-input"
                  value={en.jobType}
                  onChange={(e) => setEntry(i, { jobType: e.target.value })}
                  disabled={!en.industry}
                >
                  <option value="">職種名を選択してください</option>
                  {(WA_JOBTYPES_BY_INDUSTRY[en.industry] || []).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              {isEdit && (
                <div className="cmp-form-row">
                  <label className="cmp-label">表示設定</label>
                  <label className="cmp-check">
                    <input
                      type="checkbox"
                      checked={en.show}
                      onChange={(e) => setEntry(i, { show: e.target.checked })}
                    />
                    入退場システムの選択肢として表示する。
                  </label>
                </div>
              )}
              <div className="cmp-form-row">
                <label className="cmp-label">職長ユーザー</label>
                <div className="cmp-check-group">
                  {WA_FOREMAN_USERS.map((u) => (
                    <label className="cmp-check" key={u}>
                      <input
                        type="checkbox"
                        checked={en.foremen.includes(u)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...en.foremen, u]
                            : en.foremen.filter((x) => x !== u);
                          // 表示順（マスタ順）の昇順で保持＝先頭が既定の職長になる
                          next.sort(
                            (a, b) => WA_FOREMAN_USERS.indexOf(a) - WA_FOREMAN_USERS.indexOf(b)
                          );
                          setEntry(i, { foremen: next });
                        }}
                      />
                      {u}
                    </label>
                  ))}
                  <span className="cmp-hint">複数選択可能（先頭が既定の職長）</span>
                </div>
              </div>
            </div>
          ))}

          <div className="cmp-addrow">
            <button className="linklike" onClick={addEntry}>＋ 職種を追加</button>
          </div>
        </div>

        <div className="cmp-form-foot">
          <button className="ghost-btn" onClick={() => { setView("list"); setForm(null); }}>
            キャンセル
          </button>
          <button className="primary-btn" onClick={saveForm}>
            {isEdit ? "保存" : "登録"}
          </button>
        </div>

        {showRef && (
          <Modal wide title="使用できる業種・職種" onClose={() => setShowRef(false)}>
            <div className="cmp-ref-list">
              {WA_INDUSTRIES.map((ind) => (
                <div className="cmp-ref-item" key={ind}>
                  <div className="cmp-ref-ind">{ind}</div>
                  <div className="cmp-ref-jobs">
                    {WA_JOBTYPES_BY_INDUSTRY[ind].join("、")}
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ===== 一覧画面 =====
  return (
    <div>
      <div className="page-title">協力会社設定</div>
      <p className="lead" style={{ margin: "0 0 18px" }}>
        出面・日報管理および他サービスで共通利用する協力会社設定
      </p>

      <div className="cmp-search">
        <div className="cmp-search-field">
          <span className="cmp-search-icon">🔍</span>
          <input
            placeholder="協力会社名"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setApplied(query.trim())}
          />
        </div>
        <div className="cmp-search-btns">
          <button className="primary-btn" onClick={() => setApplied(query.trim())}>検索</button>
          <button className="ghost-btn accent-outline" onClick={() => { setQuery(""); setApplied(""); }}>
            クリア
          </button>
        </div>
      </div>

      <div className="cmp-actions">
        <button className="ghost-btn" onClick={() => fileRef.current?.click()}>↑ インポート</button>
        <button className="ghost-btn" onClick={exportCsv}>↓ エクスポート</button>
        <button className="primary-btn" onClick={openCreate}>＋ 新規作成</button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
            e.target.value = "";
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">該当する協力会社はありません。</div>
      ) : (
        <table className="cmp-table">
          <thead>
            <tr>
              <th>協力会社</th>
              <th>職種</th>
              <th>表示設定</th>
              <th style={{ textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) =>
              c.entries.map((e, i) => (
                <tr key={c.id + "-" + i}>
                  {i === 0 && (
                    <td rowSpan={c.entries.length} className="cmp-name">
                      {c.name}
                    </td>
                  )}
                  <td>{e.jobType}</td>
                  <td>
                    <label className="cmp-check">
                      <input
                        type="checkbox"
                        checked={e.show}
                        onChange={() => toggleShow(c.id, i)}
                      />
                      表示する
                    </label>
                  </td>
                  {i === 0 && (
                    <td rowSpan={c.entries.length} style={{ textAlign: "right" }}>
                      <button className="linklike" onClick={() => openEdit(c)}>編集 ›</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
