import { Card, CardContent, CardHeader, type CardProps } from "@mui/material";

type Props = CardProps & {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  // biome-ignore lint/suspicious/noExplicitAny: <Generic card content styles>
  contentSx?: Record<string, any>;
};

const SectionCard = ({
  title,
  action,
  children,
  contentSx,
  ...cardProps
}: Props) => {
  return (
    <Card variant="outlined" {...cardProps}>
      {title ? <CardHeader title={title} action={action} /> : null}
      <CardContent sx={contentSx}>{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
