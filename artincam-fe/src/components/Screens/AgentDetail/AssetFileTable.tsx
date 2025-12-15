import { useEffect, useState } from "react";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { assetFileService, type AssetFile } from "@services/assetFileService";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface AssetFilesGridProps {
  agentId: string;
}

const columns: GridColDef<AssetFile>[] = [
  {
    field: "file_name",
    headerName: "File Name",
    flex: 1,
    sortable: true,
    filterable: false,
  },
  {
    field: "file_size",
    headerName: "File Size (bytes)",
    width: 175,
    sortable: true,
    filterable: false,
  },
  {
    field: "unique_id",
    headerName: "Unique ID",
    width: 225,
    sortable: false,
    filterable: false,
  },
  {
    field: "camera_id",
    headerName: "Camera ID",
    width: 120,
    sortable: false,
    filterable: false,
  },
  {
    field: "location",
    headerName: "Location",
    width: 125,
    sortable: false,
    filterable: false,
  },
  {
    field: "timestamp",
    headerName: "Timestamp",
    width: 325,
    sortable: true,
    filterable: false,
  },
];

const AssetFileTable = ({ agentId }: AssetFilesGridProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const panelBg = alpha(theme.palette.background.paper, isDark ? 0.42 : 0.78);
  const border = alpha(theme.palette.divider, isDark ? 0.25 : 0.65);

  const [rows, setRows] = useState<AssetFile[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "timestamp", sort: "desc" },
  ]);

  useEffect(() => {
    if (!agentId) return;

    let cancelled = false;
    const { page, pageSize } = paginationModel;
    const sort = sortModel[0];

    async function load() {
      setLoading(true);
      try {
        const res = await assetFileService.listByAgent({
          agentId,
          limit: pageSize,
          offset: page * pageSize,
          sortField: sort?.field,
          sortOrder: sort?.sort ?? undefined,
        });

        if (cancelled) return;

        setRows(res.data);
        setRowCount(res.meta?.count ?? res.data.length);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load asset files", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [agentId, paginationModel.page, paginationModel.pageSize, sortModel]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${border}`,
        bgcolor: panelBg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: `1px solid ${alpha(
            theme.palette.divider,
            isDark ? 0.22 : 0.6
          )}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Asset Files
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        >
          rows: {rowCount}
        </Typography>
      </Box>

      <Divider sx={{ display: "none" }} />

      <Box sx={{ p: 2.0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.unique_id}
          autoHeight={false}
          loading={loading}
          paginationMode="server"
          sortingMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50]}
          sx={{
            border: `1px solid ${alpha(
              theme.palette.divider,
              isDark ? 0.22 : 0.55
            )}`,
            borderRadius: 2,
            bgcolor: alpha(
              theme.palette.background.default,
              isDark ? 0.25 : 0.45
            ),

            "& .MuiDataGrid-columnHeaders": {
              bgcolor: alpha(
                theme.palette.background.default,
                isDark ? 0.35 : 0.65
              ),
              borderBottom: `1px solid ${alpha(
                theme.palette.divider,
                isDark ? 0.22 : 0.55
              )}`,
              fontWeight: 800,
            },

            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${alpha(
                theme.palette.divider,
                isDark ? 0.14 : 0.35
              )}`,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 18,
            },

            "& .MuiDataGrid-row:hover": {
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06),
            },

            "& .MuiDataGrid-footerContainer": {
              borderTop: `1px solid ${alpha(
                theme.palette.divider,
                isDark ? 0.22 : 0.55
              )}`,
              bgcolor: alpha(
                theme.palette.background.default,
                isDark ? 0.3 : 0.6
              ),
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default AssetFileTable;
