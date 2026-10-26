import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil } from "lucide-react";

type AmendOption = { variantId: string; size: string; color: string; stock: number };
type AmendItem = {
  orderItemId: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  options: AmendOption[];
};

interface Props {
  orderId: string;
  status: string;
  channel?: string | null;
  address: { shippingAddress: string; shippingCity: string; shippingPostalCode: string; shippingCountry: string; phoneNumber?: string };
  onAmended: () => void;
}

/**
 * "Change this order" - only for website orders that have not been dispatched yet.
 * Swaps an item's size/colour (stock moves automatically) or fixes the delivery address.
 * The customer is emailed and the change is written to the order history.
 */
export default function OrderAmendPanel({ orderId, status, channel, address, onAmended }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    shippingAddress: address.shippingAddress || "",
    shippingCity: address.shippingCity || "",
    shippingPostalCode: address.shippingPostalCode || "",
    shippingCountry: address.shippingCountry || "UK",
  });

  const canAmend = (status === "pending" || status === "processing") && !String(channel || "").includes("epos");

  const { data: items = [], isLoading } = useQuery<AmendItem[]>({
    queryKey: [`/api/admin/orders/${orderId}/amend-options`],
    enabled: open && canAmend,
  });

  const done = (title: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory?includeInactive=1"] });
    toast({ title, description: "The customer has been emailed and the change is in the order history." });
    onAmended();
  };

  const failed = (err: any) =>
    toast({
      title: "Could not change the order",
      description: String(err?.message || "").replace(/^\d+:\s*/, "").replace(/^\{"error":"(.*)"\}$/, "$1") || "Please try again.",
      variant: "destructive",
    });

  const amendItem = useMutation({
    mutationFn: async (v: { orderItemId: string; newVariantId: string }) =>
      (await apiRequest("POST", `/api/admin/orders/${orderId}/amend-item`, v)).json(),
    onSuccess: () => done("Item updated"),
    onError: failed,
  });

  const amendAddress = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/admin/orders/${orderId}/amend-address`, form)).json(),
    onSuccess: () => done("Delivery address updated"),
    onError: failed,
  });

  if (!canAmend) return null;

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="button-amend-order">
        <Pencil className="h-4 w-4 mr-2" />
        Change size, colour or address (not yet dispatched)
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4" data-testid="panel-amend-order">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Change this order</h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Only possible until the order is dispatched. Stock moves automatically and the customer is emailed.
      </p>

      <div className="space-y-3">
        <p className="text-sm font-medium">Size / colour</p>
        {isLoading && <p className="text-sm text-muted-foreground">Loading options...</p>}
        {items.map((item) => (
          <div key={item.orderItemId} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                Now: {item.size} / {item.color} (qty {item.quantity})
              </p>
            </div>
            {item.options.length === 0 ? (
              <span className="text-xs text-muted-foreground">No other sizes/colours available</span>
            ) : (
              <>
                <Select value={choices[item.orderItemId] || ""} onValueChange={(v) => setChoices((p) => ({ ...p, [item.orderItemId]: v }))}>
                  <SelectTrigger className="w-[220px]" data-testid={`select-amend-${item.orderItemId}`}>
                    <SelectValue placeholder="Change to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {item.options.map((o) => (
                      <SelectItem key={o.variantId} value={o.variantId} disabled={o.stock < item.quantity}>
                        {o.size} / {o.color} ({o.stock} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!choices[item.orderItemId] || amendItem.isPending}
                  onClick={() => amendItem.mutate({ orderItemId: item.orderItemId, newVariantId: choices[item.orderItemId] })}
                  data-testid={`button-apply-amend-${item.orderItemId}`}
                >
                  Apply
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Delivery address</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">Address</Label>
            <Input value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} data-testid="input-amend-address" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">City</Label>
            <Input value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} data-testid="input-amend-city" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Postcode</Label>
            <Input value={form.shippingPostalCode} onChange={(e) => setForm({ ...form, shippingPostalCode: e.target.value })} data-testid="input-amend-postcode" />
          </div>
        </div>
        <Button size="sm" disabled={amendAddress.isPending} onClick={() => amendAddress.mutate()} data-testid="button-save-amend-address">
          Save address
        </Button>
      </div>
    </div>
  );
}
