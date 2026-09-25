import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Stack,
  Rating,
  IconButton,
} from '@mui/material';
import { Sparkles, ArrowRight, ShieldCheck, Star, Heart, ShoppingBag, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../services/graphql';
import {
  GET_BANNERS_QUERY,
  GET_CATEGORIES_QUERY,
  GET_PRODUCTS_QUERY,
  ADD_TO_CART_MUTATION,
} from '../graphql/queries';
import { useCartStore } from '../store/useCartStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sessionId, toggleCartDrawer } = useCartStore();

  // Banners
  const { data: bannerData } = useQuery({
    queryKey: ['banners'],
    queryFn: () => getGqlClient().request(GET_BANNERS_QUERY),
  });

  // Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getGqlClient().request(GET_CATEGORIES_QUERY),
  });

  // Featured Products
  const { data: featuredData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => getGqlClient().request(GET_PRODUCTS_QUERY, { filter: { isFeatured: true, limit: 4 } }),
  });

  // Best Sellers
  const { data: bestSellerData } = useQuery({
    queryKey: ['products', 'bestseller'],
    queryFn: () => getGqlClient().request(GET_PRODUCTS_QUERY, { filter: { isBestSeller: true, limit: 4 } }),
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      getGqlClient().request(ADD_TO_CART_MUTATION, { input: { productId, quantity: 1, sessionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toggleCartDrawer(true);
    },
  });

  const banners = (bannerData as any)?.banners || [];
  const categories = (catData as any)?.categories || [];
  const featuredProducts = (featuredData as any)?.products?.products || [];
  const bestSellers = (bestSellerData as any)?.products?.products || [];

  const mainBanner = banners[0] || {
    title: 'Magic & Wonder for Every Childhood',
    subtitle: 'Discover safe, non-toxic, and educational toys designed to inspire young minds.',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80',
  };

  return (
    <Box sx={{ pt: 2 }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Box
          sx={{
            borderRadius: { xs: 4, md: 6 },
            overflow: 'hidden',
            position: 'relative',
            minHeight: { xs: 360, md: 460 },
            backgroundImage: `linear-gradient(90deg, rgba(30, 30, 44, 0.85) 0%, rgba(30, 30, 44, 0.4) 100%), url(${mainBanner.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            p: { xs: 4, md: 8 },
            color: '#FFFFFF',
            boxShadow: '0 20px 40px rgba(108, 92, 231, 0.15)',
          }}
        >
          <Box sx={{ maxWidth: 580 }}>
            <Chip
              icon={<Sparkles size={16} color="#FFEAA7" />}
              label="100% NON-TOXIC & BIS CERTIFIED"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFEAA7', fontWeight: 700, mb: 2, backdropFilter: 'blur(10px)' }}
            />
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.1 }}>
              {mainBanner.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 4, fontSize: { xs: '1rem', md: '1.15rem' } }}>
              {mainBanner.subtitle}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/products"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #FF7675 100%)',
                  px: 4,
                  py: 1.6,
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                Shop All Collection
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>

      {/* 3 PRIMARY CATEGORY CARDS (BOYS, GIRLS, UNISEX) */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Explore By Category
          </Typography>

        </Box>

        <Grid container spacing={3}>
          {categories.map((cat: any) => (
            <Grid item xs={12} sm={4} key={cat.id}>
              <Card
                component={Link}
                to={`/products/${cat.slug}`}
                sx={{
                  textDecoration: 'none',
                  position: 'relative',
                  height: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: 3,
                  color: '#FFFFFF',
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,0.85) 100%), url(${cat.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 5,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, boxShadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(108, 92, 231, 0.25)',
                  },
                }}
              >
                <Chip
                  label={`${cat.name} Toys`}
                  sx={{ position: 'absolute', top: 16, left: 16, backgroundColor: '#6C5CE7', color: '#FFFFFF', fontWeight: 700 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {cat.name} Collection
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                  {cat.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#FFEAA7' }}>
                  Explore Category <ArrowRight size={18} />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FEATURED TOYS SECTION */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Featured Magic Toys
            </Typography>
            <Typography variant="body2" color="text.secondary">Hand-picked premium toys with highest customer ratings</Typography>
          </Box>
          <Button component={Link} to="/products" endIcon={<ArrowRight size={18} />} sx={{ fontWeight: 700 }}>
            View All
          </Button>
        </Box>

        <Grid container spacing={3}>
          {featuredProducts.map((product: any) => (
            <Grid item xs={12} sm={6} md={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {product.discountPercent > 0 && (
                  <Chip
                    label={`${product.discountPercent}% OFF`}
                    size="small"
                    sx={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#FF7675', color: '#FFFFFF', fontWeight: 700, zIndex: 1 }}
                  />
                )}
                <CardMedia
                  component="img"
                  image={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1'}
                  alt={product.name}
                  sx={{ height: 220, objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => navigate(`/product/${product.slug}`)}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ color: '#6C5CE7', fontWeight: 700, textTransform: 'uppercase' }}>
                    {product.category?.name} • {product.recommendedAge}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 1, cursor: 'pointer', flex: 1, '&:hover': { color: '#6C5CE7' } }}
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    {product.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Rating value={product.averageRating || 5} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">({product.reviewCount || 12})</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#6C5CE7' }}>
                        ₹{product.finalPrice}
                      </Typography>
                      {product.discountPercent > 0 && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#636E72' }}>
                          ₹{product.price}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => addToCartMutation.mutate(product.id)}
                      startIcon={<ShoppingBag size={16} />}
                      sx={{ borderRadius: 3 }}
                    >
                      Add
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
