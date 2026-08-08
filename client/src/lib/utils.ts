import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

// Size ordering for consistent display across the application (S, M, L, XL order)
const SIZE_ORDER: Record<string, number> = {
  'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, 'XXXL': 8, '3XL': 8,
  '4': 10, '6': 11, '8': 12, '10': 13, '12': 14, '14': 15, '16': 16, '18': 17, '20': 18,
  'ONE SIZE': 100, 'OS': 100,
};

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const upperA = a.toUpperCase();
    const upperB = b.toUpperCase();
    const orderA = SIZE_ORDER[upperA] ?? 999;
    const orderB = SIZE_ORDER[upperB] ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
}

export function getSizeOrder(size: string): number {
  return SIZE_ORDER[size.toUpperCase()] ?? 999;
}
