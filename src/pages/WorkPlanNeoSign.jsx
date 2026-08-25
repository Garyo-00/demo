import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  ScopedCssBaseline,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { WpnProvider, useWpn } from "../components/wpn/WpnContext.jsx";
import PlanDetailContent from "../components/wpn/PlanDetailContent.jsx";
import SignaturePad from "../components/wpn/SignaturePad.jsx";
import { WPN_PROJECT, newId } from "../workPlanNeoData.js";
import {
  WPN_TODAY,
  approvedPlansForDate,
  clampSignDate,
  companiesWithApprovedPlans,
  machineById,
  signDateRange,
} from "../workPlanNeoPlanData.js";

// 打合せサイン用QRを読み取った後の画面（打合せ参加者が自分の端末で開く想定・ログイン不要）。
// 協力会社を選ぶ → 承認済みの作業計画書を選ぶ → 詳細を確認して手書きサイン。

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 対象作業日の選択。当日を基準に前後7日だけ選べる（作業間調整proの実績入力に合わせた構成）
function DatePicker({ value, onChange }) {
  const { min, max } = signDateRange();
  return (
    <Box sx={{ textAlign: "center", mb: 2.5 }}>
      <TextField
        type="date"
        label="対象作業日"
        value={value}
        onChange={(e) => onChange(e.target.value || WPN_TODAY)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min, max } }}
        sx={{ width: 200 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
        当日を既定表示。前後7日（{min.replaceAll("-", "/")}〜{max.replaceAll("-", "/")}）まで選択できます。
      </Typography>
    </Box>
  );
}

function StepTitle({ children }) {
  return (
    <Typography align="center" sx={{ fontSize: 14, fontWeight: 700, mb: 2 }}>
      {children}
    </Typography>
  );
}

// 選択済みの内容を上部に出す帯
function Picked({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        gap: 1.25,
        bgcolor: "primary.light",
        border: "1px solid #ccd2f2",
        borderRadius: 2.5,
        p: 1.5,
        mb: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ flex: "none" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

// 1. 協力会社の選択
function CompanyStep({ companies, date, onPick }) {
  return (
    <>
      <StepTitle>協力会社名を選択してください</StepTitle>
      {companies.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ fontSize: 12.5 }}>
          {date.replaceAll("-", "/")} に作業予定の承認済み作業計画書はありません。
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {companies.map((c) => (
            <Card key={c}>
              <CardActionArea onClick={() => onPick(c)} sx={{ p: 2, textAlign: "center" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{c}</Typography>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}

// 2. サインする作業計画書の選択（承認済みのみ）
function PlanStep({ company, plans, onPick, onBack }) {
  return (
    <>
      <Picked label="協力会社" value={company} />
      <StepTitle>サインする作業計画書を選択してください</StepTitle>
      {plans.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ fontSize: 12.5 }}>
          {company} の承認済み作業計画書はありません。
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {plans.map((p) => {
            const machines = p.machineIds.map(machineById).filter(Boolean);
            return (
              <Card key={p.id}>
                <CardActionArea onClick={() => onPick(p)}>
                  <CardContent>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1.25 }}>{p.name}</Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "68px 1fr",
                        gap: "4px 10px",
                        fontSize: 12.5,
                      }}
                    >
                      <Box sx={{ color: "text.secondary" }}>使用機材</Box>
                      <Box>
                        {machines.length === 0
                          ? "なし"
                          : machines.map((m) => m.alias || m.name).join("、")}
                      </Box>
                      <Box sx={{ color: "text.secondary" }}>申請者</Box>
                      <Box>{p.applicant}</Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
      <Box sx={{ textAlign: "center", mt: 1 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          協力会社を選び直す
        </Button>
      </Box>
    </>
  );
}

// 3. 作業計画書の詳細を確認してサイン
function SignStep({ plan, onSaved, onBack }) {
  return (
    <>
      <Picked label="作業計画書" value={plan.name} />

      <PlanDetailContent plan={plan} compact />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h2" sx={{ mb: 1.5 }}>
            打合せ参加者サイン
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
              内容を確認のうえ、サインしてください
            </Typography>
          </Typography>
          <SignaturePad onSave={onSaved} onCancel={onBack} />
        </CardContent>
      </Card>

      <Box sx={{ textAlign: "center" }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack}>
          作業計画書を選び直す
        </Button>
      </Box>
    </>
  );
}

// 保存後の完了画面
function DoneStep({ sign, plan, onMore }) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center", py: 4 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            mx: "auto",
            mb: 2,
            borderRadius: "50%",
            bgcolor: "primary.light",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>サインを保存しました</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, mb: 2, lineHeight: 1.8 }}>
          {plan.name}
          <br />
          {sign.at}
        </Typography>
        {sign.image ? (
          <Box
            component="img"
            src={sign.image}
            alt="保存したサイン"
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 320,
              mx: "auto",
              mb: 2.25,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2.5,
            }}
          />
        ) : (
          <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2.25 }}>{sign.name}</Typography>
        )}
        <Button variant="outlined" size="small" onClick={onMore}>
          別の作業計画書にサインする
        </Button>
      </CardContent>
    </Card>
  );
}

function SignFlow() {
  const { plans, savePlan } = useWpn();
  // 対象作業日。既定は当日で、この日に作業予定のある計画書だけを出す
  const [date, setDate] = useState(WPN_TODAY);
  const [company, setCompany] = useState(null);
  // 保存のたびに最新の計画書を参照したいので、ID で保持して都度引き直す
  const [planId, setPlanId] = useState(null);
  const [saved, setSaved] = useState(null);

  const companies = companiesWithApprovedPlans(plans, date);
  const companyPlans = approvedPlansForDate(plans, date).filter((p) => p.company === company);
  const plan = plans.find((p) => p.id === planId) || null;

  // 日付を変えたら選択をやり直す（その日の計画書一覧から選び直すため）
  function changeDate(d) {
    setDate(clampSignDate(d));
    setCompany(null);
    setPlanId(null);
    setSaved(null);
  }

  function reset() {
    setSaved(null);
    setPlanId(null);
  }

  // サインは作業計画書に紐づけて保存する（詳細ページに表示される）
  function saveSign(s) {
    const sign = { id: newId("sg"), image: s.image, name: s.name, workDate: date, at: nowStr() };
    savePlan({ ...plan, meetingSigns: [...(plan.meetingSigns || []), sign] });
    setSaved(sign);
  }

  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "background.default", px: 1.75, py: 2.5, pb: 5 }}>
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            {WPN_PROJECT}
          </Typography>
          <Typography sx={{ fontSize: 19, fontWeight: 700, mt: 0.75 }}>打合せ参加者サイン</Typography>
        </Box>

        {!saved && <DatePicker value={date} onChange={changeDate} />}

        {saved ? (
          <DoneStep sign={saved} plan={plan} onMore={reset} />
        ) : plan ? (
          <SignStep plan={plan} onBack={() => setPlanId(null)} onSaved={saveSign} />
        ) : company ? (
          <PlanStep
            company={company}
            plans={companyPlans}
            onPick={(p) => setPlanId(p.id)}
            onBack={() => setCompany(null)}
          />
        ) : (
          <CompanyStep companies={companies} date={date} onPick={setCompany} />
        )}

        <Box sx={{ textAlign: "center", mt: 2.75 }}>
          <Button component={Link} to="/workplan-neo/qr" size="small" color="inherit" sx={{ fontSize: 11.5 }}>
            ← QR発行画面へ戻る（デモ用）
          </Button>
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}

export default function WorkPlanNeoSign() {
  return (
    <WpnProvider>
      <SignFlow />
    </WpnProvider>
  );
}
