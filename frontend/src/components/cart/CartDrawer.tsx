import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../../services/graphql';
import {
  GET_CART_QUERY,
  UPDATE_CART_ITEM_MUTATION,
  REMOVE_CART_ITEM_MUTATION,
} from '../../graphql/queries';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isCartDrawerOpen, toggleCartDrawer, sessionId } = useCartStore();
  const { token } = useAuthStore();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart', sessionId, token],
    queryFn: () => getGqlClient().request(GET_CART_QUERY, { sessionId }),
  });

  const cart = (cartData as any)?.cart;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const freeThreshold = cart?.freeDeliveryThreshold || 999;
  const progressPercent = Math.min((subtotal / freeThreshold) * 100, 100);
  const amountLeftForFreeDelivery = Math.max(freeThreshold - subtotal, 0);

  const updateMutation = useMutation({
    mutationFn: (vars: { cartItemId: string; quantity: number }) =>
      getGqlClient().request(UPDATE_CART_ITEM_MUTATION, { input: vars, sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cartItemId: string) =>
      getGqlClient().request(REMOVE_CART_ITEM_MUTATION, { cartItemId, sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const handleCheckout = () => {
    toggleCartDrawer(false);
    navigate('/checkout');
  };

  return (
    <Drawer anchor="right" open={isCartDrawerOpen} onClose={() => toggleCartDrawer(false)}>
      <Box sx={{ width: { xs: '100vw', sm: 400 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Drawer Header */}
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226, 224, 240, 0.8)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingBag size={22} color="#6C5CE7" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Shopping Cart ({cart?.totalItems || 0})
            </Typography>
          </Box>
          <IconButton onClick={() => toggleCartDrawer(false)} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Free Delivery Bar */}
        <Box sx={{ px: 3, py: 2, backgroundColor: '#FAF9FF', borderBottom: '1px solid rgba(226, 224, 240, 0.5)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Truck size={18} color="#6C5CE7" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {amountLeftForFreeDelivery === 0 ? (
                <span style={{ color: '#00B894' }}>🎉 Congratulations! You unlocked FREE Delivery!</span>
              ) : (
                <>Add ₹{amountLeftForFreeDelivery.toFixed(0)} more for <strong>FREE Delivery</strong></>
              )}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(108, 92, 231, 0.15)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: progressPercent === 100 ? '#00B894' : '#6C5CE7',
              },
            }}
          />
        </Box>

        {/* Cart Item List */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingBag size={64} color="#A29BFE" style={{ opacity: 0.5, marginBottom: 16 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Your cart is empty</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Explore our premium collection of toys for boys, girls, and unisex STEM learning!
              </Typography>
              <Button variant="contained" onClick={() => { toggleCartDrawer(false); navigate('/products'); }}>
                Start Shopping
              </Button>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {items.map((item: any) => (
                <Box key={item.id} sx={{ display: 'flex', gap: 2, p: 1.5, borderRadius: 3, border: '1px solid rgba(226, 224, 240, 0.8)', background: '#FFFFFF' }}>
                  <Box
                    component="img"
                    src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1'}
                    alt={item.product?.name}
                    sx={{ width: 75, height: 75, borderRadius: 2, objectFit: 'cover' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
                      {item.product?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#6C5CE7' }}>
                      ₹{item.product?.finalPrice} <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#636E72', marginLeft: 4 }}>₹{item.product?.price}</span>
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E0F0', borderRadius: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => updateMutation.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </IconButton>
                        <Typography variant="body2" sx={{ px: 1.5, fontWeight: 700 }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateMutation.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                        >
                          <Plus size={14} />
                        </IconButton>
                      </Box>

                      <IconButton size="small" color="error" onClick={() => removeMutation.mutate(item.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer Summary & Checkout Button */}
        {items.length > 0 && (
          <Box sx={{ p: 2.5, borderTop: '1px solid rgba(226, 224, 240, 0.8)', backgroundColor: '#FFFFFF' }}>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Delivery Charge</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: cart?.deliveryFee === 0 ? '#00B894' : 'inherit' }}>
                  {cart?.deliveryFee === 0 ? 'FREE' : `₹${cart?.deliveryFee}`}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Estimated Total</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#6C5CE7' }}>₹{cart?.grandTotal?.toFixed(2)}</Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCheckout}
              endIcon={<ArrowRight size={20} />}
              sx={{ py: 1.5, background: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)' }}
            >
              Proceed to Checkout
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
