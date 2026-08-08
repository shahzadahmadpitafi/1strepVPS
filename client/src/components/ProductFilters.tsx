import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  activityTypes: string[];
  productTypes: string[];
  availabilityStatus: string[];
  showNewOnly: boolean;
  showSaleOnly: boolean;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories?: string[];
  availableSizes?: string[];
  availableColors?: string[];
  availableActivityTypes?: string[];
  availableProductTypes?: string[];
  availableAvailabilityStatus?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export default function ProductFilters({
  filters,
  onFiltersChange,
  availableCategories = ["Men", "Women", "Accessories"],
  availableSizes = ["XS", "S", "M", "L", "XL", "XXL"],
  availableColors = ["Black", "White", "Grey", "Navy", "Blue", "Pink", "Green"],
  availableActivityTypes = ["Training", "Yoga", "Running", "Studio", "General"],
  availableProductTypes = ["T-Shirts", "Hoodies", "Sports Bras", "Leggings", "Tanks", "Accessories"],
  availableAvailabilityStatus = ["Available", "Upcoming", "Out of Stock"],
  minPrice = 0,
  maxPrice = 100,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleSize = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    updateFilters({ sizes: newSizes });
  };

  const toggleColor = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    updateFilters({ colors: newColors });
  };

  const toggleActivityType = (activityType: string) => {
    const newActivityTypes = filters.activityTypes.includes(activityType)
      ? filters.activityTypes.filter(a => a !== activityType)
      : [...filters.activityTypes, activityType];
    updateFilters({ activityTypes: newActivityTypes });
  };

  const toggleProductType = (productType: string) => {
    const newProductTypes = filters.productTypes.includes(productType)
      ? filters.productTypes.filter(p => p !== productType)
      : [...filters.productTypes, productType];
    updateFilters({ productTypes: newProductTypes });
  };

  const toggleAvailability = (availability: string) => {
    const newAvailability = filters.availabilityStatus.includes(availability)
      ? filters.availabilityStatus.filter(a => a !== availability)
      : [...filters.availabilityStatus, availability];
    updateFilters({ availabilityStatus: newAvailability });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: [minPrice, maxPrice],
      sizes: [],
      colors: [],
      activityTypes: [],
      productTypes: [],
      availabilityStatus: [],
      showNewOnly: false,
      showSaleOnly: false,
    });
  };

  const activeFilterCount = 
    filters.categories.length +
    filters.sizes.length +
    filters.colors.length +
    filters.activityTypes.length +
    filters.productTypes.length +
    filters.availabilityStatus.length +
    (filters.showNewOnly ? 1 : 0) +
    (filters.showSaleOnly ? 1 : 0) +
    (filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Category</Label>
        <div className="space-y-2">
          {availableCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
                data-testid={`filter-category-${category.toLowerCase()}`}
              />
              <label
                htmlFor={`category-${category}`}
                className="text-sm cursor-pointer"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Price Range: £{filters.priceRange[0]} - £{filters.priceRange[1]}
        </Label>
        <Slider
          min={minPrice}
          max={maxPrice}
          step={5}
          value={filters.priceRange}
          onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
          className="w-full"
          data-testid="filter-price-range"
        />
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Size</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Size filter">
          {availableSizes.map((size) => (
            <Button
              key={size}
              type="button"
              variant={filters.sizes.includes(size) ? "default" : "outline"}
              size="sm"
              className="min-h-9 px-3"
              onClick={() => toggleSize(size)}
              aria-pressed={filters.sizes.includes(size)}
              aria-label={`Filter by size ${size}`}
              data-testid={`filter-size-${size}`}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Colours */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Colour</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Colour filter">
          {availableColors.map((color) => (
            <Button
              key={color}
              type="button"
              variant={filters.colors.includes(color) ? "default" : "outline"}
              size="sm"
              className="min-h-9 px-3"
              onClick={() => toggleColor(color)}
              aria-pressed={filters.colors.includes(color)}
              aria-label={`Filter by colour ${color}`}
              data-testid={`filter-color-${color.toLowerCase()}`}
            >
              {color}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Activity Type</Label>
        <div className="space-y-2">
          {availableActivityTypes.map((activityType) => (
            <div key={activityType} className="flex items-center space-x-2">
              <Checkbox
                id={`activity-${activityType}`}
                checked={filters.activityTypes.includes(activityType)}
                onCheckedChange={() => toggleActivityType(activityType)}
                data-testid={`filter-activity-${activityType.toLowerCase()}`}
              />
              <label
                htmlFor={`activity-${activityType}`}
                className="text-sm cursor-pointer"
              >
                {activityType}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Product Type</Label>
        <div className="space-y-2">
          {availableProductTypes.map((productType) => (
            <div key={productType} className="flex items-center space-x-2">
              <Checkbox
                id={`product-type-${productType}`}
                checked={filters.productTypes.includes(productType)}
                onCheckedChange={() => toggleProductType(productType)}
                data-testid={`filter-product-type-${productType.toLowerCase().replace(/\s+/g, '-')}`}
              />
              <label
                htmlFor={`product-type-${productType}`}
                className="text-sm cursor-pointer"
              >
                {productType}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Availability</Label>
        <div className="space-y-2">
          {availableAvailabilityStatus.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`availability-${status}`}
                checked={filters.availabilityStatus.includes(status)}
                onCheckedChange={() => toggleAvailability(status)}
                data-testid={`filter-availability-${status.toLowerCase().replace(/\s+/g, '-')}`}
              />
              <label
                htmlFor={`availability-${status}`}
                className="text-sm cursor-pointer"
              >
                {status}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Special Filters */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Special</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="new-only"
              checked={filters.showNewOnly}
              onCheckedChange={(checked) => updateFilters({ showNewOnly: !!checked })}
              data-testid="filter-new-only"
            />
            <label htmlFor="new-only" className="text-sm cursor-pointer">
              New Arrivals Only
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sale-only"
              checked={filters.showSaleOnly}
              onCheckedChange={(checked) => updateFilters({ showSaleOnly: !!checked })}
              data-testid="filter-sale-only"
            />
            <label htmlFor="sale-only" className="text-sm cursor-pointer">
              Sale Items Only
            </label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearAllFilters}
          data-testid="button-clear-filters"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-20 h-fit">
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" className="w-full min-h-11" data-testid="button-filters-mobile">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
