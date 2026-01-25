import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, update } from "firebase/database";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Switch,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import {
  People as PeopleIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as HumidityIcon,
  AcUnit as AcIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const Dashboard = ({ data }) => {
  const [history, setHistory] = useState([]);

  // --- 1. Graph Logic (Keep last 20 readings) ---
  useEffect(() => {
    if (!data) return;

    setHistory((prev) => {
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Create new data point
      const newPoint = {
        time: now,
        temp: data.temperature || 0,
        hum: data.humidity || 0,
      };

      // Keep only the last 20 points for a smooth moving graph
      const newHistory = [...prev, newPoint];
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
  }, [data]); // Runs every time Firebase sends new data

  // --- 2. AC Switch Logic ---
  const handleACToggle = () => {
    update(ref(database, "seminar_hall/live_data"), {
      ac_status: !data.ac_status,
    });
  };

  const isRelayOn = data.relay_active === true;

  // --- 3. Component Helper (for the 4 Cards) ---
  const StatCard = ({ title, value, unit, icon, color, subtext }) => (
    <Card
      sx={{
        borderRadius: 4,
        height: "100%",
        position: "relative",
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -10,
          right: -10,
          opacity: 0.1,
          transform: "rotate(15deg)",
          color: color,
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          {React.cloneElement(icon, { sx: { color: color, fontSize: 20 } })}
          <Typography
            variant="overline"
            fontWeight="bold"
            color="text.secondary"
          >
            {title}
          </Typography>
        </Stack>
        <Typography variant="h3" fontWeight="bold" color="text.primary">
          {value}
          <Typography
            component="span"
            variant="h5"
            color="text.secondary"
            ml={0.5}
          >
            {unit}
          </Typography>
        </Typography>
        {subtext && (
          <Typography
            variant="caption"
            color="text.secondary"
            mt={1}
            display="block"
          >
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={3}>
      {/* --- ROW 1: THE 4 METRIC CARDS --- */}

      {/* 1. Occupancy */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="OCCUPANCY"
          value={data.person_count}
          unit=""
          color="#ef4444" // Red
          icon={<PeopleIcon sx={{ fontSize: 100 }} />}
          subtext={
            data.person_count > 0 ? "⚠️ Activity Detected" : "✅ Room Empty"
          }
        />
      </Grid>

      {/* 2. Temperature */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="TEMPERATURE"
          value={data.temperature}
          unit="°C"
          color="#f59e0b" // Amber
          icon={<ThermostatIcon sx={{ fontSize: 100 }} />}
          subtext="Target: 24°C"
        />
      </Grid>

      {/* 3. Humidity (NEW!) */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="HUMIDITY"
          value={data.humidity || 0}
          unit="%"
          color="#3b82f6" // Blue
          icon={<HumidityIcon sx={{ fontSize: 100 }} />}
          subtext="Comfort Level: Optimal"
        />
      </Grid>

      {/* 4. AC Status (Control) */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            borderRadius: 4,
            height: "100%",
            bgcolor: isRelayOn ? "rgba(34, 197, 94, 0.15)" : "background.paper",
            border: isRelayOn ? "2px solid #22c55e" : "1px solid transparent",
            transition: "all 0.3s ease",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="start"
            >
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  AC STATUS
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  sx={{
                    color: isRelayOn ? "#22c55e" : "text.secondary",
                    mt: 1,
                  }}
                >
                  {isRelayOn ? "ON" : "OFF"}
                </Typography>
              </Box>
              <Switch
                checked={Boolean(data.ac_status)}
                onChange={handleACToggle}
                color="success"
                sx={{ transform: "scale(1.2)" }}
              />
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              mt={2}
              display="block"
            >
              {data.ac_status ? "🔴 Manual Override" : "🟢 Auto Mode Active"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* --- ROW 2: LIVE GRAPH --- */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 4, height: 400 }}>
          <Typography variant="h6" fontWeight="bold" mb={3} gutterBottom>
            Live Environment Monitor
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={12}
                tickMargin={10}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderRadius: "12px",
                  border: "none",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTemp)"
                name="Temperature (°C)"
              />
              <Area
                type="monotone"
                dataKey="hum"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorHum)"
                name="Humidity (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
