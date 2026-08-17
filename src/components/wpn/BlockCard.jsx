/**
 * 専用ブロック（作業配置図・クレーンの自動入力・打合せ参加者サイン・安全指示事項）のカード。
 * 項目テーブルとは別に、決まった機能をまとまりとして計画書に載せる／載せないを切り替える。
 * 各ブロックの詳細仕様は未定のため、現時点では使用可否のみ設定できる。
 */
export default function BlockCard({ block, enabled, onToggle }) {
  return (
    <div className="wpn-card">
      <div className="wpn-card-head">
        <h2 className="wpn-card-title">
          {block.label}
          <span className="wpn-hint">{block.hint}</span>
        </h2>
        <label className="wpn-toggle">
          <input
            type="checkbox"
            className="wpn-check"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          このブロックを使用する
        </label>
      </div>
      <div className={"wpn-block-body" + (enabled ? "" : " off")}>
        {enabled ? "詳細仕様は後日設定予定です。" : "このテンプレートでは使用しません。"}
      </div>
    </div>
  );
}
