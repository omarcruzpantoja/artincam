import { Box, type BoxProps } from "@mui/material";
import type { ImgHTMLAttributes } from "react";

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  sx?: BoxProps["sx"];
  src?: string;
}

const Image = ({ src, ...props }: ImageProps) => {
  return <Box component="img" src={src} {...props} />;
};

export default Image;
