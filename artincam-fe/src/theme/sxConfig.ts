// src/theme/sxConfig.ts
export const sxConfig = {
  lineClamp: {
    style: (props: { lineClamp?: number }) => ({
      display: "-webkit-box",
      WebkitLineClamp: String(props.lineClamp ?? 1),
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }),
  },
} as const;
