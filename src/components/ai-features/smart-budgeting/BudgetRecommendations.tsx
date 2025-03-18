import { BudgetRecommendation, CompanySettings } from '@/hooks/useBudgetingData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CURRENCY_CONFIG } from '@/lib/utils';
import {
  Lightbulb,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

interface BudgetRecommendationsProps {
  recommendations: BudgetRecommendation[];
  settings: CompanySettings | null;
}

export default function BudgetRecommendations({ recommendations, settings }: BudgetRecommendationsProps) {
  const currencyCode = settings?.default_currency || 'USD';
  
  // Format currency based on settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currencyCode].locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get difficulty badge
  const getDifficultyBadge = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-500">Easy</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      case 'hard':
        return <Badge className="bg-red-500">Hard</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">AI Budget Recommendations</h3>
            <p className="text-sm text-blue-700">
              Based on your spending patterns and financial situation, we've identified these
              potential opportunities to improve your financial health.
            </p>
          </div>
        </div>
      </div>

      {recommendations.map((recommendation) => (
        <Card key={recommendation.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div 
                className="p-2 rounded-full bg-purple-100 text-purple-600 flex-shrink-0"
                style={{ 
                  backgroundColor: recommendation.categoryColor ? `${recommendation.categoryColor}20` : '#f3e8ff',
                  color: recommendation.categoryColor || '#9333ea'  
                }}
              >
                <TrendingDown className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{recommendation.title}</h3>
                  {getDifficultyBadge(recommendation.difficulty)}
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">{recommendation.description}</p>
                
                <div className="flex justify-between items-center">
                  <div>
                    {recommendation.category && (
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: recommendation.categoryColor || '#888' }}
                        />
                        <span className="text-sm text-muted-foreground">{recommendation.category}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">
                      Potential Impact: {formatCurrency(recommendation.impact)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 