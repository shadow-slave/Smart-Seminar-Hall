import React from "react";
import { Grid, Paper, Typography, Box, Chip, Switch } from "@mui/material";
import {
  People as PeopleIcon,
  Thermostat as ThermostatIcon,
} from "@mui/icons-material";

// We pass 'data' as a PROP because App.jsx still fetches the live sensor data
const Dashboard = ({ data }) => {
  return (
    <Grid container spacing={3}>
      {/* Occupancy Card */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: "background.paper",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1 }}
          >
            <PeopleIcon sx={{ fontSize: 150 }} />
          </Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 2 }}
          >
            OCCUPANCY
          </Typography>
          <Typography variant="h2" color="text.primary" sx={{ my: 1 }}>
            {data.person_count}
          </Typography>
          <Chip
            label={data.person_count > 0 ? "Detected" : "Empty"}
            color={data.person_count > 0 ? "error" : "success"}
            variant="outlined"
          />
        </Paper>
      </Grid>

      {/* Temperature Card */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: "background.paper",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1 }}
          >
            <ThermostatIcon sx={{ fontSize: 150 }} />
          </Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 2 }}
          >
            TEMPERATURE
          </Typography>
          <Typography variant="h2" color="text.primary" sx={{ my: 1 }}>
            {data.temperature}°C
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Target: 24°C
          </Typography>
        </Paper>
      </Grid>

      {/* AC Status Card */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: data.ac_status
              ? "rgba(34, 197, 94, 0.1)"
              : "background.paper",
            border: data.ac_status ? "1px solid #22c55e" : "none",
          }}
        >
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 2 }}
          >
            AC STATUS
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
            }}
          >
            <Typography
              variant="h2"
              sx={{ color: data.ac_status ? "#4ade80" : "text.primary" }}
            >
              {data.ac_status ? "ON" : "OFF"}
            </Typography>
            <Switch checked={Boolean(data.ac_status)} color="success" />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
