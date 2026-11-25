import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, ButtonBase } from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import { LayoutGroup, motion } from 'framer-motion';

export interface AnimatedNavTabItem<T extends string | number = string> {
  label: string;
  value: T;
  icon: React.ReactElement;
  to?: string;
  onPrefetch?: () => void;
}

interface AnimatedNavTabsProps<T extends string | number> {
  value: T;
  onChange: (newValue: T) => void;
  items: AnimatedNavTabItem<T>[];
  layoutGroupId: string;
  ariaLabel: string;
  sx?: object;
}

/**
 * Horizontal Material UI navigation menu bar with semantic <nav>/NavLink support
 * and an unclipped spring-gliding highlight + bottom accent indicator.
 */
export function AnimatedNavTabs<T extends string | number>({
  value,
  onChange,
  items,
  layoutGroupId,
  ariaLabel,
  sx,
}: AnimatedNavTabsProps<T>) {
  const muiTheme = useMuiTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'divider',
          borderRadius: 999,
        },
        ...sx,
      }}
    >
      <LayoutGroup id={layoutGroupId}>
        <Box
          role="menubar"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: 'max-content',
            pb: 0.75,
          }}
        >
          {items.map((item) => {
            const isSelected = value === item.value;
            const linkProps = item.to
              ? { component: NavLink, to: item.to }
              : { onClick: () => onChange(item.value) };

            return (
              <ButtonBase
                key={String(item.value)}
                role="menuitem"
                aria-current={isSelected ? 'page' : undefined}
                disableRipple
                onMouseEnter={item.onPrefetch}
                onFocus={item.onPrefetch}
                {...linkProps}
                sx={{
                  position: 'relative',
                  overflow: 'visible',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1.15,
                  borderRadius: 2,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  transition: 'color 180ms ease, background-color 180ms ease',
                  '& .nav-menu-icon': {
                    display: 'inline-flex',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'transform 180ms ease, color 180ms ease',
                    '& svg': { fontSize: 19 },
                  },
                  '&:hover': {
                    color: isSelected ? 'primary.main' : 'text.primary',
                    bgcolor: isSelected ? 'transparent' : alpha(muiTheme.palette.action.hover, 0.7),
                    '& .nav-menu-icon': {
                      transform: 'translateY(-1px) scale(1.08)',
                    },
                  },
                }}
              >
                {isSelected && (
                  <>
                    {/* Soft tinted glass highlight gliding cleanly across menu items */}
                    <Box
                      component={motion.span}
                      layoutId={`${layoutGroupId}-backdrop`}
                      transition={{ type: 'spring', stiffness: 600, damping: 38, mass: 0.65 }}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 2,
                        bgcolor: alpha(muiTheme.palette.primary.main, isDark ? 0.16 : 0.1),
                        zIndex: 0,
                        pointerEvents: 'none',
                      }}
                    />
                    {/* Glowing active menu underline indicator */}
                    <Box
                      component={motion.span}
                      layoutId={`${layoutGroupId}-indicator`}
                      transition={{ type: 'spring', stiffness: 620, damping: 36, mass: 0.65 }}
                      sx={{
                        position: 'absolute',
                        left: 10,
                        right: 10,
                        bottom: -7,
                        height: 3,
                        borderRadius: 999,
                        bgcolor: 'primary.main',
                        boxShadow: `0 0 10px ${alpha(muiTheme.palette.primary.main, 0.55)}`,
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    />
                  </>
                )}

                <Box component="span" className="nav-menu-icon">
                  {item.icon}
                </Box>
                <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
                  {item.label}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </LayoutGroup>
    </Box>
  );
}
