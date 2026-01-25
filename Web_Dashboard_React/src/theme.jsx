import { createTheme } from "@mui/material";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0f172a", paper: "#1e293b" },
    primary: { main: "#38bdf8" },
    text: { primary: "#f8fafc", secondary: "#94a3b8" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    // This fixes the date picker icon color
    MuiTextField: {
      styleOverrides: {
        root: {
          "& ::-webkit-calendar-picker-indicator": {
            filter: "invert(1)",
            cursor: "pointer",
          },
        },
      },
    },
  },
});
