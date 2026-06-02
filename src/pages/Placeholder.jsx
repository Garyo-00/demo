import { useParams } from "react-router-dom";

export default function Placeholder() {
  const { name } = useParams();
  return (
    <div className="placeholder">
      「{decodeURIComponent(name || "")}」画面はデモ未実装です。
    </div>
  );
}
