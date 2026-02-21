import { useState } from 'react';
import { useValuation } from '@/hooks/useValuation';

interface ValuationCardProps {
  propertyId: string;
  currentPrice?: number;
}

export function ValuationCard({ propertyId }: ValuationCardProps) {
  const {
    priceSuggestion,
    valuationReport,
    loading,
    error,
    fetchPriceSuggestion,
    fetchValuationReport
  } = useValuation(propertyId);

  const [showReport, setShowReport] = useState(false);

  const confidenceColors = {
    yuksek: 'text-green-600',
    orta: 'text-yellow-600',
    dusuk: 'text-red-600'
  };

  const trendIcons = {
    yukselis: '📈',
    durgun: '➡️',
    dusus: '📉'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">AI Degerleme</h3>

      {!priceSuggestion && !loading && (
        <button
          onClick={fetchPriceSuggestion}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
        >
          Fiyat Onerisi Al
        </button>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-2">AI analiz ediyor...</p>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {priceSuggestion && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-500">Onerilen Fiyat</p>
            <p className="text-3xl font-bold text-purple-600">
              {priceSuggestion.suggestedPrice.toLocaleString('tr-TR')} TL
            </p>
            <p className="text-sm text-gray-400">
              {priceSuggestion.priceRange.min.toLocaleString('tr-TR')} -
              {priceSuggestion.priceRange.max.toLocaleString('tr-TR')} TL
            </p>
          </div>

          <div className="flex justify-between text-sm">
            <span>Piyasa Trendi: {trendIcons[priceSuggestion.marketTrend]}</span>
            <span className={confidenceColors[priceSuggestion.confidence]}>
              Guven: {priceSuggestion.confidence.toUpperCase()}
            </span>
          </div>

          <p className="text-gray-600 text-sm">{priceSuggestion.reasoning}</p>

          {!showReport && (
            <button
              onClick={() => {
                setShowReport(true);
                fetchValuationReport();
              }}
              className="w-full border border-purple-600 text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50"
            >
              Detayli Rapor Goster
            </button>
          )}
        </div>
      )}

      {valuationReport && showReport && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <h4 className="font-semibold">Degerleme Raporu</h4>

          <div>
            <p className="text-sm font-medium text-gray-700">Piyasa Analizi</p>
            <p className="text-sm text-gray-600">{valuationReport.marketAnalysis}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-green-700">Guclu Yonler</p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {valuationReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-red-700">Zayif Yonler</p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {valuationReport.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-blue-700">Oneriler</p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {valuationReport.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
