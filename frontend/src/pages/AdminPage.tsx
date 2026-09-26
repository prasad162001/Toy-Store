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
  UPDATE_STOCK_MUTATION,
  ADMIN_USERS_QUERY,
  ADMIN_AUDIT_LOGS_QUERY,
  GET_CATEGORIES_QUERY,
  CREATE_PRODUCT_MUTATION,
  UPDATE_PRODUCT_MUTATION,
} from '../graphql/queries';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isStaffOnly = roles.includes('STAFF') && !roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN');
  const canManageUsers = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  const canManageProducts = canManageUsers;
  const [activeTab, setActiveTab] = useState(0);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogMode, setProductDialogMode] = useState<'create' | 'edit'>('create');
  const [productForm, setProductForm] = useState<any>({
    id: '', name: '', description: '', specifications: '', price: 0, discountPercent: 0,
    recommendedAge: '', categoryId: '', initialStock: 10, imageUrls: '', isFeatured: false,
    isNewArrival: false, isBestSeller: false, isActive: true,
  });

  // Stock dialog state
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newStockVal, setNewStockVal] = useState(10);

  // Status Dialog State
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newStatusVal, setNewStatusVal] = useState('CONFIRMED');

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

  const metrics = (metricsData as any)?.adminMetrics;
  const products = (productsData as any)?.products?.products || [];
  const orders = (ordersData as any)?.adminOrders || [];
  const users = (usersData as any)?.adminUsers || [];
  const auditLogs = (auditData as any)?.adminAuditLogs || [];
  const categories = (categoriesData as any)?.categories || [];

  const productMutation = useMutation({
    mutationFn: (vars: any) => getGqlClient().request(productDialogMode === 'create' ? CREATE_PRODUCT_MUTATION : UPDATE_PRODUCT_MUTATION, { input: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      setProductDialogOpen(false);
    },
  });

  const openCreateProduct = () => {
    setProductDialogMode('create');
    setProductForm({ id: '', name: '', description: '', specifications: '', price: 0, discountPercent: 0, recommendedAge: '', categoryId: categories[0]?.id || '', initialStock: 10, imageUrls: '', isFeatured: false, isNewArrival: false, isBestSeller: false, isActive: true });
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: any) => {
    setProductDialogMode('edit');
    setProductForm({ ...product, imageUrls: product.images?.map((image: any) => image.url).join(', ') || '' });
    setProductDialogOpen(true);
  };

  const handleProductSave = () => {
    if (productDialogMode === 'create') {
      productMutation.mutate({
        ...productForm,
        imageUrls: productForm.imageUrls.split(',').map((url: string) => url.trim()).filter(Boolean),
      });
    } else {
      const { imageUrls, initialStock, ...updateInput } = productForm;
      productMutation.mutate(updateInput);
    }
  };

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
              <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Revenue</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>₹{metrics?.totalRevenue?.toFixed(0) || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #FF7675 0%, #D63031 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Orders</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{metrics?.totalOrders || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #00B894 0%, #009473 100%)', color: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Active Products</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{metrics?.totalProducts || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)', color: '#FFFFFF' }}>
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
                    <Button size="small" variant="contained" onClick={() => { setSelectedOrderId(o.id); setNewStatusVal(o.status); setStatusDialogOpen(true); }}>
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

      {/* Stock Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{productDialogMode === 'create' ? 'Add Product' : 'Edit Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} fullWidth />
            <TextField label="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} multiline minRows={2} fullWidth />
            <TextField label="Specifications" value={productForm.specifications} onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Price" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} fullWidth />
              <TextField label="Discount %" type="number" value={productForm.discountPercent} onChange={(e) => setProductForm({ ...productForm, discountPercent: Number(e.target.value) })} fullWidth />
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
            {productDialogMode === 'create' && <TextField label="Image URLs (comma separated)" value={productForm.imageUrls} onChange={(e) => setProductForm({ ...productForm, imageUrls: e.target.value })} fullWidth />}
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
          <Button variant="contained" onClick={handleProductSave} disabled={productMutation.isPending || !productForm.name || !productForm.categoryId}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => updateStatusMutation.mutate({ orderId: selectedOrderId, status: newStatusVal, notes: 'Updated from admin dashboard' })}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
