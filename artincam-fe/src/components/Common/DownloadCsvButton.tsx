import DownloadIcon from "@mui/icons-material/Download";
import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";

// biome-ignore lint/suspicious/noExplicitAny: <A row can have any shape>
type Row = Record<string, any>;

export const downloadCsv = (rows: Row[], filename = "data.csv") => {
  if (!rows?.length) return;

  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: string) => {
    const s =
      v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    const needsQuotes = /[",\n\r]/.test(s);
    const out = s.replace(/"/g, '""');
    return needsQuotes ? `"${out}"` : out;
  };

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};

type DownloadCsvButtonProps = {
  filename: string;
  fetchRows: () => Promise<Row[]>;
  label?: string;
  size?: "small" | "medium" | "large";
  variant?: "text" | "outlined" | "contained";
};

const DownloadCsvButton = ({
  filename,
  fetchRows,
  label = "Download CSV",
  size = "small",
  variant = "outlined",
}: DownloadCsvButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const rows = await fetchRows();
      downloadCsv(rows, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
      onClick={handleClick}
    >
      {loading ? "Downloading…" : label}
    </Button>
  );
};

export default DownloadCsvButton;
