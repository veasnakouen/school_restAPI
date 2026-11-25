import React, { useRef } from 'react';
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
  Tooltip,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

export type SearchFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showSearchIcon?: boolean;
  clearTooltip?: string;
};

/**
 * Reusable Material UI search input with leading search icon,
 * animated inline clear ("×") button, and Escape-to-clear keyboard support.
 */
export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  onClear,
  showSearchIcon = true,
  clearTooltip = 'Clear search',
  size = 'small',
  variant = 'outlined',
  slotProps,
  onKeyDown,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = Boolean(value);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && hasValue) {
      e.preventDefault();
      e.stopPropagation();
      handleClear();
    }
    onKeyDown?.(e);
  };

  return (
    <TextField
      {...rest}
      inputRef={inputRef}
      variant={variant}
      size={size}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      slotProps={{
        ...slotProps,
        input: {
          ...(typeof slotProps?.input === 'object' ? slotProps.input : undefined),
          startAdornment: showSearchIcon ? (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ) : undefined,
          endAdornment: (
            <AnimatePresence initial={false}>
              {hasValue && (
                <InputAdornment position="end">
                  <Tooltip title={clearTooltip}>
                    <IconButton
                      component={motion.button}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.14 }}
                      size="small"
                      edge="end"
                      aria-label={clearTooltip}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleClear}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'text.primary',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )}
            </AnimatePresence>
          ),
        },
      }}
    />
  );
};
