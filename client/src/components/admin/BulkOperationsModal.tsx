import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, PoundSterling, Power, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type BulkOperationType = "price-update" | "status-change" | null;

type BulkOperationsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  onSuccess: () => void;
};

export default function BulkOperationsModal({
  open,
  onOpenChange,
  selectedProductIds,
  onSuccess,
}: BulkOperationsModalProps) {
  const [operationType, setOperationType] = useState<BulkOperationType>(null);
  const [adjustmentType, setAdjustmentType] = useState<string>("percentage");
  const [adjustmentValue, setAdjustmentValue] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("active");
  const { toast } = useToast();

  const priceUpdateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/smart-inventory/bulk-operations/price-update", {
        productIds: selectedProductIds,
        adjustmentType,
        adjustmentValue: parseFloat(adjustmentValue),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Price Update Complete",
        description: `Updated ${data.successCount} products${data.failureCount > 0 ? `, ${data.failureCount} failed` : ""}`,
      });
      onOpenChange(false);
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Price Update Failed",
        description: error.message || "Failed to update prices",
        variant: "destructive",
      });
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/smart-inventory/bulk-operations/status-change", {
        productIds: selectedProductIds,
        newStatus,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Status Change Complete",
        description: `Updated ${data.successCount} products`,
      });
      onOpenChange(false);
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Status Change Failed",
        description: error.message || "Failed to change status",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setOperationType(null);
    setAdjustmentType("percentage");
    setAdjustmentValue("");
    setNewStatus("active");
  };

  const handleExecute = () => {
    if (operationType === "price-update") {
      priceUpdateMutation.mutate();
    } else if (operationType === "status-change") {
      statusChangeMutation.mutate();
    }
  };

  const isExecuting = priceUpdateMutation.isPending || statusChangeMutation.isPending;

  const getPreviewText = () => {
    if (operationType === "price-update" && adjustmentValue) {
      const value = parseFloat(adjustmentValue);
      if (adjustmentType === "percentage") {
        return value >= 0 ? `+${value}%` : `${value}%`;
      } else if (adjustmentType === "fixed") {
        return value >= 0 ? `+£${value.toFixed(2)}` : `-£${Math.abs(value).toFixed(2)}`;
      } else if (adjustmentType === "set") {
        return `£${value.toFixed(2)}`;
      }
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedProductIds.length} selected products
          </DialogDescription>
        </DialogHeader>

        {!operationType && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center gap-2"
              onClick={() => setOperationType("price-update")}
              data-testid="button-bulk-price"
            >
              <PoundSterling className="h-8 w-8" />
              <span>Update Prices</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center gap-2"
              onClick={() => setOperationType("status-change")}
              data-testid="button-bulk-status"
            >
              <Power className="h-8 w-8" />
              <span>Change Status</span>
            </Button>
          </div>
        )}

        {operationType === "price-update" && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Adjustment Type</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={setAdjustmentType}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="percentage"
                    id="percentage"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="percentage"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold">%</span>
                    <span className="text-xs">Percentage</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="fixed"
                    id="fixed"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="fixed"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold">+£</span>
                    <span className="text-xs">Fixed Amount</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="set"
                    id="set"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="set"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <span className="text-lg font-bold">=£</span>
                    <span className="text-xs">Set Price</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {adjustmentType === "percentage" && "Percentage Change (use negative for decrease)"}
                {adjustmentType === "fixed" && "Amount to Add (use negative to subtract)"}
                {adjustmentType === "set" && "New Price"}
              </Label>
              <div className="flex items-center gap-2">
                {adjustmentType !== "set" && (
                  <span className="text-lg">{adjustmentType === "percentage" ? "%" : "£"}</span>
                )}
                {adjustmentType === "set" && <span className="text-lg">£</span>}
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === "percentage" ? "e.g., 10 or -15" : "e.g., 5.00"}
                  data-testid="input-bulk-value"
                />
              </div>
              {getPreviewText() && (
                <p className="text-sm text-muted-foreground">
                  Preview: All selected products will have their retail price adjusted by{" "}
                  <span className="font-medium">{getPreviewText()}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {operationType === "status-change" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-bulk-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Visible in shop)</SelectItem>
                  <SelectItem value="inactive">Inactive (Hidden from shop)</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {newStatus === "active" && "Products will be visible and available for purchase"}
                {newStatus === "inactive" && "Products will be hidden from the shop but kept in inventory"}
                {newStatus === "discontinued" && "Products will be marked as discontinued and hidden"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {operationType && (
            <Button variant="outline" onClick={() => setOperationType(null)}>
              Back
            </Button>
          )}
          {operationType && (
            <Button
              onClick={handleExecute}
              disabled={
                isExecuting ||
                (operationType === "price-update" && !adjustmentValue)
              }
              data-testid="button-execute-bulk"
            >
              {isExecuting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply to {selectedProductIds.length} Products
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
