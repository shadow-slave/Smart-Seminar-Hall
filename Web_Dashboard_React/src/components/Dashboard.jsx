import React, { useState, useEffect, useMemo } from "react";
import { database } from "../firebase";
import { ref, update } from "firebase/database";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Switch,
  Card,
  CardContent,
  Stack,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  People as PeopleIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as HumidityIcon,
  PowerSettingsNew as PowerIcon,
  Wifi as WifiIcon,
  AccessTime as TimeIcon,
  Timeline as GraphIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <Paper
      sx={{
        p: 1.5,
        bgcolor: "rgba(30, 41, 59, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 2,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        minWidth: 150,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "#94a3b8", mb: 0.5, display: "block" }}
      >
        {label}
      </Typography>
      {payload.map((entry, index) => (
        <Box
          key={index}
          sx={{ display: "flex", alignItems: "center", py: 0.3 }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: entry.color,
              mr: 1,
            }}
          />
          <Typography
            variant="body2"
            sx={{ color: entry.color, fontWeight: 500 }}
          >
            {entry.name}: {entry.value.toFixed(1)}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

const Dashboard = ({ data }) => {
  const theme = useTheme();
  const [history, setHistory] = useState([]);
  const [lastSync, setLastSync] = useState("Connecting...");
  const [isHovering, setIsHovering] = useState(false);

  // Safety thresholds with visual feedback
  const isTempHigh = data?.temperature > 28;
  const isHumidityHigh = data?.humidity > 70;
  const isOccupied = data?.person_count > 0;
  const isRelayOn = data?.relay_active === true;
  const isManualMode = data?.ac_status === true;

  // Optimized history updates
  useEffect(() => {
    if (!data?.temperature && !data?.humidity) return;

    const now = new Date();
    setLastSync(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );

    setHistory((prev) => {
      const newPoint = {
        time: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        temp: parseFloat(data.temperature) || 0,
        hum: parseFloat(data.humidity) || 0,
      };

      const updated = [...prev, newPoint];
      return updated.slice(-30); // Keep last 30 points
    });
  }, [data]);

  const handleACToggle = () => {
    if (!data) return;
    update(ref(database, "seminar_hall/live_data"), {
      ac_status: !data.ac_status,
    });
  };

  // Enhanced glass morphism with depth layers
  const glassCardBase = {
    background:
      "linear-gradient(145deg, rgba(30, 41, 59, 0.65), rgba(15, 23, 42, 0.75))",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.35),
      inset 0 0 15px rgba(0, 0, 0, 0.2)
    `,
    transition: "all 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)",
    overflow: "hidden",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "100%",
      background:
        "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.03) 0%, transparent 25%)",
      pointerEvents: "none",
    },
    "&:hover": {
      transform: "translateY(-3px)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      boxShadow: `
        0 12px 40px rgba(0, 0, 0, 0.45),
        inset 0 0 20px rgba(0, 0, 0, 0.3)
      `,
    },
  };

  // Status-aware card variants
  const getCardVariant = (status) => ({
    ...glassCardBase,
    ...(status === "warning" && {
      border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
      "&::after": {
        content: '""',
        position: "absolute",
        inset: -1,
        borderRadius: "inherit",
        padding: 0.5,
        background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      },
    }),
    ...(status === "success" && {
      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
    }),
  });

  // Enhanced StatCard with contextual awareness
  const StatCard = ({
    title,
    value,
    unit,
    icon: Icon,
    color,
    status,
    subtext,
  }) => {
    const statusColors = {
      warning: theme.palette.error.main,
      success: theme.palette.success.main,
      info: theme.palette.info.main,
    };

    return (
      <Card sx={getCardVariant(status)}>
        <CardContent sx={{ p: 2.5, position: "relative", zIndex: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(color, 0.15),
                color: color,
                display: "flex",
                boxShadow: `0 4px 12px ${alpha(color, 0.15)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  bgcolor: alpha(color, 0.25),
                },
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  background: `linear-gradient(to right, ${color}, ${alpha(color, 0.7)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: -0.5,
                }}
              >
                {value}
                {unit}
              </Typography>
              <Typography
                variant="overline"
                sx={{
                  color: "#94a3b8",
                  letterSpacing: 1.5,
                  fontWeight: 600,
                  display: "block",
                  mt: 0.5,
                }}
              >
                {title}
              </Typography>
            </Box>
            {status && (
              <Chip
                icon={
                  status === "warning" ? <WarningIcon /> : <CheckCircleIcon />
                }
                label={status === "warning" ? "ALERT" : "OPTIMAL"}
                size="small"
                sx={{
                  height: 28,
                  bgcolor: alpha(statusColors[status], 0.15),
                  color: statusColors[status],
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: 1,
                }}
              />
            )}
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor:
                  status === "warning"
                    ? theme.palette.error.main
                    : theme.palette.success.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: "#cbd5e1", fontWeight: 500 }}
            >
              {subtext}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Optimized graph data with memoization
  const chartData = useMemo(() => history, [history]);

  return (
    <Fade in timeout={800}>
      <Box sx={{ p: { xs: 1, sm: 2 }, minHeight: "100%" }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Sensor Cards Row */}
          <Grid item xs={12} md={4}>
            <StatCard
              title="OCCUPANCY"
              value={data?.person_count ?? 0}
              unit=""
              color={isOccupied ? "#f43f5e" : "#64748b"}
              icon={PeopleIcon}
              status={isOccupied ? "warning" : "success"}
              subtext={isOccupied ? "Occupied" : "Vacant"}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatCard
              title="TEMPERATURE"
              value={parseFloat(data?.temperature)?.toFixed(1) ?? "---"}
              unit="°C"
              color={isTempHigh ? "#f43f5e" : "#f59e0b"}
              icon={ThermostatIcon}
              status={isTempHigh ? "warning" : "success"}
              subtext={isTempHigh ? "Above threshold" : "Within range"}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatCard
              title="HUMIDITY"
              value={parseFloat(data?.humidity)?.toFixed(1) ?? "---"}
              unit="%"
              color={isHumidityHigh ? "#8b5cf6" : "#3b82f6"}
              icon={HumidityIcon}
              status={isHumidityHigh ? "warning" : "success"}
              subtext={isHumidityHigh ? "High humidity" : "Optimal level"}
            />
          </Grid>

          {/* Graph & Control Row */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                ...glassCardBase,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ p: 2.5, pb: 0 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: alpha("#f59e0b", 0.15),
                      borderRadius: 2,
                      color: "#f59e0b",
                    }}
                  >
                    <GraphIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ color: "#f8fafc" }}
                  >
                    Environmental Trends
                  </Typography>
                </Stack>
                <Chip
                  label="LIVE"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.2),
                    color: theme.palette.error.main,
                    fontWeight: 700,
                    height: 28,
                    marginLeft: 1,
                    "& .MuiChip-label": { px: 1.5 },
                  }}
                />
              </Stack>

              <Box sx={{ p: 2.5, pt: 1, flexGrow: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="tempGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="humGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="rgba(255,255,255,0.07)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      minTickGap={30}
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      tick={{ fill: "#94a3b8" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: 15,
                        backgroundColor: "transparent",
                        display: "flex",
                        justifyContent: "center",
                      }}
                      iconType="circle"
                      formatter={(value) => (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#cbd5e1",
                            ml: 0.5,
                            fontWeight: value.includes("Temp") ? 600 : 500,
                          }}
                        >
                          {value}
                        </Typography>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#tempGradient)"
                      name="Temperature (°C)"
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hum"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#humGradient)"
                      name="Humidity (%)"
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Control Tower */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                ...glassCardBase,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: isRelayOn
                  ? `1.5px solid ${alpha(theme.palette.success.main, 0.4)}`
                  : undefined,
                bgcolor: isRelayOn
                  ? "linear-gradient(145deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.8))"
                  : undefined,
                position: "relative",
                overflow: "hidden",
                "&::after": isRelayOn
                  ? {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.15)} 0%, transparent 70%)`,
                      pointerEvents: "none",
                      zIndex: 0,
                    }
                  : undefined,
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Status Indicator Ring */}
              {isRelayOn && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background:
                      "linear-gradient(90deg, transparent, #10b981, transparent)",
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { opacity: 0.3, transform: "scaleX(0.8)" },
                      "50%": { opacity: 1, transform: "scaleX(1)" },
                      "100%": { opacity: 0.3, transform: "scaleX(0.8)" },
                    },
                  }}
                />
              )}

              <CardContent
                sx={{
                  p: 3,
                  pb: 1.5,
                  position: "relative",
                  zIndex: 2,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Box sx={{ position: "relative", mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: isRelayOn
                        ? `radial-gradient(circle, ${alpha("#10b981", 0.25)} 0%, transparent 70%), linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.3))`
                        : `linear-gradient(145deg, rgba(56, 68, 79, 0.7), rgba(30, 41, 59, 0.9))`,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: isRelayOn
                        ? `2px solid ${alpha("#10b981", 0.6)}`
                        : `1.5px solid rgba(255,255,255,0.1)`,
                      boxShadow: isRelayOn
                        ? `0 0 25px ${alpha("#10b981", 0.4)}`
                        : "0 4px 20px rgba(0,0,0,0.35)",
                      transition:
                        "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      transform: isHovering ? "scale(1.03)" : "scale(1)",
                    }}
                  >
                    <PowerIcon
                      sx={{
                        fontSize: 48,
                        color: isRelayOn ? "#10b981" : "#64748b",
                        transition: "all 0.3s ease",
                        filter: isRelayOn
                          ? "drop-shadow(0 0 10px rgba(16, 185, 129, 0.7))"
                          : "none",
                      }}
                    />
                  </Box>

                  {/* Pulsing ring animation when active */}
                  {isRelayOn && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: "50%",
                        border: "2px solid #10b981",
                        opacity: 0.6,
                        animation: "pulseRing 2s infinite",
                        "@keyframes pulseRing": {
                          "0%": { transform: "scale(0.9)", opacity: 0.8 },
                          "70%": { transform: "scale(1.2)", opacity: 0 },
                          "100%": { transform: "scale(1.3)", opacity: 0 },
                        },
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    background: isRelayOn
                      ? "linear-gradient(to right, #10b981, #34d399)"
                      : "linear-gradient(to right, #f8fafc, #cbd5e1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 1,
                    letterSpacing: -0.5,
                  }}
                >
                  {isRelayOn ? "SYSTEM ACTIVE" : "SYSTEM STANDBY"}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "#94a3b8",
                    mb: 2.5,
                    maxWidth: "85%",
                    lineHeight: 1.5,
                  }}
                >
                  {isRelayOn
                    ? "Climate control system is operational"
                    : "System in energy-saving mode"}
                </Typography>

                <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 280 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#94a3b8", fontWeight: 500 }}
                    >
                      AUTO MODE
                    </Typography>
                    <Switch
                      checked={isManualMode}
                      onChange={handleACToggle}
                      color="success"
                      sx={{
                        transform: "scale(1.3)",
                        "& .MuiSwitch-switchBase": {
                          "&.Mui-checked": {
                            color: "#10b981",
                            "&:hover": {
                              bgcolor: alpha("#10b981", 0.15),
                            },
                          },
                          "&.Mui-checked + .MuiSwitch-track": {
                            bgcolor: alpha("#10b981", 0.5) + " !important",
                          },
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#94a3b8", fontWeight: 500 }}
                    >
                      MANUAL
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor: alpha(
                        isManualMode ? "#f43f5e" : "#10b981",
                        0.15,
                      ),
                      border: `1px solid ${alpha(isManualMode ? "#f43f5e" : "#10b981", 0.3)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: isManualMode ? "#f43f5e" : "#10b981",
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: isManualMode ? "#f43f5e" : "#10b981",
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}
                    >
                      {isManualMode
                        ? "MANUAL OVERRIDE ACTIVE"
                        : "AUTO-PILOT ENGAGED"}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>

              {/* Diagnostics Panel */}
              <Box
                sx={{
                  p: 2,
                  pt: 1.5,
                  bgcolor: "rgba(0, 0, 0, 0.25)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  zIndex: 2,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: "#64748b",
                    letterSpacing: 1.5,
                    fontWeight: 700,
                    display: "block",
                    mb: 1.5,
                    textAlign: "center",
                  }}
                >
                  SYSTEM STATUS
                </Typography>
                <List
                  dense
                  disablePadding
                  sx={{ "& .MuiListItem-root": { py: 0.7 } }}
                >
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WifiIcon
                        sx={{
                          color: "#10b981",
                          fontSize: 18,
                          filter:
                            "drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="caption"
                          sx={{ color: "#94a3b8", fontWeight: 600 }}
                        >
                          Connection
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{ color: "#f8fafc", fontWeight: 500 }}
                        >
                          Strong (WiFi)
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <TimeIcon
                        sx={{
                          color: "#a78bfa",
                          fontSize: 18,
                          filter:
                            "drop-shadow(0 0 4px rgba(167, 139, 250, 0.3))",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="caption"
                          sx={{ color: "#94a3b8", fontWeight: 600 }}
                        >
                          Last Sync
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{ color: "#f8fafc", fontWeight: 500 }}
                        >
                          {lastSync || "---"}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          bgcolor: data?.relay_active ? "#10b981" : "#ef4444",
                          border: `2px solid ${data?.relay_active ? "#0ca678" : "#dc2626"}`,
                          flexShrink: 0,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="caption"
                          sx={{ color: "#94a3b8", fontWeight: 600 }}
                        >
                          Relay Status
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            color: data?.relay_active ? "#10b981" : "#ef4444",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            "&::before": {
                              content: '""',
                              display: "inline-block",
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "currentColor",
                              mr: 1,
                            },
                          }}
                        >
                          {data?.relay_active ? "ACTIVE" : "INACTIVE"}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default Dashboard;
