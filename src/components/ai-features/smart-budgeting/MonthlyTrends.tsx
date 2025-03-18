import { MonthlyTrendsData, CompanySettings } from '@/hooks/useBudgetingData';
import { Card, CardContent } from '@/components/ui/card';
import { CURRENCY_CONFIG } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyTrendsProps {
  data: MonthlyTrendsData;
  settings: CompanySettings | null;
}

export default function MonthlyTrends({ data, settings }: MonthlyTrendsProps) {
  const currencyCode = settings?.default_currency || 'USD';
  
  // Format currency for chart labels
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currencyCode].locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Chart options
  const overviewOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
  };
  
  // Category chart options
  const categoryOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          }
        }
      },
      x: {
        stacked: true
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
  };
  
  // Overview chart data
  const overviewData = {
    labels: data.months,
    datasets: [
      {
        label: 'Income',
        data: data.income,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.2,
      },
      {
        label: 'Expenses',
        data: data.expenses,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.2,
      },
      {
        label: 'Savings',
        data: data.savings,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.2,
      }
    ],
  };
  
  // Category chart data
  const categoryData = {
    labels: data.months,
    datasets: data.categories.map((category) => ({
      label: category.name,
      data: category.values,
      backgroundColor: category.color || '#888',
    })),
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="h-[400px]">
              <Line options={overviewOptions} data={overviewData} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="categories" className="mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="h-[400px]">
              <Bar options={categoryOptions} data={categoryData} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 