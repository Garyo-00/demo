import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App.jsx";
import theme from "./theme.js";
import "./index.css";

// ThemeProvider は全体に掛けるが、CSSリセット（CssBaseline）は
// MUI化が済んだ画面だけに ScopedCssBaseline で当てる。
// 未変換のデモ画面が既存CSSのまま動くようにするため。
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
