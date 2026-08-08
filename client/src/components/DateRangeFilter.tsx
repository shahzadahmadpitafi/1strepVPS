import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, X } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type DateRangePreset = "all" | "7days" | "30days" | "90days" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateChange: (start: Date | undefined, end: Date | undefined) => void;
  className?: string;
}

function detectPreset(start: Date | undefined, end: Date | undefined): DateRangePreset {
  if (!start && !end) return "all";
  if (!start || !end) return "custom";
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const startNormalized = new Date(start);
  startNormalized.setHours(0, 0, 0, 0);
  const endNormalized = new Date(end);
  endNormalized.setHours(23, 59, 59, 999);
  
  const daysDiff = Math.round((endNormalized.getTime() - startNormalized.getTime()) / (1000 * 60 * 60 * 24));
  const daysFromToday = Math.round((today.getTime() - endNormalized.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check for day-based presets
  if (daysFromToday <= 1) {
    if (daysDiff >= 6 && daysDiff <= 8) return "7days";
    if (daysDiff >= 29 && daysDiff <= 31) return "30days";
    if (daysDiff >= 89 && daysDiff <= 91) return "90days";
  }
  
  // Check for this month
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  if (isSameDay(startNormalized, thisMonthStart) && isSameDay(endNormalized, thisMonthEnd)) {
    return "thisMonth";
  }
  
  // Check for last month
  const lastMonth = subMonths(today, 1);
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);
  if (isSameDay(startNormalized, lastMonthStart) && isSameDay(endNormalized, lastMonthEnd)) {
    return "lastMonth";
  }
  
  // Check for this year
  const thisYearStart = startOfYear(today);
  if (isSameDay(startNormalized, thisYearStart) && daysFromToday <= 1) {
    return "thisYear";
  }
  
  return "custom";
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function DateRangeFilter({ startDate, endDate, onDateChange, className }: DateRangeFilterProps) {
  const [preset, setPreset] = useState<DateRangePreset>(() => detectPreset(startDate, endDate));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setPreset(detectPreset(startDate, endDate));
  }, [startDate, endDate]);

  const handlePresetChange = (value: DateRangePreset) => {
    setPreset(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    switch (value) {
      case "all":
        onDateChange(undefined, undefined);
        break;
      case "7days":
        onDateChange(subDays(today, 7), today);
        break;
      case "30days":
        onDateChange(subDays(today, 30), today);
        break;
      case "90days":
        onDateChange(subDays(today, 90), today);
        break;
      case "thisMonth":
        onDateChange(startOfMonth(today), endOfMonth(today));
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        onDateChange(startOfMonth(lastMonth), endOfMonth(lastMonth));
        break;
      case "thisYear":
        onDateChange(startOfYear(today), today);
        break;
      case "custom":
        break;
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      const start = new Date(range.from);
      start.setHours(0, 0, 0, 0);
      
      let end = range.to ? new Date(range.to) : new Date(range.from);
      end.setHours(23, 59, 59, 999);
      
      onDateChange(start, end);
      setPreset("custom");
      
      if (range.to) {
        setIsCalendarOpen(false);
      }
    }
  };

  const handleClear = () => {
    setPreset("all");
    onDateChange(undefined, undefined);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "All time";
    if (startDate && endDate) {
      return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
    if (startDate) return format(startDate, "MMM d, yyyy");
    return "All time";
  };

  const presetLabels: Record<DateRangePreset, string> = {
    "all": "All time",
    "7days": "Last 7 days",
    "30days": "Last 30 days",
    "90days": "Last 90 days",
    "thisMonth": "This month",
    "lastMonth": "Last month",
    "thisYear": "This year",
    "custom": "Custom range"
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[140px]" data-testid="select-date-preset">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7days">Last 7 days</SelectItem>
          <SelectItem value="30days">Last 30 days</SelectItem>
          <SelectItem value="90days">Last 90 days</SelectItem>
          <SelectItem value="thisMonth">This month</SelectItem>
          <SelectItem value="lastMonth">Last month</SelectItem>
          <SelectItem value="thisYear">This year</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[240px]",
              !startDate && "text-muted-foreground"
            )}
            data-testid="button-date-range-picker"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-9 w-9"
          data-testid="button-clear-date-filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
