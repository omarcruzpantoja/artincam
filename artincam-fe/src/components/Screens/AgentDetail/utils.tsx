import { Stack, Typography } from "@mui/material";

interface RowProps {
  label: string;
  value: string;
}

export const Row = ({ label, value }: RowProps) => (
  <Stack direction="row" spacing={1} alignItems="flex-start">
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ minWidth: 100, fontWeight: 500 }}
    >
      {label}:
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Stack>
);
