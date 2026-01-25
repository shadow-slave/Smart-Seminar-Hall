import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, push, remove, update } from "firebase/database"; // ✅ Added 'update'
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import {
  AddCircle as AddIcon,
  Delete as DeleteIcon,
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
    const startTimestamp = startDate.getTime(); // Milliseconds

    // Default meeting duration: 2 Hours
    const endDate = new Date(startTimestamp + 2 * 60 * 60 * 1000);
    const endTimestamp = endDate.getTime();

    // AC Start Time (30 mins before)
    const acStartDate = new Date(startTimestamp - 30 * 60000);

    // 2. Add to the "List" (For the Table)
    push(ref(database, "seminar_hall/all_bookings"), {
      display_time: startDate.toLocaleString(),
      start_time: startTimestamp,
      end_time: endTimestamp,
      raw_date: bookingTime,
    });

    // 3. Update "Live Data" (For the ESP32)
    // This tells the ESP32 specifically when the next meeting is
    update(ref(database, "seminar_hall/live_data"), {
      booking_start: startTimestamp,
      booking_end: endTimestamp,
      booking_active: true, // Explicit flag
    });

    setBookingTime("");
    alert("Booking Added & Synced with ESP32!");
  };

  const handleDeleteBooking = (id) => {
    if (window.confirm("Delete this booking?")) {
      remove(ref(database, `seminar_hall/all_bookings/${id}`));
    }
  };

  return (
    <Grid container spacing={3}>
      {/* ADD BOOKING FORM */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Seminar
          </Typography>
          <Alert
            severity="info"
            sx={{ mb: 3, bgcolor: "rgba(56, 189, 248, 0.1)" }}
          >
            AC auto-starts 30 mins prior.
            <br />
            <strong>Default Duration: 2 Hours</strong>
          </Alert>

          <TextField
            fullWidth
            type="datetime-local"
            label="Select Date & Time"
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
          >
            Confirm Schedule
          </Button>
        </Paper>
      </Grid>

      {/* BOOKINGS TABLE */}
      <Grid item xs={12} md={8}>
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "text.secondary" }}>
                  START TIME
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>END TIME</TableCell>
                <TableCell align="right" sx={{ color: "text.secondary" }}>
                  ACTION
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(allBookings).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No upcoming seminars found
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(allBookings).map(([key, booking]) => (
                  <TableRow
                    key={key}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: 600 }}
                    >
                      {booking.display_time}
                    </TableCell>
                    <TableCell sx={{ color: "primary.main" }}>
                      {new Date(booking.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteBooking(key)}
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
