import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl: string | null;
  category: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const searchResults = searchQuery.trim()
    ? allProducts
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="dialog-search">
        <DialogHeader>
          <DialogTitle data-testid="text-search-title">Search Products</DialogTitle>
          <DialogDescription>
            Find your perfect fitness apparel by searching our complete product catalogue
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
            data-testid="input-search-dialog"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4">
          {searchQuery.trim() === "" ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-search-prompt">
              Start typing to search for products
            </p>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-search-no-results">
              No products found for "{searchQuery}"
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => onOpenChange(false)}
                >
                  <div
                    className="flex gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    data-testid={`search-result-${product.id}`}
                  >
                    <img
                      src={product.imageUrl || ""}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                      data-testid={`img-search-result-${product.id}`}
                    />
                    <div className="flex-1">
                      <h4
                        className="font-medium"
                        data-testid={`text-search-result-name-${product.id}`}
                      >
                        {product.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                      <p
                        className="text-sm font-semibold mt-1"
                        data-testid={`text-search-result-price-${product.id}`}
                      >
                        £{parseFloat(product.retailPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link href={`/shop-clean?search=${encodeURIComponent(searchQuery)}`}>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                data-testid="button-view-all-results"
              >
                View All Results
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
