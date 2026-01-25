import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark", // This does 90% of the work!
    primary: {
      main: "#8b5cf6", // Vivid Violet (Modern & Creative)
      light: "#a78bfa",
      dark: "#7c3aed",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#10b981", // Emerald Green (For success states)
      contrastText: "#ffffff",
    },
    background: {
      default: "#0f172a", // Deep Midnight Slate (Not just black)
      paper: "#1e293b", // Lighter Slate for cards
    },
    text: {
      primary: "#f8fafc", // Bright White for readability
      secondary: "#94a3b8", // Soft Grey for less important text
    },
    success: {
      main: "#10b981",
    },
    info: {
      main: "#0ea5e9", // Sky Blue
    },
    error: {
      main: "#ef4444", // Modern Red
    },
  },
  typography: {
    // "Inter" is the gold standard for modern UI, falling back to sans-serif
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: "none", // Removes the aggressive ALL CAPS
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // Clean look without material gradients
          borderRadius: 16, // Softer, modern corners
          border: "1px solid rgba(255, 255, 255, 0.05)", // Subtle border for depth
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Matches the paper aesthetic
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)", // Glowing effect on hover
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        track: {
          borderRadius: 22 / 2,
          opacity: 1,
          backgroundColor: "#334155", // Darker track when off
        },
        thumb: {
          boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
          width: 16,
          height: 16,
          margin: 2,
        },
      },
    },
  },
});

export default theme;
