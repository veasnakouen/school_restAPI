import React, { useId, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium';
}

const SUN_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * SVG Solar Eclipse morphing theme toggle inside a frosted Material UI button:
 * the glowing sun sphere smoothly eclipses into a crescent moon via an animated SVG mask,
 * paired with a soft radial aura bloom across the viewport.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'medium' }) => {
  const { isDark, toggleDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const maskId = useId();
  const [flareKey, setFlareKey] = useState(0);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFlareKey((k) => k + 1);
    toggleDarkMode(event);
  };

  const accent = isDark ? '#fbbf24' : muiTheme.palette.primary.main;
  const sunOrMoonColor = isDark ? '#fde68a' : '#f59e0b';
  const iconPx = size === 'small' ? 20 : 23;

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Expanding ambient halo pulse on click */}
        <AnimatePresence>
          {flareKey > 0 && (
            <motion.span
              key={flareKey}
              initial={{ scale: 0.75, opacity: 0.7 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(accent, 0.45)} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        <IconButton
          component={motion.button}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          onClick={handleClick}
          size={size}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          sx={{
            width: size === 'small' ? 36 : 42,
            height: size === 'small' ? 36 : 42,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: isDark ? alpha('#fbbf24', 0.35) : alpha(muiTheme.palette.primary.main, 0.22),
            background: isDark
              ? `radial-gradient(circle at 30% 30%, ${alpha('#312e81', 0.85)}, ${alpha('#0f172a', 0.9)})`
              : `radial-gradient(circle at 30% 30%, #ffffff, ${alpha('#e0f2fe', 0.85)})`,
            boxShadow: isDark
              ? `0 2px 12px ${alpha('#000000', 0.45)}, 0 0 12px ${alpha('#fbbf24', 0.16)}`
              : `0 2px 10px ${alpha(muiTheme.palette.primary.main, 0.16)}`,
            transition: 'background 350ms ease, border-color 350ms ease, box-shadow 350ms ease',
            '&:hover': {
              boxShadow: isDark
                ? `0 0 18px ${alpha('#fbbf24', 0.36)}`
                : `0 0 16px ${alpha('#f59e0b', 0.3)}`,
            },
          }}
        >
          <motion.svg
            width={iconPx}
            height={iconPx}
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: isDark ? 40 : 90 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <mask id={maskId}>
                <rect x="0" y="0" width="24" height="24" fill="white" />
                <motion.circle
                  initial={false}
                  animate={{
                    cx: isDark ? 12 : 30,
                    cy: isDark ? 4 : 0,
                    r: isDark ? 9 : 5,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  fill="black"
                />
              </mask>
            </defs>

            {/* Sun core morphing into crescent moon via animated eclipse mask */}
            <motion.circle
              cx="12"
              cy="12"
              initial={false}
              animate={{
                r: isDark ? 9 : 5.2,
                fill: sunOrMoonColor,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              mask={`url(#${maskId})`}
            />

            {/* Radial sunbeams that contract cleanly into center when entering dark mode */}
            <motion.g
              initial={false}
              animate={{
                scale: isDark ? 0 : 1,
                opacity: isDark ? 0 : 1,
              }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: '12px 12px' }}
              stroke={sunOrMoonColor}
              strokeWidth="2"
              strokeLinecap="round"
            >
              {SUN_RAY_ANGLES.map((deg) => (
                <line
                  key={deg}
                  x1="12"
                  y1="2.2"
                  x2="12"
                  y2="4.1"
                  transform={`rotate(${deg} 12 12)`}
                />
              ))}
            </motion.g>

            {/* Tiny crescent stars appearing in dark mode */}
            <AnimatePresence>
              {isDark && (
                <motion.circle
                  key="eclipse-star"
                  cx="18.5"
                  cy="5.5"
                  r="1.25"
                  fill="#fef08a"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.14, type: 'spring', stiffness: 400, damping: 20 }}
                />
              )}
            </AnimatePresence>
          </motion.svg>
        </IconButton>
      </Box>
    </Tooltip>
  );
};
