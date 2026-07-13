export default function Card({ label, value, unit, tone, onLink, linkLabel = "点検記録確認" }) {
  return (
    <div className={"card" + (tone ? " tone-" + tone : "")}>
      <div className="label">{label}</div>
      <div className="num">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {onLink && (
        <div className="foot">
          <a onClick={onLink}>{linkLabel}</a>
        </div>
      )}
    </div>
  );
}
