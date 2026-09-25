import React from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, Divider, Stack } from '@mui/material';
import { Sparkles, ShieldCheck, Truck, RefreshCw, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <Box sx={{ backgroundColor: '#1E1E2C', color: '#FFFFFF', pt: 8, pb: 4, mt: 8 }}>
      <Container maxWidth="lg">
        {/* Value Props */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(108, 92, 231, 0.2)', color: '#A29BFE' }}>
                <ShieldCheck size={28} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>100% Safe & Certified</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>BIS Safety standard certified</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(255, 118, 117, 0.2)', color: '#FF7675' }}>
                <Truck size={28} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Free Shipping &gt; ₹999</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Fast nationwide courier</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(0, 184, 148, 0.2)', color: '#55E6C1' }}>
                <RefreshCw size={28} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hassle-Free Returns</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>7-day easy replacement policy</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(253, 203, 110, 0.2)', color: '#FFEAA7' }}>
                <PhoneCall size={28} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Family Support</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Dedicated customer care</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 6 }} />

        {/* Footer Links */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Sparkles size={24} color="#A29BFE" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Little Wonder Toys</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, pr: { md: 4 } }}>
              India’s premier single-vendor e-commerce store dedicated exclusively to high-quality, inspiring, and non-toxic children’s toys.
            </Typography>
          </Grid>

          <Grid item xs={6} sm={4} md={2.6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#A29BFE' }}>Categories</Typography>
            <Stack spacing={1}>
              <MuiLink component={Link} to="/products" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Shop All Toys</MuiLink>
              <MuiLink component={Link} to="/products/boys" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Toys for Boys</MuiLink>
              <MuiLink component={Link} to="/products/girls" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Toys for Girls</MuiLink>
              <MuiLink component={Link} to="/products/unisex" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Educational & Unisex</MuiLink>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={4} md={2.6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#A29BFE' }}>Customer Care</Typography>
            <Stack spacing={1}>
              <MuiLink component={Link} to="/account" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>My Orders</MuiLink>
              <MuiLink component={Link} to="/account?tab=wishlist" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Wishlist</MuiLink>
              <MuiLink component={Link} to="/account?tab=addresses" color="inherit" underline="hover" variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Shipping Addresses</MuiLink>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={4} md={2.8}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#A29BFE' }}>Contact Us</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Support: support@littlewondertoys.dev</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>Phone: +91 1800-LITTLE-TOY</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>Hours: Mon - Sat (9:00 AM - 7:00 PM)</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} Little Wonder Toys. All rights reserved. Single Vendor Premium Toy Store.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
