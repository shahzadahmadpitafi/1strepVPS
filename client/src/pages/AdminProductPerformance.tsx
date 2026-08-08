import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Loader2,
  Award,
  AlertTriangle,
  Calendar,
  PoundSterling,
  ShoppingCart,
  BarChart3,
  Boxes,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ProductPerformance = {
  productId: string;
  totalQuantity: number;
  totalRevenue: string;
  orderCount: number;
  product: {
    id: string;
    name: string;
    sku: string;
    imageUrl: string;
    category: string;
    retailPrice: string;
  };
  currentStock: number;
  avgDailySales: string;
  revenue: number;
};

type DeadStockProduct = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  category: string;
  wholesalePrice: string;
  currentStock: number;
  lastSaleDate: string | null;
  daysSinceLastSale: number | null;
  stockValue: string;
};

type PerformanceData = {
  period: number;
  totalProducts: number;
  totalQuantitySold: number;
  totalRevenue: string;
  bestSellers: ProductPerformance[];
  slowMovers: ProductPerformance[];
  categoryPerformance: Record<string, { quantity: number; revenue: number; products: number }>;
};

type DeadStockData = {
  cutoffDays: number;
  totalDeadStockProducts: number;
  totalDeadStockUnits: number;
  totalDeadStockValue: string;
  products: DeadStockProduct[];
};

export default function AdminProductPerformance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("30");
  const [deadStockDays, setDeadStockDays] = useState("90");

  const { data: performanceData, isLoading: loadingPerformance, isError: performanceError } = useQuery<PerformanceData>({
    queryKey: ["/api/admin/smart-inventory/product-performance", period],
    queryFn: async () => {
      const response = await fetch(`/api/admin/smart-inventory/product-performance?period=${period}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      return response.json();
    },
  });

  const { data: deadStockData, isLoading: loadingDeadStock, isError: deadStockError } = useQuery<DeadStockData>({
    queryKey: ["/api/admin/smart-inventory/dead-stock", deadStockDays],
    queryFn: async () => {
      const response = await fetch(`/api/admin/smart-inventory/dead-stock?days=${deadStockDays}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dead stock data');
      }
      return response.json();
    },
  });

  const categoryData = performanceData?.categoryPerformance 
    ? Object.entries(performanceData.categoryPerformance)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
    : [];

  const maxCategoryRevenue = categoryData.length > 0 
    ? Math.max(...categoryData.map(c => c.revenue))
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Product Performance</h1>
          <p className="text-muted-foreground">Analyse sales patterns and identify opportunities</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="best-sellers" data-testid="tab-best-sellers">
            <Award className="h-4 w-4 mr-2" />
            Best Sellers
          </TabsTrigger>
          <TabsTrigger value="slow-movers" data-testid="tab-slow-movers">
            <TrendingDown className="h-4 w-4 mr-2" />
            Slow Movers
          </TabsTrigger>
          <TabsTrigger value="dead-stock" data-testid="tab-dead-stock">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Dead Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loadingPerformance ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : performanceError ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="performance-error-state">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
              <p>Failed to load performance data</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-total-revenue">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <PoundSterling className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      £{parseFloat(performanceData?.totalRevenue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last {period} days
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-units-sold">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(performanceData?.totalQuantitySold || 0).toLocaleString("en-GB")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across {performanceData?.totalProducts || 0} products
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-avg-order-value">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      £{performanceData?.totalQuantitySold && performanceData.totalQuantitySold > 0
                        ? (parseFloat(performanceData.totalRevenue) / performanceData.totalQuantitySold).toFixed(2)
                        : "0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per unit sold
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-dead-stock-value">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Dead Stock Value</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      £{parseFloat(deadStockData?.totalDeadStockValue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deadStockData?.totalDeadStockProducts || 0} products
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-category-performance">
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                    <CardDescription>Revenue by product category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No sales data available for this period
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {categoryData.map((category) => (
                          <div key={category.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category.name}</span>
                              <span className="text-sm text-muted-foreground">
                                £{category.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <Progress 
                              value={(category.revenue / maxCategoryRevenue) * 100} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{category.products} products</span>
                              <span>{category.quantity} units sold</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-top-performers">
                  <CardHeader>
                    <CardTitle>Top 5 Performers</CardTitle>
                    <CardDescription>Best selling products this period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!performanceData?.bestSellers?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No sales data available for this period
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {performanceData.bestSellers.slice(0, 5).map((product, index) => (
                          <div key={product.productId} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {index + 1}
                            </div>
                            {product.product?.imageUrl && (
                              <img
                                src={product.product.imageUrl}
                                alt={product.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.product?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.totalQuantity} units • £{product.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="best-sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
              <CardDescription>Products ranked by sales volume over the last {period} days</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !performanceData?.bestSellers?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales data available</p>
                  <p className="text-sm">Products will appear here once sales occur</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Daily</TableHead>
                      <TableHead>Current Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.bestSellers.map((product, index) => (
                      <TableRow key={product.productId} data-testid={`row-bestseller-${product.productId}`}>
                        <TableCell>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.product?.imageUrl && (
                              <img
                                src={product.product.imageUrl}
                                alt={product.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.product?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{product.product?.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.product?.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-bold">{product.totalQuantity}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            £{product.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{product.avgDailySales}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{product.currentStock}</span>
                            {product.currentStock < 10 && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow-movers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Moving Products</CardTitle>
              <CardDescription>Products with lowest sales velocity that still have stock</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !performanceData?.slowMovers?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No slow moving products found</p>
                  <p className="text-sm">All stocked products are selling well</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Daily</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.slowMovers.map((product) => (
                      <TableRow key={product.productId} data-testid={`row-slowmover-${product.productId}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.product?.imageUrl && (
                              <img
                                src={product.product.imageUrl}
                                alt={product.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.product?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{product.product?.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.product?.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{product.totalQuantity}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            £{product.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-amber-600">{product.avgDailySales}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{product.currentStock}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-muted-foreground">
                            £{(product.currentStock * parseFloat(product.product?.retailPrice || "0")).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dead-stock" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Dead Stock Analysis</h2>
              <p className="text-muted-foreground">Products with no sales in the specified period</p>
            </div>
            <Select value={deadStockDays} onValueChange={setDeadStockDays}>
              <SelectTrigger className="w-48" data-testid="select-dead-stock-days">
                <SelectValue placeholder="No sales in..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">No sales in 30 days</SelectItem>
                <SelectItem value="60">No sales in 60 days</SelectItem>
                <SelectItem value="90">No sales in 90 days</SelectItem>
                <SelectItem value="180">No sales in 180 days</SelectItem>
                <SelectItem value="365">No sales in 1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-dead-stock-products">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Dead Stock Products</CardTitle>
                <Boxes className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deadStockData?.totalDeadStockProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  With no sales in {deadStockDays} days
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-dead-stock-units">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Dead Stock Units</CardTitle>
                <Package className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deadStockData?.totalDeadStockUnits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total units not selling
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-dead-stock-total-value">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Total Dead Stock Value</CardTitle>
                <PoundSterling className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  £{parseFloat(deadStockData?.totalDeadStockValue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Capital tied up in dead stock
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dead Stock Products</CardTitle>
              <CardDescription>Products sorted by stock value (highest first)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDeadStock ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !deadStockData?.products?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No dead stock found</p>
                  <p className="text-sm">All stocked products have sold within the specified period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Value</TableHead>
                      <TableHead>Last Sale</TableHead>
                      <TableHead>Days Since Sale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deadStockData.products.map((product) => (
                      <TableRow key={product.id} data-testid={`row-deadstock-${product.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{product.currentStock}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-bold text-amber-600">
                            £{parseFloat(product.stockValue).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {product.lastSaleDate ? (
                            formatDistanceToNow(new Date(product.lastSaleDate), { addSuffix: true })
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono">
                              {product.daysSinceLastSale !== null ? `${product.daysSinceLastSale} days` : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
