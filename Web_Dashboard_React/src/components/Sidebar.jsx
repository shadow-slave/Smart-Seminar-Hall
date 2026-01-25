import React from "react";
import {
  Box,
  Drawer,
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  AcUnit as AcUnitIcon,
} from "@mui/icons-material";

const drawerWidth = 260;

const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  currentView,
  setCurrentView,
}) => {
  // The actual menu content
  const drawerContent = (
    <Box sx={{ height: "100%", bgcolor: "background.paper" }}>
      <Toolbar sx={{ justifyContent: "center", py: 3 }}>
        <AcUnitIcon sx={{ color: "primary.main", mr: 1, fontSize: 28 }} />
        <Typography variant="h6" color="text.primary">
          EcoComfort AI
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, mt: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            selected={currentView === "dashboard"}
            onClick={() => setCurrentView("dashboard")}
            sx={{
              borderRadius: 2,
              "&.Mui-selected": { bgcolor: "rgba(56, 189, 248, 0.16)" },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentView === "dashboard"
                    ? "primary.main"
                    : "text.secondary",
              }}
            >
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Live Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={currentView === "bookings"}
            onClick={() => setCurrentView("bookings")}
            sx={{
              borderRadius: 2,
              "&.Mui-selected": { bgcolor: "rgba(56, 189, 248, 0.16)" },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentView === "bookings"
                    ? "primary.main"
                    : "text.secondary",
              }}
            >
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Bookings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            borderRight: "1px solid rgba(255,255,255,0.1)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
