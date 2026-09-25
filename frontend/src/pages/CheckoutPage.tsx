import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  TextField,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Truck, CreditCard, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../services/graphql';
import {
  GET_CART_QUERY,
  GET_MY_ADDRESSES_QUERY,
  CREATE_ADDRESS_MUTATION,
  VALIDATE_COUPON_QUERY,
  CREATE_ORDER_MUTATION,
} from '../graphql/queries';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuthStore();
  const { sessionId, toggleAuthModal } = useCartStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // New Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [fullName, setFullName] = useState(user?.accountName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560001');

  const [error, setError] = useState<string | null>(null);

  // Fetch Cart
  const { data: cartData } = useQuery({
    queryKey: ['cart', sessionId, token],
    queryFn: () => getGqlClient().request(GET_CART_QUERY, { sessionId }),
  });

  // Fetch Addresses
  const { data: addressData } = useQuery({
    queryKey: ['myAddresses', token],
    queryFn: () => getGqlClient().request(GET_MY_ADDRESSES_QUERY),
    enabled: !!token,
  });

  const cart = (cartData as any)?.cart;
  const items = cart?.items || [];
  const addresses = (addressData as any)?.myAddresses || [];

  if (addresses.length > 0 && !selectedAddressId) {
    setSelectedAddressId(addresses[0].id);
  }

  // Address Mutation
  const createAddressMutation = useMutation({
    mutationFn: (input: any) => getGqlClient().request(CREATE_ADDRESS_MUTATION, { input }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['myAddresses'] });
      setSelectedAddressId(res.createAddress.id);
      setShowAddressForm(false);
    },
    onError: (err: any) => {
      setError(err?.response?.errors?.[0]?.message || 'Failed to save address');
    },
  });

  // Coupon Mutation
  const validateCouponMutation = useMutation({
    mutationFn: (code: string) =>
      getGqlClient().request(VALIDATE_COUPON_QUERY, { code, subtotal: cart?.subtotal || 0 }),
    onSuccess: (res: any) => {
      const val = res.validateCoupon;
      if (val.isValid) {
        setAppliedCoupon(couponCode.toUpperCase());
        setCouponDiscount(val.discountAmount || 0);
        setError(null);
      } else {
        setError(val.message);
      }
    },
  });

  // Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: (input: any) => getGqlClient().request(CREATE_ORDER_MUTATION, { input }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      navigate(`/account?orderSuccess=${res.createOrder.orderNumber}`);
    },
    onError: (err: any) => {
      setError(err?.response?.errors?.[0]?.message || 'Failed to place order');
    },
  });

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Paper sx={{ p: 5, borderRadius: 5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Authentication Required</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Please log in or register with your mobile number to complete checkout and place your order.
          </Typography>
          <Button variant="contained" size="large" onClick={() => toggleAuthModal(true, 'login')}>
            Log In / Register
          </Button>
        </Paper>
      </Container>
    );
  }

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const existingAddress = addresses.find(
      (address: any) =>
        address.fullName === fullName &&
        address.mobile === mobile &&
        address.street === street &&
        address.city === city &&
        address.state === state &&
        address.pincode === pincode,
    );
    if (existingAddress) {
      setSelectedAddressId(existingAddress.id);
      setShowAddressForm(false);
      return;
    }
    createAddressMutation.mutate({ fullName, mobile, street, city, state, pincode, isDefault: true });
  };

  const handlePlaceOrder = () => {
    setError(null);
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      return;
    }
    createOrderMutation.mutate({
      addressId: selectedAddressId,
      paymentMethod,
      couponCode: appliedCoupon || undefined,
      sessionId,
    });
  };

  const finalSubtotal = cart?.subtotal || 0;
  const deliveryFee = cart?.deliveryFee || 0;
  const grandTotal = Math.max(0, finalSubtotal - couponDiscount + deliveryFee);

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Secure Checkout
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Left Column: Address & Payment */}
        <Grid item xs={12} md={7}>
          <Stack spacing={4}>
            {/* Step 1: Delivery Address */}
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E0F0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>1. Delivery Address</Typography>
                <Button size="small" onClick={() => setShowAddressForm(!showAddressForm)}>
                  {showAddressForm ? 'Cancel' : '+ Add New Address'}
                </Button>
              </Box>

              {showAddressForm ? (
                <Box component="form" onSubmit={handleAddAddressSubmit}>
                  <Grid container spacing= {2}>
                    <Grid item xs={6}><TextField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth /></Grid>
                    <Grid item xs={6}><TextField label="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} required fullWidth /></Grid>
                    <Grid item xs={12}><TextField label="Street Address" value={street} onChange={(e) => setStreet(e.target.value)} required fullWidth /></Grid>
                    <Grid item xs={4}><TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} required fullWidth /></Grid>
                    <Grid item xs={4}><TextField label="State" value={state} onChange={(e) => setState(e.target.value)} required fullWidth /></Grid>
                    <Grid item xs={4}><TextField label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required fullWidth /></Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" disabled={createAddressMutation.isPending}>
                        Save & Use Address
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                  {addresses.map((addr: any) => (
                    <Paper key={addr.id} sx={{ p: 2, mb: 1.5, border: selectedAddressId === addr.id ? '2px solid #6C5CE7' : '1px solid #E2E0F0', borderRadius: 3 }}>
                      <FormControlLabel
                        value={addr.id}
                        control={<Radio color="primary" />}
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{addr.fullName} (+91 {addr.mobile})</Typography>
                            <Typography variant="body2" color="text.secondary">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              )}
            </Paper>

            {/* Step 2: Payment Method */}
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E0F0' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>2. Payment Method</Typography>
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <Grid container spacing={2}>
                  {[
                    { id: 'UPI', label: 'UPI / Google Pay / PhonePe', desc: 'Instant 100% secure payment' },
                    { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay' },
                    { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay cash upon delivery' },
                  ].map((pm) => (
                    <Grid item xs={12} key={pm.id}>
                      <Paper sx={{ p: 2, border: paymentMethod === pm.id ? '2px solid #6C5CE7' : '1px solid #E2E0F0', borderRadius: 3 }}>
                        <FormControlLabel
                          value={pm.id}
                          control={<Radio color="primary" />}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pm.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{pm.desc}</Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Order Summary & Placement */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E0F0', background: '#FFFFFF', position: 'sticky', top: 90 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Order Summary</Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              {items.map((item: any) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, pr: 2 }}>
                    {item.product?.name} x {item.quantity}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>₹{item.itemTotal}</Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Coupon Box */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                size="small"
                placeholder="Coupon (e.g. WELCOME10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                fullWidth
              />
              <Button variant="outlined" onClick={() => validateCouponMutation.mutate(couponCode)} disabled={!couponCode}>
                Apply
              </Button>
            </Box>

            {appliedCoupon && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                Coupon <strong>{appliedCoupon}</strong> Applied! Discount: ₹{couponDiscount}
              </Alert>
            )}

            <Stack spacing={1.5} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>₹{finalSubtotal}</Typography>
              </Box>
              {couponDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#00B894' }}>
                  <Typography variant="body2">Coupon Discount</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>-₹{couponDiscount}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: deliveryFee === 0 ? '#00B894' : 'inherit' }}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Grand Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C5CE7' }}>₹{grandTotal.toFixed(2)}</Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={createOrderMutation.isPending || items.length === 0}
              onClick={handlePlaceOrder}
              sx={{ py: 1.8, fontSize: '1.05rem', background: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)' }}
            >
              {createOrderMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Place Order'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
