import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Divider,
  IconButton,
  type IconButtonProps,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { type MouseEvent, type ReactNode, useState } from "react";

export type ActionVariant = "default" | "danger";

export interface ActionItem<TAction extends string = string> {
  /** Value passed to onAction when clicked */
  value: TAction;
  /** Label shown in the menu */
  label: string;
  /** Optional variant for styling (e.g. danger for delete) */
  variant?: ActionVariant;
  /** Optional icon to show before the label */
  icon?: ReactNode;
  /** Whether to show a divider above this item */
  dividerAbove?: boolean;
  /** Optional disabled flag */
  disabled?: boolean;
}

export interface ActionsMenuProps<TAction extends string = string> {
  /** List of menu actions */
  items: ActionItem<TAction>[];
  /** Called when an action is selected */
  onAction: (action: TAction) => void;
  /** Accessible label for the IconButton */
  ariaLabel?: string;
  /** Optional override for menu id (useful if multiple on page) */
  menuId?: string;
  /** Props forwarded to IconButton */
  buttonProps?: Omit<IconButtonProps, "onClick" | "children">;
}

const ActionsMenu = <TAction extends string = string>({
  items,
  onAction,
  ariaLabel = "Actions",
  menuId = "actions-menu",
  buttonProps,
}: ActionsMenuProps<TAction>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleClick = (value: TAction) => {
    onAction(value);
    handleClose();
  };

  return (
    <Box>
      <IconButton
        aria-label={ariaLabel}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleOpen}
        {...buttonProps}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {items.map((item, index) => (
          <Box key={item.value}>
            {item.dividerAbove && index > 0 && <Divider />}
            <MenuItem
              onClick={() => handleClick(item.value)}
              disabled={item.disabled}
            >
              {item.icon && (
                <Box sx={{ mr: 1, display: "flex" }}>{item.icon}</Box>
              )}
              {item.variant === "danger" ? (
                <Typography color="error">{item.label}</Typography>
              ) : (
                <Typography>{item.label}</Typography>
              )}
            </MenuItem>
          </Box>
        ))}
      </Menu>
    </Box>
  );
};

export default ActionsMenu;
