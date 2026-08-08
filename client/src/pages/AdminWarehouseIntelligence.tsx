import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Warehouse,
  Loader2,
  Package,
  AlertTriangle,
  PoundSterling,
  BarChart3,
  Boxes,
  MapPin,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

type WarehouseUtilisation = {
  warehouse: {
    id: string;
    name: string;
    code: string;
    location: string;
    capacity: number;
    isActive: boolean;
  };
  totalUnits: number;
  uniqueProducts: number;
  uniqueVariants: number;
  capacity: number;
  utilisationPercentage: string | null;
  isOverCapacity: boolean;
  availableCapacity: number | null;
  totalStockValue: string;
};

type UtilisationData = {
  warehouses: WarehouseUtilisation[];
  summary: {
    totalWarehouses: number;
    totalUnits: number;
    totalCapacity: number;
    overallUtilisation: string | null;
    totalStockValue: string;
  };
};

export default function AdminWarehouseIntelligence() {
  const { data: utilisationData, isLoading, isError, refetch } = useQuery<UtilisationData>({
    queryKey: ["/api/admin/smart-inventory/warehouse-utilisation"],
  });

  const getUtilisationColor = (percentage: number | null) => {
    if (percentage === null) return "bg-muted";
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const getUtilisationStatus = (percentage: number | null, isOverCapacity: boolean) => {
    if (isOverCapacity) return { label: "Over Capacity", variant: "destructive" as const };
    if (percentage === null) return { label: "No Capacity Set", variant: "outline" as const };
    if (percentage >= 90) return { label: "Critical", variant: "destructive" as const };
    if (percentage >= 75) return { label: "High", variant: "default" as const };
    if (percentage >= 50) return { label: "Moderate", variant: "secondary" as const };
    return { label: "Healthy", variant: "outline" as const };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Warehouse Intelligence</h1>
          <p className="text-muted-foreground">Real-time warehouse capacity and stock distribution</p>
        </div>
        <Button asChild variant="outline" data-testid="button-manage-warehouses">
          <Link href="/admin/warehouses">
            <Warehouse className="h-4 w-4 mr-2" />
            Manage Warehouses
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="utilisation-error-state">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
          <p>Failed to load warehouse data</p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
            data-testid="button-retry-warehouse"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-total-warehouses">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Active Warehouses</CardTitle>
                <Warehouse className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {utilisationData?.summary?.totalWarehouses || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Locations with inventory
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-units">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                <Boxes className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(utilisationData?.summary?.totalUnits || 0).toLocaleString("en-GB")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all warehouses
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-overall-utilisation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Overall Utilisation</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {utilisationData?.summary?.overallUtilisation 
                    ? `${utilisationData.summary.overallUtilisation}%`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {utilisationData?.summary?.totalCapacity 
                    ? `${utilisationData.summary.totalCapacity.toLocaleString("en-GB")} total capacity`
                    : "No capacity configured"}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-stock-value">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                <PoundSterling className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  £{parseFloat(utilisationData?.summary?.totalStockValue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Wholesale value
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {utilisationData?.warehouses?.map((wh) => {
              const percentage = wh.utilisationPercentage ? parseFloat(wh.utilisationPercentage) : null;
              const status = getUtilisationStatus(percentage, wh.isOverCapacity);
              
              return (
                <Card key={wh.warehouse.id} data-testid={`card-warehouse-${wh.warehouse.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Warehouse className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{wh.warehouse.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {wh.warehouse.location || wh.warehouse.code}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Capacity Utilisation</span>
                        <span className="font-mono">
                          {percentage !== null ? `${percentage.toFixed(1)}%` : "N/A"}
                        </span>
                      </div>
                      <Progress 
                        value={percentage !== null ? Math.min(100, percentage) : 0} 
                        className={`h-3 ${percentage !== null && percentage >= 90 ? "[&>div]:bg-red-500" : ""}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{wh.totalUnits.toLocaleString("en-GB")} units</span>
                        <span>
                          {wh.capacity 
                            ? `${wh.capacity.toLocaleString("en-GB")} capacity`
                            : "No limit set"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{wh.uniqueProducts}</p>
                        <p className="text-xs text-muted-foreground">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{wh.uniqueVariants}</p>
                        <p className="text-xs text-muted-foreground">Variants</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          £{(parseFloat(wh.totalStockValue) / 1000).toFixed(1)}k
                        </p>
                        <p className="text-xs text-muted-foreground">Value</p>
                      </div>
                    </div>

                    {wh.isOverCapacity && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Over capacity by {(wh.totalUnits - (wh.capacity || 0)).toLocaleString("en-GB")} units
                        </span>
                      </div>
                    )}

                    {wh.availableCapacity !== null && wh.availableCapacity < 100 && !wh.isOverCapacity && (
                      <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-amber-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Only {wh.availableCapacity.toLocaleString("en-GB")} units capacity remaining
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!utilisationData?.warehouses?.length && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No warehouses configured</p>
                <p className="text-sm">Create warehouses to track capacity and utilisation</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/warehouses">
                    <Warehouse className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Warehouse Comparison</CardTitle>
              <CardDescription>Side-by-side view of all warehouse metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {!utilisationData?.warehouses?.length ? (
                <p className="text-center text-muted-foreground py-8">
                  No warehouse data available
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Utilisation</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Stock Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilisationData.warehouses.map((wh) => {
                      const percentage = wh.utilisationPercentage ? parseFloat(wh.utilisationPercentage) : null;
                      const status = getUtilisationStatus(percentage, wh.isOverCapacity);
                      
                      return (
                        <TableRow key={wh.warehouse.id} data-testid={`row-warehouse-${wh.warehouse.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{wh.warehouse.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {wh.warehouse.location || wh.warehouse.code}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{wh.totalUnits.toLocaleString("en-GB")}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              {wh.capacity ? wh.capacity.toLocaleString("en-GB") : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getUtilisationColor(percentage)}`} />
                              <span className="font-mono">
                                {percentage !== null ? `${percentage.toFixed(1)}%` : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{wh.uniqueProducts}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              £{parseFloat(wh.totalStockValue).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
