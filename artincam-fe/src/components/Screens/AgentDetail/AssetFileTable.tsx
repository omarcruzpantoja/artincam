import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { assetFileService, type AssetFile } from "@services/assetFileService";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";

interface AssetFilesGridProps {
  agentId: string;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    units.length - 1
  );
  const value = bytes / Math.pow(k, i);
  const decimals = i === 0 ? 0 : value < 10 ? 2 : value < 100 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

function formatTimestamp(ts: unknown): string {
  if (ts == null) return "-";

  // If your API returns ISO strings, this will work.
  // If it returns unix ms, also supported.
  const d =
    typeof ts === "string" || typeof ts === "number" ? new Date(ts) : null;

  if (!d || Number.isNaN(d.getTime())) return String(ts);

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const AssetFileTable = ({ agentId }: AssetFilesGridProps) => {
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

  // used to force reload without touching pagination/sort
  const [reloadKey, setReloadKey] = useState(0);

  const columns = useMemo<GridColDef<AssetFile>[]>(
    () => [
      {
        field: "file_name",
        headerName: "File Name",
        flex: 1,
        minWidth: 220,
        sortable: true,
        filterable: false,
      },
      {
        field: "file_size",
        headerName: "Size",
        width: 140,
        sortable: true,
        filterable: false,
        valueFormatter: (v) => formatBytes(v as number),
      },
      {
        field: "unique_id",
        headerName: "Unique ID",
        width: 230,
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
        width: 140,
        sortable: false,
        filterable: false,
      },
      {
        field: "timestamp",
        headerName: "Timestamp",
        width: 240,
        sortable: true,
        filterable: false,
        valueFormatter: (v) => formatTimestamp(v),
      },
    ],
    []
  );

  const load = useCallback(async () => {
    if (!agentId) return;

    const { page, pageSize } = paginationModel;
    const sort = sortModel[0];

    setLoading(true);
    try {
      const res = await assetFileService.listByAgent({
        agentId,
        limit: pageSize,
        offset: page * pageSize,
        sortField: sort?.field,
        sortOrder: sort?.sort ?? undefined,
      });

      setRows(res.data);
      setRowCount(res.meta?.count ?? res.data.length);
    } catch (err) {
      console.error("Failed to load asset files", err);
    } finally {
      setLoading(false);
    }
  }, [agentId, paginationModel, sortModel]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await load();
    })();

    return () => {
      cancelled = true;
    };
  }, [load, reloadKey]);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Optional: give the whole card a sensible minimum height
        minHeight: 520,
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Asset Files
          </Typography>
        }
        action={
          <Chip
            size="small"
            label={`Rows: ${rowCount}`}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        }
        sx={{
          px: 2.5,
          py: 2,
          "& .MuiCardHeader-action": { alignSelf: "center", m: 0 },
          flex: "0 0 auto",
        }}
      />

      {/* Toolbar strip */}
      <Box sx={{ px: 2.5, pb: 1.5, flex: "0 0 auto" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
          >
            Refresh
          </Button>

          <Tooltip title="Coming soon">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                disabled
              >
                Download CSV
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Divider sx={{ flex: "0 0 auto" }} />

      {/* This is the critical part */}
      <CardContent
        sx={{
          p: 2.5,
          flex: "1 1 auto",
          minHeight: 0, // ✅ allows DataGrid to size within this area
        }}
      >
        <Box
          sx={{
            height: "100%", // ✅ grid stays inside the card content
            minHeight: 360, // optional safety so it doesn't become tiny
            width: "100%",
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.unique_id}
            loading={loading}
            pagination
            paginationMode="server"
            sortingMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              height: "100%", // ✅ footer is inside the grid container
              borderRadius: 2,
              borderColor: "divider",
              "& .MuiDataGrid-columnHeaders": { fontWeight: 800 },
              "& .MuiDataGrid-cell": {
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 14,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssetFileTable;
