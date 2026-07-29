import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./WorkPlanOutputPreview.css";

// 作業計画書 出力イメージ（A3横・改ページプレビュー / 現行PDF出力仕様準拠）
// 元の静的HTMLの改ページ計算（overflow計測ベース）をそのまま踏襲する。

const SITE = "現場名： テストプロジェクト";
const TITLE = "作業計画書タイトル";
const PERIOD = "作業期間：2026/06/30 ～ 2026/07/03";

// スライダー定義（id / ラベル / min / max / 初期値）
const CONTROLS = [
  { id: "kz", label: "機材 数", min: 0, max: 30, def: 2 },
  { id: "cmn", label: "展開項目 数", min: 0, max: 60, def: 11 },
  { id: "cmnA", label: "展開うち記入", min: 0, max: 60, def: 4 },
  { id: "wn", label: "作業内容 数", min: 0, max: 3, def: 2 },
  { id: "wi", label: "作業内容 項目数", min: 0, max: 50, def: 3 },
  { id: "st", label: "承認ステップ数", min: 1, max: 3, def: 2 },
  { id: "mem", label: "承認者/ステップ", min: 1, max: 5, def: 1 },
  { id: "im", label: "添付画像 枚数", min: 0, max: 40, def: 2 },
  { id: "cl", label: "チェックリスト 数", min: 0, max: 20, def: 6 },
  { id: "ci", label: "チェック項目数", min: 0, max: 15, def: 3 },
  { id: "zm", label: "表示倍率", min: 30, max: 100, def: 48 },
];

const TH_KIZAI =
  '<colgroup><col style="width:30%"><col style="width:40%"><col></colgroup>' +
  "<tr><th>カテゴリ</th><th>機械名</th><th>現場内呼称</th></tr>";
const TH_ITEM =
  '<colgroup><col style="width:34%"><col><col style="width:20%"></colgroup>' +
  "<tr><th>項目名</th><th>内容</th><th>備考</th></tr>";
const TH_CHECK =
  '<colgroup><col style="width:55%"><col></colgroup>' +
  "<tr><th>項目名</th><th>備考</th></tr>";

function names(n) {
  const a = [];
  for (let i = 1; i <= n; i++) a.push("名前" + i);
  return a.join("、");
}

function headerHTML() {
  return (
    '<div class="pg-head">' +
    '<div class="site">' + SITE + "</div>" +
    '<div class="doctitle">' + TITLE + "</div>" +
    '<div class="period">' + PERIOD + "</div></div>"
  );
}

// ---- 承認欄（グループなし・承認者名のみ） ----
function apprHTML(nSt, nMem) {
  let h =
    '<div class="appr-row">' +
    '<div class="applicant"><div class="a-h">申請者</div><div class="a-b">名前1</div></div>';
  for (let s = 1; s <= nSt; s++) {
    h +=
      '<div class="step"><div class="s-h"><div class="s-t">承認ステップ' + s + "</div>" +
      '<div class="s-d">決裁日: 2026/06/30</div></div>' +
      '<div class="s-names">' + names(nMem) + "</div></div>";
  }
  return h + "</div>";
}

// ---- 流し込みユニット（機材→展開→作業内容→チェックリストの1本流し） ----
function buildLeftUnits(nKz, nCmn, nCmnA) {
  const u = [];
  if (nKz > 0) {
    u.push({ k: "title", sec: "機材一覧", html: '<div class="sec-title">機材一覧</div>', thead: TH_KIZAI });
    u.push({ k: "thead", sec: "機材一覧", thead: TH_KIZAI });
    for (let i = 1; i <= nKz; i++) {
      u.push({
        k: "row", sec: "機材一覧", thead: TH_KIZAI,
        html: "<td>カテゴリ" + i + "</td><td>機械名" + i + "</td><td>呼称" + i + "</td>",
      });
    }
  }
  if (nCmn > 0) {
    u.push({ k: "title", sec: "展開項目", html: '<div class="sec-title">展開項目</div>', thead: TH_ITEM });
    u.push({ k: "thead", sec: "展開項目", thead: TH_ITEM });
    for (let j = 1; j <= nCmn; j++) {
      const c = j <= nCmnA ? "入力値" + j : '<span class="blank">（未入力）</span>';
      u.push({
        k: "row", sec: "展開項目", thead: TH_ITEM,
        html: "<td>項目" + j + "</td><td>" + c + "</td><td></td>",
      });
    }
  }
  return u;
}

function buildWorkUnits(nWn, nWi) {
  const u = [];
  for (let w = 1; w <= nWn; w++) {
    const sec = "作業内容 " + w;
    u.push({ k: "title", sec, html: '<div class="sec-title">' + sec + "</div>", thead: TH_ITEM });
    u.push({ k: "thead", sec, thead: TH_ITEM });
    for (let j = 1; j <= nWi; j++) {
      const c = j % 2 === 1 ? "内容" + j : '<span class="blank">（未入力）</span>';
      u.push({
        k: "row", sec, thead: TH_ITEM,
        html: "<td>項目" + j + "</td><td>" + c + "</td><td>備考</td>",
      });
    }
  }
  return u;
}

function checklistBlockHTML(k, nCi) {
  let rows = "";
  for (let r = 1; r <= nCi; r++) {
    const name = r === 1 ? "作業計画書を確認しました" : "チェック項目" + r;
    const memo = r % 2 === 0 ? "メモ" : "";
    rows += "<tr><td>" + name + "</td><td>" + memo + "</td></tr>";
  }
  if (nCi === 0) rows = '<tr><td colspan="2" style="color:#aaa">項目なし</td></tr>';
  return (
    '<div class="cl-block">' +
    '<div class="cl-t">チェックリスト' + k + "</div>" +
    '<div class="cl-doer">実施者: 名前' + (((k - 1) % 3) + 1) + "</div>" +
    '<table class="tbl">' + TH_CHECK + rows + "</table></div>"
  );
}

function buildChecklistUnits(nCl, nCi) {
  const u = [];
  if (nCl <= 0) return u;
  u.push({ k: "title", sec: "チェックリスト", html: '<div class="sec-title">チェックリスト</div>' });
  for (let k = 1; k <= nCl; k++) {
    u.push({ k: "block", sec: "チェックリスト", html: checklistBlockHTML(k, nCi) });
  }
  return u;
}

function newTable(theadHtml) {
  const t = document.createElement("table");
  t.className = "tbl";
  t.innerHTML = theadHtml;
  return t;
}

function unitEl(un) {
  if (un.k === "thead") return newTable(un.thead);
  const d = document.createElement("div");
  d.innerHTML = un.html;
  return d.firstChild;
}

// ---- 1カラム分の流し込み ----
function fillColumn(col, stream) {
  const units = stream.units;
  if (stream.idx < units.length && units[stream.idx].k === "row") {
    col.insertAdjacentHTML(
      "beforeend",
      '<div class="sec-title">' + units[stream.idx].sec + ' <span class="cont">（続き）</span></div>'
    );
    col.appendChild(newTable(units[stream.idx].thead));
  }
  while (stream.idx < units.length) {
    const un = units[stream.idx];
    if (un.k === "row") {
      const ts = col.querySelectorAll("table.tbl");
      let t = ts[ts.length - 1];
      if (!t) { t = newTable(un.thead); col.appendChild(t); }
      const tr = document.createElement("tr");
      tr.innerHTML = un.html;
      t.appendChild(tr);
      if (col.scrollHeight > col.clientHeight) { t.removeChild(tr); return; }
      stream.idx++;
    } else if (un.k === "thead") {
      const nt = newTable(un.thead);
      col.appendChild(nt);
      let ov = col.scrollHeight > col.clientHeight;
      // 見出し行だけが列末尾に残らないよう、次の1行まで収まるか確認
      if (!ov && stream.idx + 1 < units.length && units[stream.idx + 1].k === "row") {
        const tr2 = document.createElement("tr");
        tr2.innerHTML = units[stream.idx + 1].html;
        nt.appendChild(tr2);
        ov = col.scrollHeight > col.clientHeight;
        nt.removeChild(tr2);
      }
      if (ov) { col.removeChild(nt); return; }
      stream.idx++;
    } else {
      // title / block
      const d = unitEl(un);
      col.appendChild(d);
      if (col.scrollHeight > col.clientHeight) {
        if (un.k === "block" && col.children.length === 1) { stream.idx++; return; } // 単体で大きすぎるブロックは強制配置
        col.removeChild(d); return;
      }
      // 見出しが列末尾に孤立しないよう、直後のユニット（表なら見出し＋先頭行）が収まるか確認
      if (un.k === "title" && stream.idx + 1 < units.length) {
        const e2 = unitEl(units[stream.idx + 1]);
        if (
          units[stream.idx + 1].k === "thead" &&
          stream.idx + 2 < units.length &&
          units[stream.idx + 2].k === "row"
        ) {
          const lr = document.createElement("tr");
          lr.innerHTML = units[stream.idx + 2].html;
          e2.appendChild(lr);
        }
        col.appendChild(e2);
        const ov2 = col.scrollHeight > col.clientHeight;
        col.removeChild(e2);
        if (ov2) { col.removeChild(d); return; }
      }
      stream.idx++;
    }
  }
}

function makePage(stage, bodyHtml) {
  const wrap = document.createElement("div");
  wrap.className = "page-wrap";
  const page = document.createElement("div");
  page.className = "page";
  page.innerHTML = headerHTML() + bodyHtml + '<div class="pg-foot"></div>';
  wrap.appendChild(page);
  const tag = document.createElement("div");
  tag.className = "page-tag";
  wrap.appendChild(tag);
  stage.appendChild(wrap);
  return page;
}

// ---- 本文ページ（1本の流し：左列 → 右列 → 次ページ） ----
function flowPages(stage, stream, nSt, nMem) {
  let count = 0;
  while (true) {
    count++;
    const first = count === 1;
    let body;
    if (first) {
      body =
        '<div class="body"><div class="col" id="fcL"></div>' +
        '<div class="col col-fixedtop">' +
        apprHTML(nSt, nMem) +
        '<div class="layout-cap">作業配置図</div>' +
        '<div class="layout-box">作業配置図</div>' +
        '<div class="flow-rest" id="fcR"></div>' +
        "</div></div>";
    } else {
      body = '<div class="body"><div class="col" id="fcL"></div><div class="col" id="fcR"></div></div>';
    }
    const page = makePage(stage, body);
    const colL = page.querySelector("#fcL"); colL.removeAttribute("id");
    const colR = page.querySelector("#fcR"); colR.removeAttribute("id");
    fillColumn(colL, stream);
    fillColumn(colR, stream);
    if (stream.idx >= stream.units.length) break;
    if (count > 60) break;
  }
  return count;
}

// ---- 添付書類ページ（必ず改ページして専用ページに） ----
function imagePages(stage, nImg) {
  if (nImg <= 0) return 0;
  let made = 0, i = 1;
  while (i <= nImg) {
    made++;
    const page = makePage(stage, '<div class="sec-title">添付書類</div><div class="img-grid" id="ig"></div>');
    const grid = page.querySelector("#ig"); grid.removeAttribute("id");
    let placed = 0;
    while (i <= nImg) {
      const slot = document.createElement("div");
      slot.className = "img-slot"; slot.textContent = "画像" + i;
      grid.appendChild(slot);
      if (grid.scrollHeight > grid.clientHeight) {
        grid.removeChild(slot);
        if (placed === 0) { grid.appendChild(slot); i++; }
        break;
      }
      placed++; i++;
    }
    if (made > 40) break;
  }
  return made;
}

function numberPages(stage) {
  const pages = stage.querySelectorAll(".page");
  const wraps = stage.querySelectorAll(".page-wrap");
  for (let i = 0; i < pages.length; i++) {
    pages[i].querySelector(".pg-foot").textContent = i + 1 + " / " + pages.length;
    wraps[i].querySelector(".page-tag").textContent = i + 1 + " ページ目";
  }
}

export default function WorkPlanOutputPreview() {
  const stageRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [vals, setVals] = useState(() =>
    CONTROLS.reduce((acc, c) => ((acc[c.id] = c.def), acc), {})
  );

  const setVal = (id, v) =>
    setVals((prev) => {
      const next = { ...prev, [id]: v };
      if (id === "cmn" && next.cmnA > v) next.cmnA = v; // 展開うち記入は展開項目数を超えない
      return next;
    });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const nKz = vals.kz,
      nCmn = vals.cmn,
      nCmnA = Math.min(vals.cmnA, vals.cmn),
      nWn = vals.wn,
      nWi = vals.wi,
      nSt = vals.st,
      nMem = vals.mem,
      nImg = vals.im,
      nCl = vals.cl,
      nCi = vals.ci,
      zm = vals.zm;

    stage.style.zoom = 1;
    stage.innerHTML = "";

    const units = buildLeftUnits(nKz, nCmn, nCmnA)
      .concat(buildWorkUnits(nWn, nWi))
      .concat(buildChecklistUnits(nCl, nCi));
    const stream = { units, idx: 0 };
    const nFlow = flowPages(stage, stream, nSt, nMem);
    const nImgP = imagePages(stage, nImg);
    numberPages(stage);

    setSummary(
      "総ページ数：" + (nFlow + nImgP) +
      "（本文 " + nFlow + " ＋ 添付書類 " + nImgP + "）。" +
      "本文：機材一覧→展開項目→作業内容→チェックリストの連続流し込み、添付書類は必ず改ページ。"
    );

    stage.style.zoom = zm / 100;
  }, [vals]);

  return (
    <div className="wpo-root">
      <div className="toolbar">
        <h1>
          作業計画書 出力イメージ — A3横 改ページプレビュー（現行PDF出力仕様準拠）
          <Link className="back" to="/" style={{ marginLeft: 12 }}>
            ← デモ一覧へ戻る
          </Link>
        </h1>
        {CONTROLS.map((c) => {
          const max = c.id === "cmnA" ? vals.cmn : c.max;
          const shown = c.id === "zm" ? vals[c.id] + "%" : vals[c.id];
          return (
            <div className="ctl" key={c.id}>
              {c.label}{" "}
              <input
                type="range"
                min={c.min}
                max={max}
                value={vals[c.id]}
                onChange={(e) => setVal(c.id, +e.target.value)}
              />
              <b>{shown}</b>
            </div>
          );
        })}
        <div className="hint">{summary}</div>
        <div className="hint">
          印刷：ブラウザの印刷で、用紙=A3（向き=横）余白=なし。1ページ目右側上部（申請者・承認ステップ
          （承認者名のみ））→ その下に作業配置図。本文は「機材一覧 → 展開項目 → 作業内容（最大3）→
          チェックリスト」を1つの流れとして左列 → 右列（配置図の下）→ 次ページ… と流れ込み、添付書類のみ
          必ず改ページして専用ページに。
        </div>
      </div>

      <div className="stage" ref={stageRef} />
    </div>
  );
}
