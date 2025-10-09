"use client";

import { Box, Button, ButtonGroup } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ReplayIcon from "@mui/icons-material/Replay";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import GridViewIcon from "@mui/icons-material/GridView";

export default function ActionBar({
  onSubmit,
  onClearData,
  viewMode,
  onViewChange,
  settingMode="Tokens",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1.5,
        border: "1px solid #E0E0E0",
        borderRadius: 3,
        bgcolor: "white",
        mb: 2,
      }}
    >
      {/* ปุ่มฝั่งซ้าย */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => onSubmit()}
          sx={{
            bgcolor: "#1976d2",
            color: "white",
            px: 2.5,
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          บันทึก
        </Button>

        <Button
          variant="contained"
          startIcon={<ReplayIcon />}
          onClick={() => onClearData()}
          sx={{
            bgcolor: "#E3F2FD",
            color: "#1976d2",
            px: 2.5,
            "&:hover": { bgcolor: "#BBDEFB" },
          }}
        >
          คืนค่า
        </Button>
      </Box>

      {/* ปุ่มกลุ่มขวา */}
      {settingMode === "Tokens" ? (
        <ButtonGroup
          variant="contained"
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {/* ปุ่ม Card */}
          <Button
            onClick={() => onViewChange("card")}
            sx={{
              bgcolor: viewMode === "card" ? "#3E8EF7" : "#E3F2FD",
              "&:hover": {
                bgcolor: viewMode === "card" ? "#1976d2" : "#BBDEFB",
              },
              minWidth: 45,
            }}
          >
            <ContentCopyIcon
              sx={{
                color: viewMode === "card" ? "white" : "#3E8EF7",
              }}
            />
          </Button>

          {/* ปุ่ม Table */}
          <Button
            onClick={() => onViewChange("table")}
            sx={{
              bgcolor: viewMode === "table" ? "#3E8EF7" : "#E3F2FD",
              "&:hover": {
                bgcolor: viewMode === "table" ? "#1976d2" : "#BBDEFB",
              },
              minWidth: 45,
            }}
          >
            <GridViewIcon
              sx={{
                color: viewMode === "table" ? "white" : "#3E8EF7",
              }}
            />
          </Button>
        </ButtonGroup>
      ) : (
        <Box></Box>
      )}
    </Box>
  );
}
