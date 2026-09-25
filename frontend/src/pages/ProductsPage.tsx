import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Slider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Rating,
  Pagination,
  Drawer,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Filter, ShoppingBag, ArrowUpDown, X, Star } from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../services/graphql';
import { GET_PRODUCTS_QUERY, ADD_TO_CART_MUTATION } from '../graphql/queries';
import { useCartStore } from '../store/useCartStore';

export const ProductsPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sessionId, toggleCartDrawer } = useCartStore();

  const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Fetch Products with filters
  const { data, isLoading } = useQuery({
    queryKey: ['products', categorySlug, search, priceRange, selectedAge, inStockOnly, sortBy, page],
    queryFn: () =>
      getGqlClient().request(GET_PRODUCTS_QUERY, {
        filter: {
          categorySlug,
          search,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          ageRange: selectedAge || undefined,
          inStockOnly,
          sortBy,
          page,
          limit: 12,
        },
      }),
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      getGqlClient().request(ADD_TO_CART_MUTATION, { input: { productId, quantity: 1, sessionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toggleCartDrawer(true);
    },
  });

  const productsData = (data as any)?.products;
  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  const categoryTitle = categorySlug
    ? `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)} Toys`
    : 'All Products';

  const FilterSidebarContent = (
    <Box sx={{ width: 280, p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Filters</Typography>
        <Button size="small" onClick={() => { setPriceRange([0, 10000]); setSelectedAge(''); setInStockOnly(false); }}>
          Reset All
        </Button>
      </Box>

      {/* Category Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Category</Typography>
        <Stack spacing={1}>
          {[
            { label: 'All Toys', slug: '' },
            { label: 'Boys', slug: 'boys' },
            { label: 'Girls', slug: 'girls' },
            { label: 'Unisex & STEM', slug: 'unisex' },
          ].map((cat) => (
            <Button
              key={cat.slug}
              variant={categorySlug === cat.slug || (!categorySlug && !cat.slug) ? 'contained' : 'text'}
              onClick={() => navigate(cat.slug ? `/products/${cat.slug}` : '/products')}
              sx={{ justifyContent: 'flex-start', borderRadius: 3 }}
            >
              {cat.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Price Range Filter */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Price Range (₹{priceRange[0]} - ₹{priceRange[1]})
        </Typography>
        <Slider
          value={priceRange}
          onChange={(_, val) => setPriceRange(val as number[])}
          valueLabelDisplay="auto"
          min={0}
          max={10000}
          step={500}
          sx={{ color: '#6C5CE7' }}
        />
      </Box>

      {/* Age Group Filter */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Age Group</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {['2-5 years', '4-8 years', '6-10 years', '8+ years'].map((age) => (
            <Chip
              key={age}
              label={age}
              clickable
              color={selectedAge === age ? 'primary' : 'default'}
              onClick={() => setSelectedAge(selectedAge === age ? '' : age)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Box>

      {/* Availability Filter */}
      <Box sx={{ mb: 4 }}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} color="primary" />}
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>In-Stock Only</Typography>}
          />
        </FormGroup>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      {/* Header & Controls */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {categoryTitle}
          </Typography>

        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton sx={{ display: { xs: 'flex', md: 'none' } }} onClick={() => setFilterDrawerOpen(true)}>
            <Filter size={20} />
          </IconButton>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="newest">Newest Arrivals</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="popular">Best Sellers</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Grid container spacing={4}>
        {/* Desktop Filter Sidebar */}
        <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 90, p: 3, borderRadius: 4, border: '1px solid rgba(226, 224, 240, 0.8)', background: '#FFFFFF' }}>
            {FilterSidebarContent}
          </Box>
        </Grid>

        {/* Mobile Filter Drawer */}
        <Drawer anchor="left" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <IconButton onClick={() => setFilterDrawerOpen(false)}><X size={20} /></IconButton>
            </Box>
            {FilterSidebarContent}
          </Box>
        </Drawer>

        {/* Product Grid */}
        <Grid item xs={12} md={9}>
          {products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E0F0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No products found matching your criteria</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Try adjusting your price filter or search query</Typography>
              <Button variant="contained" onClick={() => { setPriceRange([0, 10000]); setSelectedAge(''); setInStockOnly(false); navigate('/products'); }}>
                Reset Filters
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {products.map((product: any) => (
                <Grid item xs={12} sm={6} lg={4} key={product.id}>
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

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                        <Rating value={product.averageRating || 5} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">({product.reviewCount || 10})</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
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
                          disabled={product.inventory?.stockQuantity === 0}
                          onClick={() => addToCartMutation.mutate(product.id)}
                          startIcon={<ShoppingBag size={16} />}
                        >
                          {product.inventory?.stockQuantity === 0 ? 'Out of Stock' : 'Add'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="large" />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
