import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { LogOut, Package, Users, TrendingUp } from "lucide-react";

export default function B2BDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: authUser } = useQuery<{ user: { id: string; email: string; role: string } }>({
    queryKey: ['/api/auth/me'],
  });

  const isBVendor = authUser?.user?.role === "vendor";
  const isReseller = authUser?.user?.role === "reseller";

  // Fetch B2B dashboard data
  const { data: dashboardData, isLoading } = useQuery<any>({
    queryKey: [isBVendor ? "/api/vendor/dashboard" : "/api/reseller/dashboard"],
    enabled: !!authUser,
  });

  // Fetch vendor reseller permissions if vendor
  const { data: permissions = [] } = useQuery<any[]>({
    queryKey: ["/api/vendor/reseller-permissions"],
    enabled: !!authUser && isBVendor,
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast({ title: "Logged out successfully" });
        navigate(isBVendor ? "/vendor/login" : "/reseller/login");
      }
    } catch (error) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  if (!authUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {isBVendor ? "Wholesaler" : "Reseller"} Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your business</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            {isBVendor && <TabsTrigger value="permissions">Reseller Permissions</TabsTrigger>}
            {isReseller && <TabsTrigger value="inventory">Inventory</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Total Products</p>
                    <p className="text-3xl font-bold">{dashboardData?.totalProducts || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Total Sales</p>
                    <p className="text-3xl font-bold">£{dashboardData?.totalSales || "0.00"}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
              </Card>

              {isBVendor && (
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground">Active Resellers</p>
                      <p className="text-3xl font-bold">{permissions.filter((p: any) => p.isApproved).length}</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Product management coming soon</p>
            </div>
          </TabsContent>

          {/* Reseller Permissions Tab (Vendors Only) */}
          {isBVendor && (
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-4">
                {permissions.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No reseller permissions yet</p>
                  </Card>
                ) : (
                  permissions.map((permission: any) => (
                    <Card key={permission.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Reseller ID: {permission.resellerId}</p>
                          <p className="text-sm text-muted-foreground">Product: {permission.vendorProductId}</p>
                        </div>
                        <Badge variant={permission.isApproved ? "default" : "outline"}>
                          {permission.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}

          {/* Inventory Tab (Resellers Only) */}
          {isReseller && (
            <TabsContent value="inventory" className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Inventory management coming soon</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
