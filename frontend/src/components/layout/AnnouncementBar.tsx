import React from 'react';
import { Box, Typography } from '@mui/material';
import { Sparkles, Truck, ShieldCheck } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#4834D4',
        color: '#FFFFFF',
        py: 0.8,
        px: 2,
        fontSize: '0.85rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Truck size={16} color="#FFEAA7" />
        <Typography variant="caption" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          FREE Express Delivery on Orders Above ₹999!
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.8 }}>
        <Sparkles size={16} color="#FFEAA7" />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Use Code <strong style={{ color: '#FFEAA7' }}>WELCOME10</strong> for 10% OFF
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.8 }}>
        <ShieldCheck size={16} color="#55E6C1" />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          100% Non-Toxic & Safety Certified Toys
        </Typography>
      </Box>
    </Box>
  );
};
