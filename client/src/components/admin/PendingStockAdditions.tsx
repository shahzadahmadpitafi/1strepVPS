import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface StockRequest {
  id: number;
  quantity: number;
  status: string;
  product: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  supplier: string | null;
  notes: string | null;
  requested_by_label: string;
  created_at: string;
}

/**
 * Add Stock entries from members who cannot change stock by hand. They wait here until the stock editor checks the
 * amount and approves (or corrects, or rejects) each line. Nothing is added to the stock before that.
 */
export default function PendingStockAdditions() {
  const { toast } = useToast();
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const { data } = useQuery<{ canDecide: boolean; requests: StockRequest[] }>({
    queryKey: ["/api/admin/stock-requests"],
    refetchInterval: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory?includeInactive=1"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
  };
  const approve = useMutation({
    mutationFn: async (r: StockRequest) => {
      const q = amounts[r.id];
      const res = await apiRequest("POST", `/api/admin/stock-requests/${r.id}/approve`, q ? { quantity: q } : {});
      return res.json();
    },
    onSuccess: () => { toast({ title: "Approved", description: "The stock has been added." }); refresh(); },
    onError: (e: any) => toast({ title: "Could not approve", description: String(e?.message || e), variant: "destructive" }),
  });
  const reject = useMutation({
    mutationFn: async (r: StockRequest) => {
      const res = await apiRequest("POST", `/api/admin/stock-requests/${r.id}/reject`, {});
      return res.json();
    },
    onSuccess: () => { toast({ title: "Rejected", description: "Nothing was added to the stock." }); refresh(); },
    onError: (e: any) => toast({ title: "Could not reject", description: String(e?.message || e), variant: "destructive" }),
  });

  const rows = data?.requests || [];
  if (!rows.length) return null;
  const canDecide = !!data?.canDecide;

  return (
    <Card className="mb-6 border-amber-500/50" data-testid="pending-stock-additions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Stock additions waiting for approval
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
        <CardDescription>
          {canDecide
            ? "Check each amount against the delivery. Nothing is added to the stock until you approve. You can correct the amount before approving."
            : "These deliveries were entered and are waiting for Dennis to check and approve them. The stock is added once he approves."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3" data-testid={`stock-request-${r.id}`}>
            <div className="min-w-[220px] flex-1">
              <div className="font-medium">{r.product} <span className="text-muted-foreground">{r.size || ""} / {r.color || ""}</span></div>
              <div className="text-xs text-muted-foreground">
                Entered by {r.requested_by_label} on {format(new Date(r.created_at), "MMM dd, HH:mm")}
                {r.supplier ? ` - ${r.supplier}` : ""}{r.notes ? ` - ${r.notes}` : ""}
              </div>
            </div>
            <div className="text-sm">
              Stock now <b>{r.stock_quantity}</b> &rarr; adding <b>+{r.quantity}</b> &rarr; <b>{r.stock_quantity + (parseInt(amounts[r.id] || "") || r.quantity)}</b>
            </div>
            {canDecide && (
              <div className="flex items-center gap-2">
                <Input
                  type="number" min={1} className="w-24" placeholder={String(r.quantity)}
                  value={amounts[r.id] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value }))}
                  data-testid={`input-approve-quantity-${r.id}`}
                />
                <Button size="sm" onClick={() => approve.mutate(r)} disabled={approve.isPending || reject.isPending} data-testid={`button-approve-${r.id}`}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => reject.mutate(r)} disabled={approve.isPending || reject.isPending} data-testid={`button-reject-${r.id}`}>Reject</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
