import React, { useState, useEffect } from "react";
import { database } from "./firebase";
import { ref, onValue, update } from "firebase/database";
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
import { darkTheme } from "./theme"; // Imported Theme
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Bookings from "./components/Booking.jsx";

const drawerWidth = 260;

function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState({
    person_count: 0,
    temperature: 0,
    humidity: 0,
    ac_status: false,
  });

  // --- FIREBASE LOGIC (The "Brain") ---
  useEffect(() => {
    // 1. Live Sensor Data
    const sensorRef = ref(database, "seminar_hall/live_data");
    onValue(sensorRef, (snapshot) => {
      if (snapshot.exists())
        setData((prev) => ({ ...prev, ...snapshot.val() }));
    });

    // 2. Booking Sync Logic
    const bookingsRef = ref(database, "seminar_hall/all_bookings");
    onValue(bookingsRef, (snapshot) => {
      syncNearestBookingToESP(snapshot.val() || {});
    });
  }, []);

  // Helper: Find next booking and tell ESP32
  const syncNearestBookingToESP = (bookingsList) => {
    const now = Math.floor(Date.now() / 1000);
    let nearestSlot = null;
    let minDiff = Infinity;

    Object.values(bookingsList).forEach((booking) => {
      if (booking.trigger_time > now) {
        const diff = booking.trigger_time - now;
        if (diff < minDiff) {
          minDiff = diff;
          nearestSlot = booking;
        }
      }
    });

    const espRef = ref(database, "seminar_hall/booking");
    if (nearestSlot) {
      update(espRef, {
        trigger_time: nearestSlot.trigger_time,
        display_time: nearestSlot.display_time,
      });
    } else {
      update(espRef, { trigger_time: 0, display_time: "No Upcoming Slots" });
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CssBaseline />

        {/* TOP NAVBAR */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: "background.default",
            boxShadow: "none",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
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
              <Typography variant="h6" color="text.primary">
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
