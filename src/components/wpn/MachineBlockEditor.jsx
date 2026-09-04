import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Typography,
} from "@mui/material";
import BlockItemEditor from "./BlockItemEditor.jsx";
import { MACHINE_COMMON, MACHINE_TYPES } from "../../workPlanNeoMachineTypes.js";

// 機械ブロックの設定値。未設定なら共通項目のみONで、機種セクションは未選択。
export function machineConfig(cfg) {
  return { common: cfg?.common || {}, types: cfg?.types || [], byType: cfg?.byType || {} };
}

function Section({ title, hint, children }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2, mb: 1.5 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1.25 }}>
        {title}
        {hint && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
            {hint}
          </Typography>
        )}
      </Typography>
      {children}
    </Box>
  );
}

/**
 * 機械ブロックの設定。
 * 機械欄は機種ごとに必要な諸元が違うため、共通項目＋機種セクションの2段構成にする。
 * 作業計画書では、選んだ機種ごとに「機械を行・諸元を列」の表で入力する。
 */
export default function MachineBlockEditor({ value, onChange }) {
  const cfg = machineConfig(value);

  const toggleType = (key) =>
    onChange({
      ...cfg,
      types: cfg.types.includes(key) ? cfg.types.filter((t) => t !== key) : [...cfg.types, key],
    });

  return (
    <Box>
      <Section title="共通項目" hint="機種によらず入力する項目">
        <BlockItemEditor
          items={MACHINE_COMMON}
          value={cfg.common}
          onChange={(v) => onChange({ ...cfg, common: v })}
        />
      </Section>

      <Section title="機種セクション" hint="この現場で使う機種を選ぶと、機種ごとの諸元欄が追加されます">
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {MACHINE_TYPES.map((t) => {
            const on = cfg.types.includes(t.key);
            return (
              <Chip
                key={t.key}
                label={`${t.label}（${t.companies}社）`}
                color={on ? "primary" : "default"}
                variant={on ? "filled" : "outlined"}
                onClick={() => toggleType(t.key)}
                sx={{ opacity: on ? 1 : 0.7 }}
              />
            );
          })}
        </Box>
      </Section>

      {cfg.types.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ fontSize: 12.5, py: 2 }}>
          機種セクションが選択されていません。上から選ぶと、その機種の諸元項目を設定できます。
        </Typography>
      )}

      {MACHINE_TYPES.filter((t) => cfg.types.includes(t.key)).map((t) => (
        <Section key={t.key} title={t.label} hint={`${t.items.length}項目`}>
          <BlockItemEditor
            items={t.items}
            value={cfg.byType[t.key]}
            onChange={(v) => onChange({ ...cfg, byType: { ...cfg.byType, [t.key]: v } })}
          />
        </Section>
      ))}
    </Box>
  );
}
