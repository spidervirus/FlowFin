import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, CurrencyCode } from '@/lib/utils';

interface CategoryForecast {
  category: string;
  categoryId: string;
  color: string;
  current: number;
  forecast: number;
  change: number;
  trend: "up" | "down" | "stable";
}

interface CategoryChartProps {
  data: CategoryForecast[];
  currencyCode: CurrencyCode;
}

function CategoryChartComponent({ data, currencyCode }: CategoryChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.slice(0, 8)} // Show top 8 categories
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => formatCurrency(value, currencyCode, { compact: true })} 
          />
          <YAxis type="category" dataKey="category" width={100} />
          <Tooltip 
            formatter={(value) => formatCurrency(Number(value), currencyCode)} 
            labelFormatter={(label) => `Category: ${label}`}
          />
          <Legend />
          <Bar dataKey="current" name="Current Monthly" fill="#94a3b8" />
          <Bar dataKey="forecast" name="Forecast" fill="#818cf8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const CategoryChart = memo(CategoryChartComponent);
export default CategoryChart; 