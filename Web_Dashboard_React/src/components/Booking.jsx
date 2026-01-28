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
  Fade,
} from "@mui/material";
import {
  AddCircle as AddIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AcUnit as AcIcon,
  Schedule as TimeIcon,
} from "@mui/icons-material";

// --- GLASS STYLE ---
const glassStyle = {
  background: "rgba(30, 41, 59, 0.4)", // Semi-transparent Dark Blue
  backdropFilter: "blur(12px)", // Blur Effect
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: 4,
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
};

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
    //if bookingTime is in the past
    const now = new Date();
    if (new Date(bookingTime) <= now)
      return alert("Please select a future date and time");
    //if bookingTime overlaps with existing booking
    for (const booking of Object.values(allBookings)) {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;
      const newStart = new Date(bookingTime).getTime();
      const newEnd = newStart + 2 * 60 * 60 * 1000; // 2 hours duration
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return alert(
          "This time slot overlaps with an existing booking. Please choose a different time.",
        );
      }
    }

    // All good, push the booking
    const startDate = new Date(bookingTime);
    const startTimestamp = startDate.getTime();
    const endDate = new Date(startTimestamp + 2 * 60 * 60 * 1000);
    const endTimestamp = endDate.getTime();
    const acStartDate = new Date(startTimestamp - 30 * 60000);

    push(ref(database, "seminar_hall/all_bookings"), {
      start_time: startTimestamp,
      end_time: endTimestamp,
      ac_start_time: acStartDate.getTime(),
      display_time: startDate.toLocaleString(),
    });

    update(ref(database, "seminar_hall/live_data"), {
      booking_start: acStartDate.getTime(),
      booking_end: endTimestamp,
      booking_active: true,
    });

    setBookingTime("");
    alert("✅ Schedule Confirmed! AC will start 30 mins early.");
  };

  const handleDeleteBooking = (id) => {
    if (window.confirm("Are you sure you want to cancel this seminar?")) {
      remove(ref(database, `seminar_hall/all_bookings/${id}`));
      update(ref(database, "seminar_hall/live_data"), {
        booking_active: false,
        booking_start: 0,
        booking_end: 0,
      });
    }
  };

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
    <Fade in={true} timeout={1000}>
      <Grid container spacing={3}>
        {/* --- LEFT: BOOKING FORM --- */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{ ...glassStyle, position: "relative", overflow: "hidden" }}
          >
            {/* Decorative Glow */}
            <Box
              sx={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                background: "#8b5cf6",
                opacity: 0.2,
                borderRadius: "50%",
                filter: "blur(30px)",
              }}
            />

            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: "rgba(139, 92, 246, 0.2)",
                    color: "#8b5cf6",
                  }}
                >
                  <EventIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="800" color="#fff">
                    New Session
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Plan your next seminar
                  </Typography>
                </Box>
              </Stack>

              {/* Holographic Info Box */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 4,
                  bgcolor: "rgba(6, 182, 212, 0.05)",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                  borderRadius: 3,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <AcIcon sx={{ color: "#22d3ee", fontSize: 20 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#22d3ee",
                      fontWeight: "bold",
                      letterSpacing: 0.5,
                    }}
                  >
                    AUTO-COOLING ACTIVE
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ opacity: 0.8 }}
                >
                  System will trigger AC{" "}
                  <span style={{ color: "#fff", fontWeight: "bold" }}>
                    30 mins
                  </span>{" "}
                  prior to start time.
                </Typography>
              </Paper>

              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
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
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  background:
                    "linear-gradient(45deg, #7c3aed 30%, #3b82f6 90%)",
                  boxShadow: "0 4px 14px 0 rgba(124, 58, 237, 0.5)",
                }}
              >
                Confirm Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* --- RIGHT: BOOKINGS TABLE --- */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper} sx={{ ...glassStyle }}>
            {/* Table Header Area */}
            <Box
              sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Typography variant="h6" fontWeight="bold" color="#fff">
                Upcoming Sessions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage your scheduled events below
              </Typography>
            </Box>

            <Table>
              <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
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
                      TIME SLOT
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AcIcon sx={{ fontSize: 14, color: "#22d3ee" }} />
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{ color: "#22d3ee" }}
                      >
                        AC TRIGGER
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
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.disabled">
                        No upcoming seminars found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(allBookings).map(([key, booking]) => (
                    <TableRow
                      key={key}
                      sx={{
                        "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="#f1f5f9"
                        >
                          {formatDate(booking.start_time)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={
                            <TimeIcon sx={{ fontSize: "14px !important" }} />
                          }
                          label={`${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "#cbd5e1",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={formatTime(
                            booking.ac_start_time ||
                              booking.start_time - 30 * 60000,
                          )}
                          size="small"
                          sx={{
                            bgcolor: "rgba(6, 182, 212, 0.1)",
                            color: "#22d3ee",
                            fontWeight: "bold",
                            border: "1px solid rgba(6, 182, 212, 0.2)",
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteBooking(key)}
                          size="small"
                          sx={{
                            color: "#ef4444",
                            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
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
    </Fade>
  );
};

export default Bookings;
