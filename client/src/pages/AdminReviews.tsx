import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Star,
  Trash2,
  Search,
  ShieldCheck,
  ArrowLeft,
  Package,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
} from "lucide-react";

function StarDisplay({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "md" }) {
  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${iconClass} ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
        />
      ))}
    </span>
  );
}

function RatingDistribution({ counts, total }: { counts: Record<number, number>; total: number }) {
  return (
    <div className="space-y-1.5 w-full max-w-xs">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-right text-muted-foreground">{star}</span>
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-muted-foreground text-xs">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminReviews() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "product" | "order" } | null>(null);

  // ── Product Reviews ──────────────────────────────────────────────────────────
  const { data: productData, isLoading: loadingProduct } = useQuery<{
    reviews: any[];
    stats: { total: number; avgRating: number; ratingCounts: Record<number, number>; verified: number };
  }>({ queryKey: ["/api/admin/product-reviews"] });

  // ── Order Reviews ────────────────────────────────────────────────────────────
  const { data: orderData, isLoading: loadingOrder } = useQuery<{
    reviews: any[];
    stats: { total: number; avgRating: number; ratingCounts: Record<number, number>; recommended: number };
  }>({ queryKey: ["/api/admin/reviews"] });

  // ── Delete mutations ─────────────────────────────────────────────────────────
  const deleteProductReview = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/product-reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-reviews"] });
      toast({ title: "Review deleted" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Failed to delete review", variant: "destructive" }),
  });

  const deleteOrderReview = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review deleted" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Failed to delete review", variant: "destructive" }),
  });

  // ── Filtered lists ───────────────────────────────────────────────────────────
  const filteredProductReviews = (productData?.reviews ?? []).filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || r.productName?.toLowerCase().includes(q) || r.reviewerName?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q);
    const matchesRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    const matchesVerified = verifiedFilter === "all" || (verifiedFilter === "verified" ? r.isVerifiedPurchase : !r.isVerifiedPurchase);
    return matchesSearch && matchesRating && matchesVerified;
  });

  const filteredOrderReviews = (orderData?.reviews ?? []).filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || r.orderNumber?.toLowerCase().includes(q) || r.customerName?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q);
    const matchesRating = ratingFilter === "all" || r.overallRating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Reviews Management</h1>
            <p className="text-sm text-muted-foreground">Moderate and manage all customer reviews</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Product Reviews</p>
              <p className="text-2xl font-bold">{productData?.stats.total ?? 0}</p>
              {productData && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{productData.stats.avgRating}</span>
                  <span className="text-xs text-muted-foreground">avg</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Verified Purchases</p>
              <p className="text-2xl font-bold">{productData?.stats.verified ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {productData?.stats.total ? `${Math.round(((productData.stats.verified ?? 0) / productData.stats.total) * 100)}% of total` : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Order Reviews</p>
              <p className="text-2xl font-bold">{orderData?.stats.total ?? 0}</p>
              {orderData && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{orderData.stats.avgRating}</span>
                  <span className="text-xs text-muted-foreground">avg</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Would Recommend</p>
              <p className="text-2xl font-bold">{orderData?.stats.recommended ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {orderData?.stats.total ? `${Math.round(((orderData.stats.recommended ?? 0) / orderData.stats.total) * 100)}% of orders` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by product, reviewer, or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All reviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="unverified">Unverified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="product">
          <TabsList>
            <TabsTrigger value="product" className="gap-2">
              <Package className="w-4 h-4" />
              Product Reviews
              <Badge variant="secondary">{productData?.stats.total ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="order" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Order Reviews
              <Badge variant="secondary">{orderData?.stats.total ?? 0}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── PRODUCT REVIEWS ── */}
          <TabsContent value="product" className="mt-4 space-y-4">
            {/* Rating distribution */}
            {productData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-8 items-start">
                    <div className="text-center">
                      <p className="text-4xl font-bold">{productData.stats.avgRating}</p>
                      <StarDisplay rating={Math.round(productData.stats.avgRating)} size="md" />
                      <p className="text-xs text-muted-foreground mt-1">{productData.stats.total} reviews</p>
                    </div>
                    <RatingDistribution counts={productData.stats.ratingCounts} total={productData.stats.total} />
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingProduct ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProductReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No product reviews found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredProductReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-4 justify-between">
                        {/* Left: product + reviewer */}
                        <div className="flex gap-3 min-w-0">
                          {review.productImage && (
                            <img
                              src={review.productImage}
                              alt={review.productName}
                              className="w-12 h-12 rounded-md object-cover shrink-0 border"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{review.productName}</p>
                            <p className="text-xs text-muted-foreground truncate">{review.reviewerName} · {review.reviewerEmail}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StarDisplay rating={review.rating} />
                              {review.isVerifiedPurchase && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: date + delete */}
                        <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteTarget({ id: review.id, type: "product" })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── ORDER REVIEWS ── */}
          <TabsContent value="order" className="mt-4 space-y-4">
            {/* Rating distribution */}
            {orderData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Overall Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-8 items-start">
                    <div className="text-center">
                      <p className="text-4xl font-bold">{orderData.stats.avgRating}</p>
                      <StarDisplay rating={Math.round(orderData.stats.avgRating)} size="md" />
                      <p className="text-xs text-muted-foreground mt-1">{orderData.stats.total} reviews</p>
                    </div>
                    <RatingDistribution counts={orderData.stats.ratingCounts} total={orderData.stats.total} />
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingOrder ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrderReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No order reviews found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrderReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-4 justify-between">
                        {/* Left: customer + order */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{review.customerName || review.customerEmail}</p>
                            {review.orderNumber && (
                              <Badge variant="outline" className="text-xs font-mono">#{review.orderNumber}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{review.customerEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StarDisplay rating={review.overallRating} />
                            {review.wouldRecommend !== null && review.wouldRecommend !== undefined && (
                              <span className={`flex items-center gap-1 text-xs ${review.wouldRecommend ? "text-green-600" : "text-red-500"}`}>
                                {review.wouldRecommend ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                                {review.wouldRecommend ? "Recommends" : "Doesn't recommend"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: date + delete */}
                        <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteTarget({ id: review.id, type: "order" })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Sub-ratings */}
                      {(review.productQualityRating || review.deliveryRating || review.serviceRating) && (
                        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t">
                          {review.productQualityRating && (
                            <div className="text-xs">
                              <p className="text-muted-foreground mb-0.5">Product Quality</p>
                              <StarDisplay rating={review.productQualityRating} />
                            </div>
                          )}
                          {review.deliveryRating && (
                            <div className="text-xs">
                              <p className="text-muted-foreground mb-0.5">Delivery</p>
                              <StarDisplay rating={review.deliveryRating} />
                            </div>
                          )}
                          {review.serviceRating && (
                            <div className="text-xs">
                              <p className="text-muted-foreground mb-0.5">Service</p>
                              <StarDisplay rating={review.serviceRating} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comment */}
                      {review.comment && (
                        <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "product") deleteProductReview.mutate(deleteTarget.id);
                else deleteOrderReview.mutate(deleteTarget.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
