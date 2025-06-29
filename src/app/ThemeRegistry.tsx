"use client";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#43a047" },
    background: { default: "#f4f6fa" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: [
      'Geist', 'Inter', 'Roboto', 'Arial', 'sans-serif'
    ].join(','),
    h4: { fontWeight: 700, letterSpacing: 1 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
