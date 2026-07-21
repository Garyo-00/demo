import { useState } from "react";
import { Link } from "react-router-dom";

// 点検実施画面（機械／仮設・その他のタブ切替）。
// 添付イメージのレイアウトを再現するデモ実装（各ボタンは表示のみ）。
// 表示パターン（済／未・実施人数・実施事由の表示など）は、コンテンツ左右の余白に
// 配置したデモ用メニュー（DemoPanel）から切り替えてビューを確認できる。

// 仮設・始業前点検の実施者サンプル（使用者ごとに複数名になり得る）
const TEMP_INSPECTORS = ["佐藤 健", "鈴木 一郎", "高橋 誠", "伊藤 大輔", "渡辺 浩"];
const TEMP_MAX_INSPECTORS = TEMP_INSPECTORS.length;
// 組立後等点検：実施者プールと、実施事由の選択肢（複数選択可）
const ASSEMBLY_INSPECTORS = ["田中 太郎", "山本 健太", "渡辺 浩", "伊藤 大輔", "林 大樹"];
const ASSEMBLY_MAX = ASSEMBLY_INSPECTORS.length;
const ASSEMBLY_REASONS = ["組立後等", "悪天候後", "地震後", "定期", "一部解体後", "変更後", "その他"];

// 状態切替トグル（value は "undone" / "done"）。labels でボタン表示を差し替え可能。
function StateToggle({ value, onChange, labels = ["未", "済"] }) {
  return (
    <div className="ir-seg" role="group" aria-label="表示切替（デモ）">
      <button
        className={"ir-seg-btn" + (value === "undone" ? " on" : "")}
        onClick={() => onChange("undone")}
      >
        {labels[0]}
      </button>
      <button
        className={"ir-seg-btn" + (value === "done" ? " on" : "")}
        onClick={() => onChange("done")}
      >
        {labels[1]}
      </button>
    </div>
  );
}

// 数値の増減ステッパー（点検人数など）
function Stepper({ value, onChange, min = 0, max = 9 }) {
  return (
    <div className="ir-stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        −
      </button>
      <span className="ir-stepper-val">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        ＋
      </button>
    </div>
  );
}

// 複数選択（点検事由など）。選択済みの項目をチェックで増減する。
function MultiSelect({ options, selected, onToggle }) {
  return (
    <div className="ir-multi">
      {options.map((o) => (
        <label key={o} className={"ir-multi-item" + (selected.includes(o) ? " on" : "")}>
          <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

// 左右の余白に置くデモ用メニュー（タブに応じて操作項目を出し分け）
function DemoPanel({ tab, m, t }) {
  return (
    <div className="ir-demo-panel">
      <div className="ir-demo-panel-title">表示切替（デモ）</div>
      {tab === "machine" ? (
        <>
          <div className="ir-demo-row">
            <span>始業前点検</span>
            <StateToggle value={m.start} onChange={m.setStart} />
          </div>
          <div className="ir-demo-row">
            <span>月例点検</span>
            <StateToggle value={m.monthly} onChange={m.setMonthly} />
          </div>
        </>
      ) : (
        <>
          <div className="ir-demo-row">
            <span>始業前点検 実施人数</span>
            <Stepper value={t.startCount} onChange={t.setStartCount} min={0} max={TEMP_MAX_INSPECTORS} />
          </div>
          <div className="ir-demo-row">
            <span>組立後等点検 実施人数</span>
            <Stepper value={t.assemblyCount} onChange={t.setAssemblyCount} min={0} max={ASSEMBLY_MAX} />
          </div>
          <div className="ir-demo-row">
            <span>組立後等点検 実施事由（複数可）</span>
            <MultiSelect options={ASSEMBLY_REASONS} selected={t.assemblyReasons} onToggle={t.toggleReason} />
          </div>
        </>
      )}
    </div>
  );
}

// 機械タブ：ELV-2 の点検実施パネル
function MachinePanel({ start, monthly }) {
  const startDone = start === "done";
  const monthlyDone = monthly === "done";
  const hasRecords = startDone || monthlyDone;
  const monthlyLatest = monthlyDone ? "2026/07/03" : "2026/06/05";

  return (
    <>
      <div className="ir-title">ELV - 2</div>

      <div className="ir-period">使用期間：2026/05/26 〜 2026/05/29</div>
      <div className="ir-line ir-center">使用期限切れ</div>
      <div className="ir-line ir-center">7月17日：{startDone ? "点検済" : "点検未"}</div>

      <div className="ir-resp">
        <div>取扱責任者（正）：</div>
        <div>取扱責任者（副）：</div>
      </div>

      {/* 始業前点検（当日）：済＝青／未＝ピンク */}
      <div className={"ir-banner " + (startDone ? "done" : "undone")}>
        <div className="ir-banner-title">始業前点検　{startDone ? "済" : "未"}</div>
        <div className="ir-banner-sub">
          {startDone ? "本日の始業前点検は実施済みです。" : "始業前点検を実施してください。"}
        </div>
      </div>

      {/* 月例点検（当月）：済＝青／未＝ピンク。最新点検日は済・未どちらでも表示 */}
      <div className={"ir-banner " + (monthlyDone ? "done" : "undone")}>
        <div className="ir-banner-title">月例点検　{monthlyDone ? "済" : "未"}</div>
        <div className="ir-banner-sub">
          最新点検日：{monthlyLatest}
          {monthlyDone ? "（今月実施済）" : "（今月未実施）"}
        </div>
      </div>

      <div className="ir-resv">
        <div className="ir-resv-head">
          <strong>本日の予約</strong>
          <button className="ir-mini-btn">予約する</button>
        </div>
        <div className="ir-resv-row">
          <span className="ir-ampm">AM</span>
          <span className="ir-resv-none">予約はありません</span>
        </div>
        <div className="ir-resv-row">
          <span className="ir-ampm">PM</span>
          <span className="ir-resv-none">予約はありません</span>
        </div>
      </div>

      <div className="ir-actions">
        <button className="ir-btn">始業前点検開始</button>
        <button className="ir-btn">記録確認</button>
        <button className="ir-btn" disabled>作業計画書・指示書確認</button>
        <div className="ir-help">作業計画書・指示書はありません</div>
        <button className="ir-btn" disabled>作業計画書・指示書確認</button>
        <button className="ir-btn">受理証確認</button>
        <button className="ir-btn" disabled={startDone}>非稼働登録</button>
      </div>

      <div className="ir-admin">
        <div className="ir-admin-title">管理者メニュー</div>
        <button className="ir-btn">月例点検開始</button>
        <button className="ir-btn" disabled={!hasRecords}>点検元請確認</button>
        {!hasRecords && <div className="ir-help">点検記録がありません</div>}
        <button className="ir-btn">持込点検表一覧</button>
        <button className="ir-btn">過去点検記録確認</button>
      </div>
    </>
  );
}

// 仮設・その他タブ：わくぐみあしば の点検実施パネル
// ・始業前点検：実施人数0＝赤色で「未」。1名以上は「済」とはせず実施者名のみ表示
//   （同じ足場でも使用者ごとに点検が必要で、何名で「済」とするかは現場ごとに異なるため）
// ・組立後等点検：「未」ステータスは持たず、常に実施者を表示（いなければ空白）。
//   実施時は実施事由も表示できる（表示/非表示はデモメニューで切替）。
function TempPanel({ startCount, assemblyCount, assemblyReasons }) {
  const startDone = startCount > 0;
  const assemblyDone = assemblyCount > 0;
  const startInspectors = TEMP_INSPECTORS.slice(0, startCount).join("、");
  const assemblyInspectors = ASSEMBLY_INSPECTORS.slice(0, assemblyCount).join("、");
  // 実施事由は選択肢の並び順で表示（複数可）
  const reasonText = ASSEMBLY_REASONS.filter((r) => assemblyReasons.includes(r)).join("、");

  return (
    <>
      <div className="ir-title">わくぐみあしば</div>
      <div className="ir-line ir-center">
        7月17日：{startDone ? "点検実施中" : "点検未"}
      </div>

      <div className="ir-resp">
        <div>取扱責任者（正）：</div>
        <div>取扱責任者（副）：</div>
      </div>

      {/* 始業前点検：実施なし＝赤帯／実施ありは実施者名のみ（「済」表示・色付けはしない） */}
      {startDone ? (
        <div className="ir-info">
          <div className="ir-info-title">始業前点検</div>
          <div className="ir-info-body">実施者：{startInspectors}</div>
        </div>
      ) : (
        <div className="ir-banner red">
          <div className="ir-banner-title">始業前点検　未</div>
          <div className="ir-banner-sub">始業前点検を実施してください。</div>
        </div>
      )}

      {/* 組立後等点検：常に実施者を表示（複数可）。実施時は実施事由（複数可）も表示。実施者なしは空白 */}
      <div className="ir-info">
        <div className="ir-info-title">組立後等点検</div>
        {assemblyDone ? (
          <div className="ir-info-body">
            実施者：{assemblyInspectors}
            {reasonText && (
              <>
                <br />
                実施事由：{reasonText}
              </>
            )}
          </div>
        ) : (
          <div className="ir-info-body ir-info-blank">&nbsp;</div>
        )}
      </div>

      <div className="ir-actions">
        <button className="ir-btn">組立後等点検開始</button>
        <button className="ir-btn">始業前点検開始</button>
        <button className="ir-btn">記録確認</button>
        <button className="ir-btn" disabled>作業計画書・指示書確認</button>
        <button className="ir-btn">非稼働登録</button>
      </div>

      <div className="ir-admin">
        <div className="ir-admin-title">管理者メニュー</div>
        <button className="ir-btn" disabled={!(startDone || assemblyDone)}>
          点検元請確認
        </button>
        {!(startDone || assemblyDone) && <div className="ir-help">点検記録がありません</div>}
        <button className="ir-btn">持込点検表一覧</button>
        <button className="ir-btn">過去点検記録確認</button>
      </div>
    </>
  );
}

export default function InspectionRun() {
  const [tab, setTab] = useState("machine"); // machine | temp
  // 機械タブの表示状態
  const [mStart, setMStart] = useState("undone");
  const [mMonthly, setMMonthly] = useState("done");
  // 仮設タブの表示状態
  const [tStartCount, setTStartCount] = useState(0);
  const [tAssemblyCount, setTAssemblyCount] = useState(1);
  const [tAssemblyReasons, setTAssemblyReasons] = useState(["悪天候後"]);
  const toggleReason = (r) =>
    setTAssemblyReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

  return (
    <div className="ir-page">
      <div className="ir-topbar">
        <Link to="/" className="back">← デモ画面一覧へ戻る</Link>
        <h1>点検実施画面</h1>
      </div>

      <div className="tabs ir-tabs">
        <button
          className={"tab" + (tab === "machine" ? " on" : "")}
          onClick={() => setTab("machine")}
        >
          機械
        </button>
        <button
          className={"tab" + (tab === "temp" ? " on" : "")}
          onClick={() => setTab("temp")}
        >
          仮設・その他
        </button>
      </div>

      {/* 左右の余白に置くデモ用メニュー（狭い画面ではコンテンツ上部にインライン表示） */}
      <DemoPanel
        tab={tab}
        m={{ start: mStart, setStart: setMStart, monthly: mMonthly, setMonthly: setMMonthly }}
        t={{
          startCount: tStartCount, setStartCount: setTStartCount,
          assemblyCount: tAssemblyCount, setAssemblyCount: setTAssemblyCount,
          assemblyReasons: tAssemblyReasons, toggleReason,
        }}
      />

      <div className="ir-wrap">
        {tab === "machine" ? (
          <MachinePanel start={mStart} monthly={mMonthly} />
        ) : (
          <TempPanel
            startCount={tStartCount}
            assemblyCount={tAssemblyCount}
            assemblyReasons={tAssemblyReasons}
          />
        )}
      </div>
    </div>
  );
}
