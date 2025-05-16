"use client";

import { useState } from "react";
import { Category } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface TransactionFiltersProps {
  categories: Category[];
  onFilterChange: (filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    type?: "all" | "income" | "expense";
  }) => void;
}

export function TransactionFilters({
  categories,
  onFilterChange,
}: TransactionFiltersProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [transactionType, setTransactionType] = useState<
    "all" | "income" | "expense"
  >("all");

  const handleDateChange = (type: "start" | "end", date?: Date) => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    onFilterChange({
      startDate: type === "start" ? date : startDate,
      endDate: type === "end" ? date : endDate,
      category: selectedCategory,
      type: transactionType,
    });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onFilterChange({
      startDate,
      endDate,
      category: value,
      type: transactionType,
    });
  };

  const handleTypeChange = (value: "all" | "income" | "expense") => {
    setTransactionType(value);
    onFilterChange({
      startDate,
      endDate,
      category: selectedCategory,
      type: value,
    });
  };

  return (
    <div className="flex gap-4 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "PPP") : "Start Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => handleDateChange("start", date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "PPP") : "End Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => handleDateChange("end", date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleTypeChange} defaultValue="all">
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Transaction Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
