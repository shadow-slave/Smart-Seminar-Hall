import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, push, remove, update } from "firebase/database";
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import {
  AddCircle as AddIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AcUnit as AcIcon,
  Schedule as TimeIcon,
} from "@mui/icons-material";

const Bookings = () => {
  const [bookingTime, setBookingTime] = useState("");
  const [allBookings, setAllBookings] = useState({});

  // Listen for bookings list
  useEffect(() => {
    const bookingsRef = ref(database, "seminar_hall/all_bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      setAllBookings(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, []);

  const handleAddBooking = () => {
    if (!bookingTime) return alert("Please select a date and time");

    // 1. Calculate Timestamps
    const startDate = new Date(bookingTime);
    const startTimestamp = startDate.getTime();

    // Default meeting duration: 2 Hours
    const endDate = new Date(startTimestamp + 2 * 60 * 60 * 1000);
    const endTimestamp = endDate.getTime();

    // AC Start Time (30 mins before)
    const acStartDate = new Date(startTimestamp - 30 * 60000);

    // 2. Add to List (Visual Table)
    push(ref(database, "seminar_hall/all_bookings"), {
      start_time: startTimestamp,
      end_time: endTimestamp,
      ac_start_time: acStartDate.getTime(), // Saved for display
      display_time: startDate.toLocaleString(),
    });

    // 3. Update Live Data (The ESP32 Trigger)
    update(ref(database, "seminar_hall/live_data"), {
      // ✅ FIX: Send the AC Start Time, NOT the Meeting Start Time
      booking_start: acStartDate.getTime(),
      booking_end: endTimestamp,
      booking_active: true,
    });

    setBookingTime("");
    alert("✅ Schedule Confirmed! AC will start 30 mins early.");
  };

  const handleDeleteBooking = (id) => {
    if (window.confirm("Are you sure you want to cancel this seminar?")) {
      // 1. Remove from List
      remove(ref(database, `seminar_hall/all_bookings/${id}`));

      // 2. Reset Live Data (Stop AC immediately)
      update(ref(database, "seminar_hall/live_data"), {
        booking_active: false,
        booking_start: 0,
        booking_end: 0,
      });
    }
  };

  // Helper to format dates nicely
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Grid container spacing={3}>
      {/* LEFT: BOOKING FORM */}
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <EventIcon color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight="bold">
                New Session
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={3}>
              Schedule a seminar below. The system will automatically prepare
              the room.
            </Typography>

            {/* Dark Mode Friendly Info Box */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                bgcolor: "rgba(14, 165, 233, 0.1)", // Subtle Blue Tint
                borderColor: "rgba(14, 165, 233, 0.3)", // Darker Blue Border
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <AcIcon color="info" fontSize="small" />
                <Typography
                  variant="subtitle2"
                  color="info.main"
                  fontWeight="bold"
                >
                  Automated Cooling
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                The AC will turn ON exactly <strong>30 minutes</strong> before
                your selected time.
              </Typography>
            </Paper>

            <TextField
              fullWidth
              type="datetime-local"
              label="Meeting Start Time"
              InputLabelProps={{ shrink: true }}
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleAddBooking}
              disabled={!bookingTime}
              sx={{ borderRadius: 3, py: 1.5, fontWeight: "bold" }}
            >
              Confirm Schedule
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* RIGHT: BOOKINGS LIST */}
      <Grid item xs={12} md={8}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 4, boxShadow: 3, overflow: "hidden" }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper", // Matches Dark Theme
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.secondary"
            >
              UPCOMING SESSIONS
            </Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.secondary"
                  >
                    DATE
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.secondary"
                  >
                    SEMINAR TIME
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <AcIcon fontSize="inherit" color="info" />
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="info.main"
                    >
                      AC START
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.secondary"
                  >
                    ACTION
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(allBookings).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography color="text.disabled">
                      No upcoming seminars scheduled
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(allBookings).map(([key, booking]) => (
                  <TableRow key={key} hover>
                    {/* Date Column */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        {formatDate(booking.start_time)}
                      </Typography>
                    </TableCell>

                    {/* Seminar Time Column */}
                    <TableCell>
                      <Chip
                        icon={<TimeIcon fontSize="small" />}
                        label={`${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    {/* AC Trigger Time Column */}
                    <TableCell>
                      <Chip
                        label={formatTime(
                          booking.ac_start_time ||
                            booking.start_time - 30 * 60000,
                        )}
                        color="info"
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>

                    {/* Delete Action */}
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteBooking(key)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default Bookings;
