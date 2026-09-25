import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Badge,
  InputBase,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Menu as MenuIcon,
  Sparkles,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  Package,
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useQuery } from '@tanstack/react-query';
import { getGqlClient } from '../../services/graphql';
import { GET_CART_QUERY } from '../../graphql/queries';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuthStore();
  const { sessionId, toggleCartDrawer, toggleAuthModal } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch cart to display badge count
  const { data: cartData } = useQuery({
    queryKey: ['cart', sessionId, token],
    queryFn: () => getGqlClient().request(GET_CART_QUERY, { sessionId }),
  });

  const cartCount = (cartData as any)?.cart?.totalItems || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleUserClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!token) {
      toggleAuthModal(true, 'login');
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/');
  };

  const isAdmin = user?.roles?.some((r) => ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(r));

  const navLinks = [
    { label: 'Shop All', path: '/products' },
    { label: 'Boys', path: '/products/boys' },
    { label: 'Girls', path: '/products/girls' },
    { label: 'Unisex', path: '/products/unisex' },
  ];

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid rgba(226, 224, 240, 0.8)', background: '#FFFFFF' }}>
      <Toolbar sx={{ justifyContent: 'space-between', py: 1, gap: 2 }}>
        {/* Mobile Hamburger */}
        <IconButton sx={{ display: { xs: 'flex', md: 'none' } }} onClick={() => setMobileMenuOpen(true)}>
          <MenuIcon size={24} />
        </IconButton>

        {/* Brand Logo */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6C5CE7 0%, #FF7675 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
            }}
          >
            <Sparkles size={24} color="#FFFFFF" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: '#2D3436', fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
              Little Wonder
            </Typography>
            <Typography variant="caption" sx={{ color: '#6C5CE7', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' }}>
              PREMIUM TOYS
            </Typography>
          </Box>
        </Box>

        {/* Desktop Category Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                sx={{
                  color: isActive ? '#6C5CE7' : '#2D3436',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem',
                  px: 2,
                  py: 1,
                  borderRadius: 3,
                  backgroundColor: isActive ? 'rgba(108, 92, 231, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(108, 92, 231, 0.06)',
                    color: '#6C5CE7',
                  },
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Box>

        {/* Search Bar */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            backgroundColor: '#F4F3FB',
            borderRadius: '24px',
            px: 2,
            py: 0.5,
            width: { sm: 200, md: 280, lg: 320 },
            border: '1px solid transparent',
            '&:focus-within': {
              borderColor: '#6C5CE7',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(108, 92, 231, 0.15)',
            },
          }}
        >
          <SearchIcon size={18} color="#636E72" />
          <InputBase
            placeholder="Search RC cars, dollhouses, STEM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
          />
        </Box>

        {/* Action Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Wishlist */}
          <IconButton onClick={() => (token ? navigate('/account?tab=wishlist') : toggleAuthModal(true, 'login'))} sx={{ color: '#2D3436' }}>
            <Heart size={22} />
          </IconButton>

          {/* Cart */}
          <IconButton onClick={() => toggleCartDrawer(true)} sx={{ color: '#2D3436' }}>
            <Badge badgeContent={cartCount} color="secondary" overlap="circular">
              <ShoppingBag size={22} />
            </Badge>
          </IconButton>

          {/* User Account Menu */}
          <IconButton onClick={handleUserClick} sx={{ color: '#2D3436', border: token ? '2px solid #6C5CE7' : 'none' }}>
            <UserIcon size={22} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseUserMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 3,
                minWidth: 200,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {user?.accountName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +91 {user?.mobile}
              </Typography>
            </Box>
            <Divider />

            {isAdmin && (
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/admin'); }}>
                <LayoutDashboard size={18} style={{ marginRight: 10, color: '#6C5CE7' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#6C5CE7' }}>
                  Admin Panel
                </Typography>
              </MenuItem>
            )}

            <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/account'); }}>
              <Package size={18} style={{ marginRight: 10 }} />
              My Orders & Profile
            </MenuItem>

            <MenuItem onClick={handleLogout} sx={{ color: '#D63031' }}>
              <LogOut size={18} style={{ marginRight: 10 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 280, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Sparkles size={24} color="#6C5CE7" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Little Wonder
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.path} disablePadding>
                <ListItemButton onClick={() => { setMobileMenuOpen(false); navigate(link.path); }}>
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};
