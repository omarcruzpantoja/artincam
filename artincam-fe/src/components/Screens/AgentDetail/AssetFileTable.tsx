import { useEffect, useState } from "react";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { assetFileService, type AssetFile } from "@services/assetFileService";
import { Divider, Grid, Typography } from "@mui/material";

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
    field: "unique_id",
    headerName: "Unique ID",
    width: 250,
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
    width: 150,
    sortable: false,
    filterable: false,
  },
  {
    field: "timestamp",
    headerName: "Timestamp",
    width: 400,
    sortable: true,
    filterable: false,
  },
];

const AssetFileTable = ({ agentId }: AssetFilesGridProps) => {
  const [rows, setRows] = useState<AssetFile[]>([]);
  const [rowCount, setRowCount] = useState(0); // total rows on server
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
    const sort = sortModel[0]; // using single-column sort

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
        // using your existing meta shape: meta.count
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
  }, [
    agentId,
    paginationModel.page,
    paginationModel.pageSize,
    sortModel, // refetch when sort changes
  ]);

  return (
    <Grid>
      <Typography variant="h6" gutterBottom>
        Captured Images
      </Typography>
      <Divider sx={{ mb: 2 }} />

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
      />
    </Grid>
  );
};

export default AssetFileTable;
