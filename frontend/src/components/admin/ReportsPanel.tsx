import React, { useState } from 'react';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { Download, FileBarChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getGqlClient } from '../../services/graphql';
import { INVENTORY_REPORT_QUERY, SALES_REPORT_QUERY } from '../../graphql/queries';

const categories = [
  { value: 'all', label: 'All Toys' },
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
  { value: 'unisex', label: 'Unisex' },
];

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const ReportsPanel: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesEnabled, setSalesEnabled] = useState(false);
  const [inventoryEnabled, setInventoryEnabled] = useState(false);

  const salesQuery = useQuery({
    queryKey: ['salesReport', category, startDate, endDate],
    queryFn: () => getGqlClient().request(SALES_REPORT_QUERY, { filters: { category, startDate: startDate || undefined, endDate: endDate || undefined } }),
    enabled: salesEnabled,
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventoryReport', category, stockStatus],
    queryFn: () => getGqlClient().request(INVENTORY_REPORT_QUERY, { filters: { category, stockStatus } }),
    enabled: inventoryEnabled,
  });

  const sales = (salesQuery.data as any)?.salesReport;
  const inventory = (inventoryQuery.data as any)?.inventoryReport;
  const reportError = salesQuery.error || inventoryQuery.error;

  const downloadSales = () => {
    if (!sales) return;
    downloadCsv('toy-store-sales-report.csv', ['Order ID', 'Order Date', 'Product', 'Category', 'Quantity', 'Unit Price', 'Discount', 'Line Total', 'Order Total', 'Payment Status', 'Order Status'], sales.rows.map((row: any) => [row.orderId, row.orderDate, row.productName, row.category, row.quantity, row.unitPrice, row.discount, row.lineTotal, row.orderTotal, row.paymentStatus, row.orderStatus]));
  };
  const downloadInventory = () => {
    if (!inventory) return;
    downloadCsv('toy-store-inventory-report.csv', ['Product', 'Category', 'Current Stock', 'Units Sold', 'Stock Status', 'Price', 'Inventory Value'], inventory.rows.map((row: any) => [row.productName, row.category, row.currentStock, row.unitsSold, row.stockStatus, row.price, row.inventoryValue]));
  };

  return (
    <Paper sx={{ mt: 4, p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid #E2E0F0' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <FileBarChart size={22} color="#6C5CE7" />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Reports</Typography>
      </Stack>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth" sx={{ mb: 3 }}>
        <Tab label="Sales Report" />
        <Tab label="Inventory Report" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth><InputLabel>Category</InputLabel><Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select></FormControl>
            <TextField fullWidth type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField fullWidth type="date" label="End Date" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button variant="contained" onClick={() => setSalesEnabled(true)} disabled={salesQuery.isFetching}>Generate</Button>
          </Stack>
          {sales && <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2 }}>
              {Object.entries({ 'Total Orders': sales.summary.totalOrders, 'Items Sold': sales.summary.totalItemsSold, 'Gross Sales': `₹${sales.summary.grossSales.toFixed(2)}`, Discounts: `₹${sales.summary.discounts.toFixed(2)}`, 'Net Revenue': `₹${sales.summary.netRevenue.toFixed(2)}` }).map(([label, value]) => <Paper key={label} sx={{ p: 2, background: '#FAF9FF' }}><Typography variant="caption">{label}</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography></Paper>)}
            </Box>
            <Button variant="outlined" startIcon={<Download size={17} />} onClick={downloadSales} sx={{ alignSelf: 'flex-start' }}>Download CSV</Button>
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}><Table size="small"><TableHead><TableRow>{['Order', 'Date', 'Product', 'Category', 'Qty', 'Line Total', 'Status'].map((heading) => <TableCell key={heading}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{sales.rows.map((row: any) => <TableRow key={`${row.orderId}-${row.productName}`}><TableCell>{row.orderId}</TableCell><TableCell>{new Date(row.orderDate).toLocaleDateString()}</TableCell><TableCell>{row.productName}</TableCell><TableCell>{row.category}</TableCell><TableCell>{row.quantity}</TableCell><TableCell>₹{row.lineTotal}</TableCell><TableCell>{row.orderStatus}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
            {!sales.rows.length && <Alert severity="info">No sales found for the selected date range.</Alert>}
          </>}
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth><InputLabel>Category</InputLabel><Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth><InputLabel>Stock Status</InputLabel><Select value={stockStatus} label="Stock Status" onChange={(e) => setStockStatus(e.target.value)}>{[['all', 'All'], ['in_stock', 'In Stock'], ['low_stock', 'Low Stock'], ['out_of_stock', 'Out of Stock']].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
            <Button variant="contained" onClick={() => setInventoryEnabled(true)} disabled={inventoryQuery.isFetching}>Generate</Button>
          </Stack>
          {inventory && <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2 }}>
              {Object.entries({ 'Total Products': inventory.summary.totalProducts, 'In Stock': inventory.summary.inStock, 'Low Stock': inventory.summary.lowStock, 'Out of Stock': inventory.summary.outOfStock, 'Inventory Value': `₹${inventory.summary.inventoryValue.toFixed(2)}` }).map(([label, value]) => <Paper key={label} sx={{ p: 2, background: '#FAF9FF' }}><Typography variant="caption">{label}</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography></Paper>)}
            </Box>
            <Button variant="outlined" startIcon={<Download size={17} />} onClick={downloadInventory} sx={{ alignSelf: 'flex-start' }}>Download CSV</Button>
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}><Table size="small"><TableHead><TableRow>{['Product', 'Category', 'Stock', 'Sold', 'Status', 'Price', 'Value'].map((heading) => <TableCell key={heading}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{inventory.rows.map((row: any) => <TableRow key={row.productId}><TableCell>{row.productName}</TableCell><TableCell>{row.category}</TableCell><TableCell>{row.currentStock}</TableCell><TableCell>{row.unitsSold}</TableCell><TableCell>{row.stockStatus}</TableCell><TableCell>₹{row.price}</TableCell><TableCell>₹{row.inventoryValue}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
            {!inventory.rows.length && <Alert severity="info">No products match the selected inventory filters.</Alert>}
          </>}
        </Stack>
      )}
      {reportError && <Alert severity="error" sx={{ mt: 2 }}>Unable to generate this report.</Alert>}
    </Paper>
  );
};
