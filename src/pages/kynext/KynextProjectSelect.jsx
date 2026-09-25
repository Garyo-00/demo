import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, Box, Button, Chip, Container, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { BrandHeader, CenterPaper, CenterWrapper } from "../../components/kynext/KynextAuthParts.jsx";

// 現場ステータスの表示（本番 ProjectStatusLabel）
const STATUS_LABEL = {
  InProgress: { label: "進行中", color: "success" },
  Completed: { label: "完了", color: "default" },
};
function ProjectStatusLabel({ status }) {
  const s = STATUS_LABEL[status] ?? { label: status, color: "default" };
  return <Chip label={s.label} color={s.color} size="small" />;
}

// 全角英数字を半角に寄せ、大文字小文字を無視して検索する（本番 normalizeString）
const normalize = (str) =>
  str
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));

/**
 * 現場選択（本番 pages/projects/select.tsx + features/project/ProjectSelectPaper.tsx）。
 * サイドバー無しの独立ページ。選ぶと現場を切り替えて一覧へ戻る。
 */
export default function KynextProjectSelect() {
  const navigate = useNavigate();
  const { projects, switchProject, notify } = useKynext();

  // ステータス降順（進行中が先）→ ID 降順（本番 orderBy(['status','id'], 'desc')）
  const sorted = useMemo(() => [...projects].sort((a, b) => (a.status !== b.status ? (a.status < b.status ? 1 : -1) : b.id - a.id)), [projects]);
  const options = sorted.map((p) => ({ label: `${p.id} - ${p.name}`, value: p.id }));

  const select = (id) => {
    switchProject(id);
    notify("現場を切り替えました");
    navigate("/kynext");
  };

  return (
    <CenterWrapper maxWidth="md">
      <CenterPaper>
        <Container sx={{ px: { md: 0 } }}>
          <Box sx={{ display: "flex", justifyContent: "flex-start", pl: { xs: 0, md: 3 }, mb: 2 }}>
            <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              戻る
            </Button>
          </Box>
          <BrandHeader title="KYシート" />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" component="div">
              現場を選択して下さい
            </Typography>
          </Box>
          <Container sx={{ px: { xs: 0, md: 2 } }}>
            <Stack spacing={4} sx={{ mb: 3, alignItems: "center" }}>
              <FormControl sx={{ width: "100%", maxWidth: 500 }}>
                <InputLabel id="project-select-label">現場選択</InputLabel>
                <Select
                  label="現場選択"
                  labelId="project-select-label"
                  value=""
                  size="medium"
                  sx={{ height: 50, textAlign: "left" }}
                  onChange={(e) => select(Number(e.target.value))}
                >
                  {sorted.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Typography>{p.name}</Typography>
                        <ProjectStatusLabel status={p.status} />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* 現場IDまたは名称で検索（本番 SearchBar） */}
              <Box sx={{ width: "100%", maxWidth: 500 }}>
                <Autocomplete
                  options={options}
                  value={null}
                  onChange={(_, opt) => opt && select(opt.value)}
                  filterOptions={(opts, { inputValue }) => {
                    const q = normalize(inputValue);
                    return opts.filter((o) => normalize(o.label).includes(q));
                  }}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="現場IDまたは名称で検索"
                      // Autocomplete が渡す slotProps に検索アイコンだけ足す（上書きすると ref が外れる）
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...params.slotProps?.input,
                          startAdornment: (
                            <>
                              <SearchIcon sx={{ color: "text.secondary", ml: 0.5 }} />
                              {params.slotProps?.input?.startAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Stack>
          </Container>
        </Container>
      </CenterPaper>
    </CenterWrapper>
  );
}
