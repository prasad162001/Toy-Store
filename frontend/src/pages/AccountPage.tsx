import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { Package, Heart, MapPin, User, LogOut, CheckCircle2, Clock } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../services/graphql';
import {
  GET_MY_ORDERS_QUERY,
  GET_MY_ADDRESSES_QUERY,
  GET_MY_WISHLIST_QUERY,
  ADD_TO_CART_MUTATION,
} from '../graphql/queries';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export const AccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { sessionId, toggleCartDrawer } = useCartStore();

  const initialTab = searchParams.get('tab') === 'wishlist' ? 1 : searchParams.get('tab') === 'addresses' ? 2 : 0;
  const [tabIndex, setTabIndex] = useState(initialTab);

  const orderSuccessNumber = searchParams.get('orderSuccess');

  // Fetch Orders
  const { data: ordersData } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => getGqlClient().request(GET_MY_ORDERS_QUERY),
  });

  // Fetch Addresses
  const { data: addressData } = useQuery({
    queryKey: ['myAddresses'],
    queryFn: () => getGqlClient().request(GET_MY_ADDRESSES_QUERY),
  });

  // Fetch Wishlist
  const { data: wishlistData } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => getGqlClient().request(GET_MY_WISHLIST_QUERY),
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      getGqlClient().request(ADD_TO_CART_MUTATION, { input: { productId, quantity: 1, sessionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toggleCartDrawer(true);
    },
  });

  const orders = (ordersData as any)?.myOrders || [];
  const addresses = (addressData as any)?.myAddresses || [];
  const wishlist = (wishlistData as any)?.myWishlist || [];

  const orderSteps = ['ORDER_PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 10 }}>
      {orderSuccessNumber && (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #00B894 0%, #009473 100%)', color: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle2 size={40} color="#FFFFFF" />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Order #{orderSuccessNumber} Confirmed!</Typography>
              <Typography variant="body2">Thank you for shopping with Little Wonder Toys. Track your order status below.</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Grid container spacing={4}>
        {/* User Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E0F0' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: '#6C5CE7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  fontSize: '1.8rem',
                  fontWeight: 800,
                }}
              >
                {user?.accountName?.charAt(0).toUpperCase()}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{user?.accountName}</Typography>
              <Typography variant="caption" color="text.secondary">+91 {user?.mobile}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Tabs orientation="vertical" value={tabIndex} onChange={(_, val) => setTabIndex(val)} sx={{ '& .MuiTab-root': { alignItems: 'flex-start', fontWeight: 700 } }}>
              <Tab icon={<Package size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="My Orders" />
              <Tab icon={<Heart size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="My Wishlist" />
              <Tab icon={<MapPin size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Saved Addresses" />
            </Tabs>
            <Divider sx={{ my: 2 }} />
            <Button color="error" fullWidth startIcon={<LogOut size={18} />} onClick={() => { logout(); navigate('/'); }}>
              Logout
            </Button>
          </Paper>
        </Grid>

        {/* Tab Content */}
        <Grid item xs={12} md={9}>
          {/* TAB 0: MY ORDERS */}
          {tabIndex === 0 && (
            <Stack spacing={3}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>My Orders ({orders.length})</Typography>
              {orders.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
                  <Package size={48} color="#A29BFE" style={{ marginBottom: 12 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No orders placed yet</Typography>
                </Paper>
              ) : (
                orders.map((ord: any) => {
                  const currentStepIdx = orderSteps.indexOf(ord.status);
                  return (
                    <Paper key={ord.id} sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E0F0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Order #{ord.orderNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">Placed on {new Date(ord.createdAt).toLocaleDateString()}</Typography>
                        </Box>
                        <Chip label={ord.status.replace(/_/g, ' ')} color="primary" sx={{ fontWeight: 700 }} />
                      </Box>

                      {/* Timeline Stepper */}
                      <Box sx={{ py: 3, my: 2, background: '#FAF9FF', borderRadius: 3, px: 2 }}>
                        <Stepper activeStep={currentStepIdx >= 0 ? currentStepIdx : 0} alternativeLabel>
                          {orderSteps.map((stepLabel) => (
                            <Step key={stepLabel}>
                              <StepLabel>{stepLabel.replace(/_/g, ' ')}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>

                      {/* Order Items */}
                      <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {ord.items?.map((item: any) => (
                          <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.productName} x {item.quantity}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>₹{item.totalPrice}</Typography>
                          </Box>
                        ))}
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Delivery to: {ord.address?.fullName}, {ord.address?.city}</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6C5CE7' }}>Grand Total: ₹{ord.grandTotal}</Typography>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Stack>
          )}

          {/* TAB 1: WISHLIST */}
          {tabIndex === 1 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>My Wishlist ({wishlist.length})</Typography>
              <Grid container spacing={3}>
                {wishlist.map((item: any) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ borderRadius: 4 }}>
                      <CardMedia component="img" height="180" image={item.product?.images?.[0]?.url} />
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{item.product?.name}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#6C5CE7', mb: 2 }}>₹{item.product?.finalPrice}</Typography>
                        <Button variant="contained" fullWidth size="small" onClick={() => addToCartMutation.mutate(item.productId)}>
                          Move to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* TAB 2: ADDRESSES */}
          {tabIndex === 2 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Saved Addresses ({addresses.length})</Typography>
              <Grid container spacing={3}>
                {addresses.map((addr: any) => (
                  <Grid item xs={12} sm={6} key={addr.id}>
                    <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E0F0' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{addr.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                        {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6C5CE7' }}>Mobile: +91 {addr.mobile}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
