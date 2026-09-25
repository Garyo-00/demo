import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Divider, IconButton, InputAdornment, Link, Stack, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { BrandHeader, CenterPaper, CenterWrapper, LineLoginButton } from "../../components/kynext/KynextAuthParts.jsx";

/**
 * ログイン（本番 pages/auth/login.tsx + components/Auth/Login/index.tsx）。
 * サイドバー無しの独立ページ。デモでは認証せず、送信で現場選択へ進む。
 */
export default function KynextLogin() {
  const navigate = useNavigate();
  const { notify } = useKynext();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // react-hook-form / zod が無いので必須チェックは自前で行う
    const next = {};
    if (!form.email.trim()) next.email = "入力してください";
    if (!form.password) next.password = "入力してください";
    setErrors(next);
    if (Object.keys(next).length) return;
    navigate("/kynext/projects/select");
  };

  return (
    <CenterWrapper maxWidth="sm">
      <CenterPaper>
        <Container sx={{ px: { md: 0 } }}>
          <BrandHeader title="KY-NEXT" logoSize={64} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" component="div">
              以下の項目を入力して、ログインしてください
            </Typography>
          </Box>
          <Container sx={{ px: { xs: 0, md: 2 } }} component="form" onSubmit={submit} noValidate>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="メールアドレス"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
              />
              <TextField
                label="パスワード"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"} onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box>
                <Button type="submit" variant="contained" size="large" startIcon={<LoginIcon />} sx={{ minWidth: 200 }}>
                  ログイン
                </Button>
              </Box>
              <Link
                component="button"
                type="button"
                onClick={() => notify("パスワード再設定メールを送信しました（デモ）", "info")}
                sx={{ fontSize: 13, alignSelf: "center" }}
              >
                パスワードをお忘れですか？
              </Link>
            </Stack>
          </Container>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 400 }}>
              <Link href="#" onClick={(e) => e.preventDefault()}>
                利用規約
              </Link>
              、
              <Link href="#" onClick={(e) => e.preventDefault()}>
                個人情報
              </Link>
              の取り扱いに同意の上
              <Box component="br" sx={{ display: { md: "none" } }} />
              ログインしてください
            </Typography>
          </Box>
          <Divider sx={{ my: 3, mx: { xs: 0, md: 2 } }} />
          <Box>
            <LineLoginButton onClick={() => notify("LINEログインはデモでは利用できません", "info")} />
          </Box>
        </Container>
      </CenterPaper>
    </CenterWrapper>
  );
}
