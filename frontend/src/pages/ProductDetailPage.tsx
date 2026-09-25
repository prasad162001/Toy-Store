import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Chip,
  Rating,
  Divider,
  Stack,
  Alert,
  TextField,
  Paper,
  IconButton,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Star, Plus, Minus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../services/graphql';
import {
  GET_PRODUCT_BY_SLUG_QUERY,
  ADD_TO_CART_MUTATION,
  TOGGLE_WISHLIST_MUTATION,
  GET_PRODUCT_REVIEWS_QUERY,
  CREATE_REVIEW_MUTATION,
} from '../graphql/queries';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

export const ProductDetailPage: React.FC = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sessionId, toggleCartDrawer, toggleAuthModal } = useCartStore();
  const { token } = useAuthStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['product', productSlug],
    queryFn: () => getGqlClient().request(GET_PRODUCT_BY_SLUG_QUERY, { slug: productSlug }),
    enabled: !!productSlug,
  });

  const product = (data as any)?.product;

  const { data: reviewsData } = useQuery({
    queryKey: ['productReviews', product?.id],
    queryFn: () => getGqlClient().request(GET_PRODUCT_REVIEWS_QUERY, { productId: product?.id }),
    enabled: !!product?.id,
  });

  const reviews = (reviewsData as any)?.productReviews || [];

  const addToCartMutation = useMutation({
    mutationFn: (qty: number) =>
      getGqlClient().request(ADD_TO_CART_MUTATION, { input: { productId: product?.id, quantity: qty, sessionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toggleCartDrawer(true);
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => getGqlClient().request(TOGGLE_WISHLIST_MUTATION, { productId: product?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: () =>
      getGqlClient().request(CREATE_REVIEW_MUTATION, {
        input: { productId: product?.id, rating, title: reviewTitle, comment },
      }),
    onSuccess: () => {
      setReviewSuccess('Thank you! Your review has been published.');
      setReviewTitle('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['productReviews', product?.id] });
    },
    onError: (err: any) => {
      setReviewError(err?.response?.errors?.[0]?.message || 'Only verified purchasers can submit a review.');
    },
  });

  if (isLoading || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h6">Loading product details...</Typography>
      </Container>
    );
  }

  const primaryImg = selectedImg || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1';
  const stock = product.inventory?.stockQuantity || 0;

  const handleBuyNow = () => {
    addToCartMutation.mutate(quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);
    if (!token) {
      toggleAuthModal(true, 'login');
      return;
    }
    createReviewMutation.mutate();
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 10 }}>
      <Grid container spacing={6}>
        {/* Left Column: Image Gallery */}
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={primaryImg}
            alt={product.name}
            sx={{
              width: '100%',
              height: { xs: 350, sm: 460 },
              objectFit: 'cover',
              borderRadius: 5,
              border: '1px solid rgba(226, 224, 240, 0.8)',
              boxShadow: '0 10px 30px rgba(108, 92, 231, 0.08)',
              mb: 2,
            }}
          />
          {product.images?.length > 1 && (
            <Stack direction="row" spacing={2}>
              {product.images.map((img: any) => (
                <Box
                  key={img.id}
                  component="img"
                  src={img.url}
                  onClick={() => setSelectedImg(img.url)}
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: 3,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: primaryImg === img.url ? '3px solid #6C5CE7' : '1px solid #E2E0F0',
                  }}
                />
              ))}
            </Stack>
          )}
        </Grid>

        {/* Right Column: Product Details & Actions */}
        <Grid item xs={12} md={6}>
          <Chip label={`${product.category?.name} Collection`} color="primary" size="small" sx={{ fontWeight: 700, mb: 1.5 }} />

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <Rating value={product.averageRating || 5} precision={0.5} readOnly />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {product.averageRating || 5.0} ({reviews.length} customer reviews)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#6C5CE7' }}>
              ₹{product.finalPrice}
            </Typography>
            {product.discountPercent > 0 && (
              <>
                <Typography variant="h5" sx={{ textDecoration: 'line-through', color: '#636E72' }}>
                  ₹{product.price}
                </Typography>
                <Chip label={`${product.discountPercent}% OFF`} color="secondary" sx={{ fontWeight: 700 }} />
              </>
            )}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
            {product.description}
          </Typography>

          {/* Specifications Table */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 4, background: '#FAF9FF', border: '1px solid #E2E0F0' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Recommended Age</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{product.recommendedAge}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Stock Availability</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: stock > 0 ? '#00B894' : '#D63031' }}>
                  {stock > 0 ? `In Stock (${stock} items)` : 'Out of Stock'}
                </Typography>
              </Grid>
              {product.specifications && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Specifications</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.specifications}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Quantity & CTA Buttons */}
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E0F0', borderRadius: 3, p: 0.5 }}>
                <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                  <Minus size={18} />
                </IconButton>
                <Typography variant="subtitle1" sx={{ px: 2, fontWeight: 800 }}>{quantity}</Typography>
                <IconButton onClick={() => setQuantity(Math.min(stock, quantity + 1))} disabled={quantity >= stock}>
                  <Plus size={18} />
                </IconButton>
              </Box>

              <IconButton
                onClick={() => (token ? wishlistMutation.mutate() : toggleAuthModal(true, 'login'))}
                sx={{ border: '1px solid #E2E0F0', borderRadius: 3, p: 1.5 }}
              >
                <Heart size={24} color="#FF7675" />
              </IconButton>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={stock === 0}
                onClick={() => addToCartMutation.mutate(quantity)}
                startIcon={<ShoppingBag size={20} />}
                sx={{ py: 1.6, fontSize: '1rem', background: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)' }}
              >
                Add to Cart
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                disabled={stock === 0}
                onClick={handleBuyNow}
                sx={{ py: 1.6, fontSize: '1rem', border: '2px solid #6C5CE7', color: '#6C5CE7', fontWeight: 700 }}
              >
                Buy Now
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Reviews & Ratings Section */}
      <Divider sx={{ my: 8 }} />

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
          Customer Reviews ({reviews.length})
        </Typography>

        <Grid container spacing={6}>
          {/* Review Form */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E0F0' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Write a Verified Review</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Note: Only customers who have purchased and received this toy can submit a review.
              </Typography>

              {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
              {reviewSuccess && <Alert severity="success" sx={{ mb: 2 }}>{reviewSuccess}</Alert>}

              <Box component="form" onSubmit={handleReviewSubmit}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Rating</Typography>
                    <Rating value={rating} onChange={(_, val) => setRating(val || 5)} size="large" />
                  </Box>

                  <TextField
                    label="Review Title"
                    placeholder="e.g. Best RC car ever!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    fullWidth
                  />

                  <TextField
                    label="Detailed Review"
                    placeholder="Tell other parents about your child's experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    multiline
                    rows={4}
                    required
                    fullWidth
                  />

                  <Button type="submit" variant="contained" size="large">
                    Submit Review
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>

          {/* Review List */}
          <Grid item xs={12} md={7}>
            {reviews.length === 0 ? (
              <Box sx={{ textAlignment: 'center', py: 6, background: '#FAF9FF', borderRadius: 4, p: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No reviews yet for this product</Typography>
                <Typography variant="body2" color="text.secondary">Be the first verified customer to leave a review!</Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {reviews.map((r: any) => (
                  <Paper key={r.id} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E0F0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.user?.accountName || 'Verified Customer'}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                    <Rating value={r.rating} readOnly size="small" sx={{ mb: 1 }} />
                    {r.title && <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{r.title}</Typography>}
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{r.comment}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
