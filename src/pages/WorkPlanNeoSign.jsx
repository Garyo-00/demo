import { useState } from "react";
import { Link } from "react-router-dom";
import { WpnProvider, useWpn } from "../components/wpn/WpnContext.jsx";
import PlanDetailContent from "../components/wpn/PlanDetailContent.jsx";
import SignaturePad from "../components/wpn/SignaturePad.jsx";
import { WPN_PROJECT, newId } from "../workPlanNeoData.js";
import { companiesWithApprovedPlans, machineById } from "../workPlanNeoPlanData.js";
import "../components/wpn/wpn.css";

// 打合せサイン用QRを読み取った後の画面（打合せ参加者が自分の端末で開く想定・ログイン不要）。
// 協力会社を選ぶ → 承認済みの作業計画書を選ぶ → 詳細を確認して手書きサイン。

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 1. 協力会社の選択
function CompanyStep({ companies, onPick }) {
  return (
    <>
      <h2 className="wpn-sign-step-title">協力会社名を選択してください</h2>
      {companies.length === 0 ? (
        <div className="wpn-none">承認済みの作業計画書がありません。</div>
      ) : (
        <div className="wpn-sign-companies">
          {companies.map((c) => (
            <button key={c} type="button" className="wpn-sign-company" onClick={() => onPick(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// 2. サインする作業計画書の選択（承認済みのみ）
function PlanStep({ company, plans, onPick, onBack }) {
  return (
    <>
      <div className="wpn-sign-picked">
        <span className="wpn-sign-picked-label">協力会社</span>
        <strong>{company}</strong>
      </div>
      <h2 className="wpn-sign-step-title">サインする作業計画書を選択してください</h2>
      {plans.length === 0 ? (
        <div className="wpn-none">{company} の承認済みの作業計画書はありません。</div>
      ) : (
        <div className="wpn-sign-cards">
          {plans.map((p) => {
            const machines = p.machineIds.map(machineById).filter(Boolean);
            return (
              <button key={p.id} type="button" className="wpn-sign-card" onClick={() => onPick(p)}>
                <div className="wpn-sign-card-name">{p.name}</div>
                <dl className="wpn-sign-card-meta">
                  <dt>使用機材</dt>
                  <dd>
                    {machines.length === 0
                      ? "なし"
                      : machines.map((m) => m.alias || m.name).join("、")}
                  </dd>
                  <dt>申請者</dt>
                  <dd>{p.applicant}</dd>
                </dl>
              </button>
            );
          })}
        </div>
      )}
      <button type="button" className="wpn-linkbtn wpn-sign-back" onClick={onBack}>
        ← 協力会社を選び直す
      </button>
    </>
  );
}

// 3. 作業計画書の詳細を確認してサイン
function SignStep({ plan, onSaved, onBack }) {
  return (
    <>
      <div className="wpn-sign-picked">
        <span className="wpn-sign-picked-label">作業計画書</span>
        <strong>{plan.name}</strong>
      </div>

      <PlanDetailContent plan={plan} compact />

      <div className="wpn-card">
        <h2 className="wpn-card-title">
          打合せ参加者サイン
          <span className="wpn-hint">内容を確認のうえ、サインしてください</span>
        </h2>
        <SignaturePad onSave={onSaved} onCancel={onBack} />
      </div>

      <button type="button" className="wpn-linkbtn wpn-sign-back" onClick={onBack}>
        ← 作業計画書を選び直す
      </button>
    </>
  );
}

// 保存後の完了画面
function DoneStep({ sign, plan, onMore }) {
  return (
    <div className="wpn-card wpn-sign-done">
      <div className="wpn-sign-done-check" aria-hidden="true">
        ✓
      </div>
      <h1 className="wpn-sign-done-title">サインを保存しました</h1>
      <p className="wpn-sign-done-text">
        {plan.name}
        <br />
        {sign.at}
      </p>
      {sign.image ? (
        <img className="wpn-sign-done-img" src={sign.image} alt="保存したサイン" />
      ) : (
        <div className="wpn-sign-done-name">{sign.name}</div>
      )}
      <button type="button" className="wpn-btn ghost sm" onClick={onMore}>
        別の作業計画書にサインする
      </button>
    </div>
  );
}

function SignFlow() {
  const { plans, savePlan } = useWpn();
  const [company, setCompany] = useState(null);
  // 保存のたびに最新の計画書を参照したいので、ID で保持して都度引き直す
  const [planId, setPlanId] = useState(null);
  const [saved, setSaved] = useState(null);

  const approved = plans.filter((p) => p.status === "approved");
  const companies = companiesWithApprovedPlans(plans);
  const companyPlans = approved.filter((p) => p.company === company);
  const plan = plans.find((p) => p.id === planId) || null;

  function reset() {
    setSaved(null);
    setPlanId(null);
  }

  // サインは作業計画書に紐づけて保存する（詳細ページに表示される）
  function saveSign(s) {
    const sign = { id: newId("sg"), image: s.image, name: s.name, at: nowStr() };
    savePlan({ ...plan, meetingSigns: [...(plan.meetingSigns || []), sign] });
    setSaved(sign);
  }

  return (
    <div className="wpn-standalone wpn-sign-screen">
      <div className="wpn-sign-inner">
        <div className="wpn-sign-head">
          <div className="wpn-sign-project">{WPN_PROJECT}</div>
          <h1 className="wpn-sign-title">打合せ参加者サイン</h1>
        </div>

        {saved ? (
          <DoneStep sign={saved} plan={plan} onMore={reset} />
        ) : plan ? (
          <SignStep
            plan={plan}
            onBack={() => setPlanId(null)}
            onSaved={saveSign}
          />
        ) : company ? (
          <PlanStep
            company={company}
            plans={companyPlans}
            onPick={(p) => setPlanId(p.id)}
            onBack={() => setCompany(null)}
          />
        ) : (
          <CompanyStep companies={companies} onPick={setCompany} />
        )}

        <Link to="/workplan-neo/qr" className="wpn-sign-demolink">
          ← QR発行画面へ戻る（デモ用）
        </Link>
      </div>
    </div>
  );
}

export default function WorkPlanNeoSign() {
  return (
    <WpnProvider>
      <SignFlow />
    </WpnProvider>
  );
}
