import React, { useRef, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Alert,
} from '@mui/material';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Image as ImageIcon,
  Users,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGqlClient } from '../services/graphql';
import { useAuthStore } from '../store/useAuthStore';
import {
  ADMIN_METRICS_QUERY,
  GET_PRODUCTS_QUERY,
  ADMIN_ORDERS_QUERY,
  UPDATE_ORDER_STATUS_MUTATION,
  UPDATE_ORDER_MUTATION,
  UPDATE_STOCK_MUTATION,
  ADMIN_USERS_QUERY,
  ADMIN_AUDIT_LOGS_QUERY,
  GET_CATEGORIES_QUERY,
  CREATE_PRODUCT_MUTATION,
  UPDATE_PRODUCT_MUTATION,
  DELETE_PRODUCT_IMAGE_MUTATION,
  ADMIN_COUPONS_QUERY,
  DELETE_COUPON_MUTATION,
  ADMIN_BANNERS_QUERY,
  CREATE_BANNER_MUTATION,
  UPDATE_BANNER_MUTATION,
  DELETE_BANNER_MUTATION,
} from '../graphql/queries';
import { uploadBannerImage, uploadProductImages } from '../services/graphql';
import { ReportsPanel } from '../components/admin/ReportsPanel';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();
  const roles = user?.roles || [];
  const isStaffOnly = roles.includes('STAFF') && !roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN');
  const canManageUsers = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  const canManageProducts = canManageUsers;
  const [activeTab, setActiveTab] = useState(0);
  const reportsRef = useRef<HTMLDivElement>(null);

  const openReports = () => reportsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogMode, setProductDialogMode] = useState<'create' | 'edit'>('create');
  const [productForm, setProductForm] = useState<any>({
    id: '', name: '', description: '', specifications: '', price: 0, discountPercent: 0,
    recommendedAge: '', categoryId: '', initialStock: 10, imageUrls: '', isFeatured: false,
    isNewArrival: false, isBestSeller: false, isActive: true,
  });
  const [originalProductForm, setOriginalProductForm] = useState<any>(productForm);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerMediaType, setBannerMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerOrder, setBannerOrder] = useState(0);
  const [bannerActive, setBannerActive] = useState(true);

  // Stock dialog state
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newStockVal, setNewStockVal] = useState(10);

  // Status Dialog State
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newStatusVal, setNewStatusVal] = useState('CONFIRMED');
  const [orderAddressId, setOrderAddressId] = useState('');

  // Queries
  const { data: metricsData } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: () => getGqlClient().request(ADMIN_METRICS_QUERY),
    enabled: canManageUsers,
  });
  const { data: productsData } = useQuery({ queryKey: ['adminProducts'], queryFn: () => getGqlClient().request(GET_PRODUCTS_QUERY, { filter: { limit: 50 } }) });
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getGqlClient().request(GET_CATEGORIES_QUERY),
    enabled: canManageProducts,
  });
  const { data: ordersData } = useQuery({ queryKey: ['adminOrders'], queryFn: () => getGqlClient().request(ADMIN_ORDERS_QUERY) });
  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getGqlClient().request(ADMIN_USERS_QUERY),
    enabled: canManageUsers,
  });
  const { data: auditData } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => getGqlClient().request(ADMIN_AUDIT_LOGS_QUERY),
    enabled: roles.includes('SUPER_ADMIN') || roles.includes('ADMIN'),
  });
  const { data: couponsData } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: () => getGqlClient().request(ADMIN_COUPONS_QUERY),
    enabled: canManageUsers,
  });
  const { data: bannersData } = useQuery({
    queryKey: ['adminBanners'],
    queryFn: () => getGqlClient().request(ADMIN_BANNERS_QUERY),
    enabled: canManageUsers,
  });

  // Mutations
  const updateStockMutation = useMutation({
    mutationFn: (vars: any) => getGqlClient().request(UPDATE_STOCK_MUTATION, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      setStockDialogOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: any) => getGqlClient().request(UPDATE_ORDER_STATUS_MUTATION, { input: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      setStatusDialogOpen(false);
    },
  });
  const updateOrderMutation = useMutation({
    mutationFn: (input: any) => getGqlClient().request(UPDATE_ORDER_MUTATION, { input }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminOrders'] }); queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] }); setStatusDialogOpen(false); },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => getGqlClient().request(DELETE_COUPON_MUTATION, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCoupons'] }),
  });

  const createBannerMutation = useMutation({
    mutationFn: (variables: any) => {
      return getGqlClient().request(CREATE_BANNER_MUTATION, variables);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminBanners'] }); setBannerTitle(''); setBannerSubtitle(''); setBannerFile(null); },
  });
  const bannerMutation = useMutation({
    mutationFn: (variables: any) => getGqlClient().request(UPDATE_BANNER_MUTATION, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminBanners'] }),
  });
  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => getGqlClient().request(DELETE_BANNER_MUTATION, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminBanners'] }),
  });

  const openCreateBanner = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerMediaType('IMAGE');
    setBannerOrder(banners.length);
    setBannerActive(true);
    setBannerFile(null);
    setBannerDialogOpen(true);
  };

  const openEditBanner = (banner: any) => {
    setEditingBannerId(banner.id);
    setBannerTitle(banner.title);
    setBannerSubtitle(banner.subtitle || '');
    setBannerMediaType(banner.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE');
    setBannerOrder(banner.displayOrder);
    setBannerActive(banner.isActive);
    setBannerFile(null);
    setBannerDialogOpen(true);
  };

  const handleBannerFile = (file: File | null) => {
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = bannerMediaType === 'IMAGE' ? ['.jpg', '.jpeg', '.png', '.heic', '.heif'] : ['.mp4', '.webm'];
    if (file.size > 10 * 1024 * 1024 || !allowed.includes(extension)) {
      window.alert(`Choose a valid ${bannerMediaType === 'IMAGE' ? 'JPG, JPEG, PNG, HEIC or HEIF image' : 'MP4 or WebM video'} under 10 MB.`);
      return;
    }
    setBannerFile(file);
  };

  const saveBanner = async () => {
    if (!token || !bannerTitle.trim()) return;
    let imageUrl: string | undefined;
    let mediaType: string | undefined;
    if (bannerFile) {
      const uploaded = await uploadBannerImage(bannerFile, token);
      imageUrl = uploaded.url;
      mediaType = uploaded.mediaType;
    }
    if (editingBannerId) {
      bannerMutation.mutate({ id: editingBannerId, title: bannerTitle.trim(), subtitle: bannerSubtitle || undefined, imageUrl, mediaType: mediaType || bannerMediaType, displayOrder: bannerOrder, isActive: bannerActive });
    } else if (imageUrl) {
      createBannerMutation.mutate({ title: bannerTitle.trim(), subtitle: bannerSubtitle || undefined, imageUrl, mediaType });
    }
    setBannerDialogOpen(false);
  };

  const metrics = (metricsData as any)?.adminMetrics;
  const products = (productsData as any)?.products?.products || [];
  const orders = (ordersData as any)?.adminOrders || [];
  const users = (usersData as any)?.adminUsers || [];
  const auditLogs = (auditData as any)?.adminAuditLogs || [];
  const coupons = (couponsData as any)?.adminCoupons || [];
  const banners = (bannersData as any)?.adminBanners || [];
  const categories = (categoriesData as any)?.categories || [];

  const productMutation = useMutation({
    mutationFn: (vars: any) => getGqlClient().request(productDialogMode === 'create' ? CREATE_PRODUCT_MUTATION : UPDATE_PRODUCT_MUTATION, { input: vars }),
    onSuccess: async (response: any) => {
      const productId = response?.createProduct?.id || response?.updateProduct?.id;
      if (productId && token) {
        await Promise.all(removedImageIds.map((imageId) => getGqlClient().request(DELETE_PRODUCT_IMAGE_MUTATION, { imageId })));
        if (selectedImageFiles.length > 0) await uploadProductImages(productId, selectedImageFiles, token);
      }
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      setProductDialogOpen(false);
      setSelectedImageFiles([]);
      setRemovedImageIds([]);
    },
  });

  const openCreateProduct = () => {
    setProductDialogMode('create');
    const nextForm = { id: '', name: '', description: '', specifications: '', price: 0, discountPercent: 0, recommendedAge: '', categoryId: categories[0]?.id || '', initialStock: 10, imageUrls: '', isFeatured: false, isNewArrival: false, isBestSeller: false, isActive: true };
    setProductForm(nextForm);
    setOriginalProductForm(nextForm);
    setProductDialogOpen(true);
    setSelectedImageFiles([]);
    setRemovedImageIds([]);
  };

  const openEditProduct = (product: any) => {
    setProductDialogMode('edit');
    const nextForm = { ...product, imageUrls: product.images?.map((image: any) => image.url).join(', ') || '' };
    setProductForm(nextForm);
    setOriginalProductForm(nextForm);
    setProductDialogOpen(true);
    setSelectedImageFiles([]);
    setRemovedImageIds([]);
  };

  const handleProductSave = () => {
    if (productDialogMode === 'create') {
      const { name, description, specifications, price, discountPercent, recommendedAge, categoryId, initialStock, isFeatured, isNewArrival, isBestSeller } = productForm;
      productMutation.mutate({
        name, description, specifications, price, discountPercent, recommendedAge, categoryId, initialStock, isFeatured, isNewArrival, isBestSeller,
        imageUrls: [],
      });
    } else {
      const { id, name, description, specifications, price, discountPercent, recommendedAge, categoryId, isFeatured, isNewArrival, isBestSeller, isActive } = productForm;
      productMutation.mutate({ id, name, description, specifications, price, discountPercent, recommendedAge, categoryId, isFeatured, isNewArrival, isBestSeller, isActive });
    }
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowed = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif']);
    const valid = files.filter((file) => allowed.has(file.type) && file.size <= 10 * 1024 * 1024);
    setSelectedImageFiles((current) => [...current, ...valid].slice(0, 10));
    event.target.value = '';
  };

  const productFormValid = Boolean(
    productForm.name && productForm.description && productForm.recommendedAge && productForm.categoryId &&
    Number.isFinite(Number(productForm.price)) && Number(productForm.price) >= 0 &&
    Number.isFinite(Number(productForm.discountPercent)) && Number(productForm.discountPercent) >= 0 && Number(productForm.discountPercent) <= 100,
  );
  const productFormChanged = productDialogMode === 'create' || JSON.stringify(productForm) !== JSON.stringify(originalProductForm) || selectedImageFiles.length > 0 || removedImageIds.length > 0;

  return (
    <Container maxWidth="xl" sx={{ pt: 4, pb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Admin & Store Operations Dashboard</Typography>
        {canManageProducts && (
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={openCreateProduct}>
            Add Product
          </Button>
        )}

      </Box>

      {/* Admin Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 4, border: '1px solid #E2E0F0' }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<LayoutDashboard size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Metrics Overview" />
          <Tab icon={<Package size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Product Catalog" />
          <Tab icon={<Boxes size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Inventory & Stock" />
          <Tab icon={<ShoppingBag size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Order Fulfillment" />
          <Tab icon={<Users size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Customer Accounts" />
          <Tab icon={<FileText size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Audit Trail Logs" />
          {canManageUsers && <Tab icon={<FileText size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Coupons" />}
          {canManageUsers && <Tab icon={<ImageIcon size={18} style={{ marginRight: 8 }} />} iconPosition="start" label="Hero Banners" />}
        </Tabs>
      </Paper>

      {/* TAB 0: OVERVIEW METRICS */}
      {activeTab === 0 && (
        isStaffOnly ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Staff access is limited to inventory adjustments and allowed order-status transitions. Metrics, customers, and audit logs require Admin or Super Admin.
          </Alert>
        ) : (
        <Stack spacing={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper onClick={openReports} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Revenue</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>₹{metrics?.totalRevenue?.toFixed(0) || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper onClick={() => setActiveTab(3)} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, #FF7675 0%, #D63031 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Orders</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{metrics?.totalOrders || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper onClick={() => setActiveTab(1)} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, #00B894 0%, #009473 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Active Products</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{metrics?.totalProducts || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper onClick={() => setActiveTab(4)} sx={{ p: 3, borderRadius: 4, cursor: 'pointer', background: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Registered Users</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{metrics?.totalUsers || 0}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Low Stock Warning */}
          {metrics?.lowStockProducts?.length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              <strong>Low Stock Alert:</strong> {metrics.lowStockProducts.length} items are running low on stock. Check Inventory tab.
            </Alert>
          )}
        </Stack>
        )
      )}

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 1 && (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #E2E0F0' }}>
          <Table>
            <TableHead sx={{ background: '#FAF9FF' }}>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Final Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{p.name}</TableCell>
                  <TableCell>{p.category?.name}</TableCell>
                  <TableCell>₹{p.price}</TableCell>
                  <TableCell>{p.discountPercent}%</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#6C5CE7' }}>₹{p.finalPrice}</TableCell>
                  <TableCell>
                    <Chip label={p.inventory?.stockQuantity} color={p.inventory?.stockQuantity <= 5 ? 'error' : 'success'} size="small" />
                  </TableCell>
                  <TableCell>
                    {canManageProducts && (
                      <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => openEditProduct(p)}>
                        Edit
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => { setSelectedProductId(p.id); setNewStockVal(p.inventory?.stockQuantity || 10); setStockDialogOpen(true); }}
                    >
                      Update Stock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 3: ORDER FULFILLMENT */}
      {activeTab === 3 && (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #E2E0F0' }}>
          <Table>
            <TableHead sx={{ background: '#FAF9FF' }}>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell sx={{ fontWeight: 700 }}>#{o.orderNumber}</TableCell>
                  <TableCell>{o.address?.fullName}<br /><Typography variant="caption">{o.address?.mobile}</Typography></TableCell>
                  <TableCell>{o.items?.map((i: any) => `${i.productName} (${i.quantity})`).join(', ')}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#6C5CE7' }}>₹{o.grandTotal}</TableCell>
                  <TableCell><Chip label={o.status} color="primary" size="small" /></TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" onClick={() => { setSelectedOrderId(o.id); setNewStatusVal(o.status); setOrderAddressId(o.addressId || ''); setStatusDialogOpen(true); }}>
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 4: USERS LIST */}
      {activeTab === 4 && (
        isStaffOnly ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>Customer management requires Admin or Super Admin.</Alert>
        ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #E2E0F0' }}>
          <Table>
            <TableHead sx={{ background: '#FAF9FF' }}>
              <TableRow>
                <TableCell>Account Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{u.accountName}</TableCell>
                  <TableCell>+91 {u.mobile}</TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell>{u.roles?.map((r: string) => <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 5 && (
        isStaffOnly ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>Audit logs require Admin or Super Admin.</Alert>
        ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #E2E0F0' }}>
          <Table>
            <TableHead sx={{ background: '#FAF9FF' }}>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell><Chip label={log.action} size="small" color="secondary" /></TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell>{log.actor?.accountName} ({log.actor?.mobile})</TableCell>
                  <TableCell>{log.metadata}</TableCell>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )
      )}

      {activeTab === 6 && canManageUsers && (
        <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #E2E0F0' }}>
          <Table>
            <TableHead sx={{ background: '#FAF9FF' }}>
              <TableRow><TableCell>Code</TableCell><TableCell>Discount</TableCell><TableCell>Minimum Order</TableCell><TableCell>Expires</TableCell><TableCell>Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((coupon: any) => (
                <TableRow key={coupon.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{coupon.code}</TableCell>
                  <TableCell>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountVal}%` : `₹${coupon.discountVal}`}</TableCell>
                  <TableCell>₹{coupon.minOrderVal}</TableCell>
                  <TableCell>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No expiry'}</TableCell>
                  <TableCell><Button color="error" size="small" onClick={() => window.confirm(`Delete coupon ${coupon.code}?`) && deleteCouponMutation.mutate(coupon.id)}>Delete</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!coupons.length && <Alert sx={{ m: 2 }} severity="info">No coupons found.</Alert>}
        </TableContainer>
      )}

      {activeTab === 7 && canManageUsers && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E0F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Hero Banners</Typography>
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={openCreateBanner}>Add Hero Banner</Button>
          </Paper>
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #E2E0F0' }}>
            <Table><TableHead><TableRow><TableCell>Preview</TableCell><TableCell>Title</TableCell><TableCell>Order</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>
              {banners.map((banner: any) => <TableRow key={banner.id}>
                <TableCell>{banner.mediaType === 'VIDEO' ? <Box component="video" src={banner.imageUrl} muted sx={{ width: 120, height: 54, objectFit: 'cover', borderRadius: 2 }} /> : <Box component="img" src={banner.imageUrl} alt={banner.title} sx={{ width: 120, height: 54, objectFit: 'cover', borderRadius: 2 }} />}</TableCell>
                <TableCell>{banner.title}</TableCell><TableCell><TextField size="small" type="number" value={banner.displayOrder} onChange={(e) => bannerMutation.mutate({ id: banner.id, displayOrder: Number(e.target.value) })} sx={{ width: 80 }} /></TableCell><TableCell>{banner.isActive ? 'Active' : 'Disabled'}</TableCell>
                <TableCell><Stack direction="row" spacing={1}><Button size="small" onClick={() => openEditBanner(banner)}>Edit</Button><Button size="small" onClick={() => bannerMutation.mutate({ id: banner.id, isActive: !banner.isActive })}>{banner.isActive ? 'Disable' : 'Enable'}</Button><Button size="small" color="error" onClick={() => window.confirm(`Delete banner ${banner.title}?`) && deleteBannerMutation.mutate(banner.id)}>Delete</Button></Stack></TableCell>
              </TableRow>)}
            </TableBody></Table>
            {!banners.length && <Alert sx={{ m: 2 }} severity="info">No hero banners found.</Alert>}
          </TableContainer>
        </Stack>
      )}

      {canManageUsers && <Box ref={reportsRef} sx={{ mt: 5, scrollMarginTop: 96 }}><ReportsPanel /></Box>}

      <Dialog open={bannerDialogOpen} onClose={() => setBannerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBannerId ? 'Edit Hero Banner' : 'Add Hero Banner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Title" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} fullWidth />
            <TextField label="Subtitle" value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Media Type</InputLabel>
              <Select value={bannerMediaType} label="Media Type" onChange={(e) => { setBannerMediaType(e.target.value as 'IMAGE' | 'VIDEO'); setBannerFile(null); }}>
                <MenuItem value="IMAGE">Image</MenuItem>
                <MenuItem value="VIDEO">Video</MenuItem>
              </Select>
            </FormControl>
            <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              {bannerFile ? bannerFile.name : bannerMediaType === 'IMAGE' ? 'Choose Banner Image' : 'Choose Banner Video'}
              <input hidden type="file" accept={bannerMediaType === 'IMAGE' ? '.jpg,.jpeg,.png,.heic,.heif' : '.mp4,.webm'} onChange={(e) => handleBannerFile(e.target.files?.[0] || null)} />
            </Button>
            <Stack direction="row" spacing={2}>
              <TextField label="Display Order" type="number" value={bannerOrder} onChange={(e) => setBannerOrder(Number(e.target.value))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={bannerActive ? 'active' : 'disabled'} label="Status" onChange={(e) => setBannerActive(e.target.value === 'active')}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="disabled">Disabled</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBannerDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveBanner} disabled={!bannerTitle.trim() || (!editingBannerId && !bannerFile) || createBannerMutation.isPending || bannerMutation.isPending}>{editingBannerId ? 'Save Banner' : 'Add Banner'}</Button>
        </DialogActions>
      </Dialog>

      {/* Stock Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{productDialogMode === 'create' ? 'Add Product' : 'Edit Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} fullWidth />
            <TextField label="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} multiline minRows={2} fullWidth />
            <TextField label="Specifications" value={productForm.specifications} onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Price" type="number" inputProps={{ min: 0, step: 0.01 }} value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} fullWidth />
              <TextField label="Discount %" type="number" inputProps={{ min: 0, max: 100, step: 0.1 }} value={productForm.discountPercent} onChange={(e) => setProductForm({ ...productForm, discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Recommended Age" value={productForm.recommendedAge} onChange={(e) => setProductForm({ ...productForm, recommendedAge: e.target.value })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={productForm.categoryId} label="Category" onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                  {categories.map((category: any) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            {productDialogMode === 'create' && <TextField label="Initial Stock" type="number" value={productForm.initialStock} onChange={(e) => setProductForm({ ...productForm, initialStock: Number(e.target.value) })} fullWidth />}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Product Images</Typography>
              <Button component="label" variant="outlined" startIcon={<ImageIcon size={18} />}>
                Upload Images
                <input hidden multiple type="file" accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif" onChange={handleImageSelection} />
              </Button>
              <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 2 }}>
                {(productForm.images || []).filter((image: any) => !removedImageIds.includes(image.id)).map((image: any) => (
                  <Box key={image.id} sx={{ position: 'relative' }}>
                    <Box component="img" src={image.url} alt="Existing product" sx={{ width: 92, height: 72, objectFit: 'cover', borderRadius: 2 }} />
                    <Button size="small" color="error" onClick={() => setRemovedImageIds((current) => [...current, image.id])}>Remove</Button>
                  </Box>
                ))}
                {selectedImageFiles.map((file, index) => (
                  <Box key={`${file.name}-${index}`} sx={{ position: 'relative' }}>
                    {file.type.startsWith('image/') && !file.type.includes('heic') && !file.type.includes('heif') ? <Box component="img" src={URL.createObjectURL(file)} alt={file.name} sx={{ width: 92, height: 72, objectFit: 'cover', borderRadius: 2 }} /> : <Box sx={{ width: 92, height: 72, p: 1, borderRadius: 2, background: '#F4F3FB', fontSize: 11 }}>{file.name}</Box>}
                    <Button size="small" color="error" onClick={() => setSelectedImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>Remove</Button>
                  </Box>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary">JPG, JPEG, PNG, HEIC or HEIF, up to 10 MB each.</Typography>
            </Box>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {['isFeatured', 'isNewArrival', 'isBestSeller'].map((field) => (
                <Button key={field} variant={productForm[field] ? 'contained' : 'outlined'} onClick={() => setProductForm({ ...productForm, [field]: !productForm[field] })}>
                  {field.replace('is', '')}
                </Button>
              ))}
              {productDialogMode === 'edit' && <Button variant={productForm.isActive ? 'contained' : 'outlined'} onClick={() => setProductForm({ ...productForm, isActive: !productForm.isActive })}>Active</Button>}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProductSave} disabled={productMutation.isPending || !productFormValid || !productFormChanged}>
            {productMutation.isPending ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)}>
        <DialogTitle>Update Stock Quantity</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="New Stock Quantity"
            type="number"
            value={newStockVal}
            onChange={(e) => setNewStockVal(parseInt(e.target.value, 10))}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => updateStockMutation.mutate({ productId: selectedProductId, stockQuantity: newStockVal, reason: 'Manual Restock' })}>
            Save Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Order Fulfillment Status</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatusVal} label="Status" onChange={(e) => setNewStatusVal(e.target.value)}>
              <MenuItem value="ORDER_PLACED">ORDER_PLACED</MenuItem>
              <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
              <MenuItem value="PACKED">PACKED</MenuItem>
              <MenuItem value="SHIPPED">SHIPPED</MenuItem>
              <MenuItem value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</MenuItem>
              <MenuItem value="DELIVERED">DELIVERED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Delivery Address ID" value={orderAddressId} onChange={(e) => setOrderAddressId(e.target.value)} fullWidth sx={{ mt: 2 }} helperText="Editable before packing; use an address belonging to this customer." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => updateOrderMutation.mutate({ orderId: selectedOrderId, status: newStatusVal, addressId: orderAddressId || undefined, notes: 'Updated from admin dashboard' })}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
