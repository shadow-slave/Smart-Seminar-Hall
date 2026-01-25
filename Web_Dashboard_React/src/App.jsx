import React, { useState, useEffect } from "react";
import { database } from "./firebase";
import { ref, onValue } from "firebase/database";
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  ThemeProvider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

// --- IMPORTS ---
import theme from "./theme"; // ✅ FIXED: Import default theme
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Bookings from "./components/Booking.jsx";

const drawerWidth = 260;

function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  // This state holds the LIVE data from ESP32
  const [data, setData] = useState({
    person_count: 0,
    temperature: 0,
    humidity: 0,
    ac_status: false,
  });

  // --- FIREBASE CONNECTION ---
  useEffect(() => {
    // We only need to listen to ONE thing: The Live Data
    // The ESP32 writes temperature/occupancy here.
    // The Booking Page writes booking info here.
    const sensorRef = ref(database, "seminar_hall/live_data");

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        setData((prev) => ({ ...prev, ...snapshot.val() }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {" "}
      {/* ✅ Uses the new Cyber-Dark theme */}
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CssBaseline /> {/* ✅ Paints the full background dark */}
        {/* TOP NAVBAR */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: "rgba(15, 23, 42, 0.8)", // Semi-transparent dark
            backdropFilter: "blur(8px)", // Blur effect
            boxShadow: "none",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" color="text.primary" fontWeight="bold">
                {currentView === "dashboard"
                  ? "Seminar Hall 401"
                  : "Schedule Manager"}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        {/* SIDEBAR NAVIGATION */}
        <Sidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={() => setMobileOpen(!mobileOpen)}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        {/* MAIN PAGE CONTENT */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Container maxWidth="xl">
            {currentView === "dashboard" ? (
              <Dashboard data={data} />
            ) : (
              <Bookings />
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
