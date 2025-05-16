import { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, CurrencyCode } from "@/lib/utils";
import { MonthlyData } from "@/types/forecasting";

interface CashFlowChartProps {
  data: MonthlyData[];
  currencyCode: CurrencyCode;
}

function CashFlowChart({ data, currencyCode }: CashFlowChartProps) {
  const historicalData = data.filter((d) => !d.isProjected);
  const forecastData = data.filter((d) => d.isProjected);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(value) =>
              formatCurrency(value, currencyCode, { compact: true })
            }
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currencyCode)}
          />
          <Legend />
          {/* Historical Data */}
          <Line
            type="monotone"
            dataKey="income"
            name="Income (Historical)"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            data={historicalData}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses (Historical)"
            stroke="#f87171"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            data={historicalData}
          />
          <Line
            type="monotone"
            dataKey="savings"
            name="Savings (Historical)"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            data={historicalData}
          />
          {/* Forecast Data */}
          <Line
            type="monotone"
            dataKey="income"
            name="Income (Forecast)"
            stroke="#4ade80"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            data={forecastData}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses (Forecast)"
            stroke="#f87171"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            data={forecastData}
          />
          <Line
            type="monotone"
            dataKey="savings"
            name="Savings (Forecast)"
            stroke="#60a5fa"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            data={forecastData}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(CashFlowChart);
