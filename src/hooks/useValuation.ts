import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface PriceSuggestion {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
  marketTrend: 'yukselis' | 'durgun' | 'dusus';
  confidence: 'yuksek' | 'orta' | 'dusuk';
  comparableProperties: Array<{
    title: string;
    price: number;
    similarity: string;
  }>;
}

interface ValuationReport {
  propertyId: string;
  estimatedValue: number;
  valueRange: { min: number; max: number };
  marketAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  comparativeAnalysis: string;
  marketTrend: string;
  confidence: 'yuksek' | 'orta' | 'dusuk';
}

export function useValuation(propertyId: string) {
  const { user } = useAuth();
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  const [valuationReport, setValuationReport] = useState<ValuationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceSuggestion = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const fn = httpsCallable(functions, 'generatePriceSuggestion');
      const result = await fn({ propertyId, userId: user.uid });
      setPriceSuggestion(result.data as PriceSuggestion);
    } catch (err) {
      setError('Fiyat onerisi alinamadi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, user]);

  const fetchValuationReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const fn = httpsCallable(functions, 'generateValuationReport');
      const result = await fn({ propertyId, userId: user.uid });
      setValuationReport(result.data as ValuationReport);
    } catch (err) {
      setError('Degerleme raporu alinamadi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, user]);

  return {
    priceSuggestion,
    valuationReport,
    loading,
    error,
    fetchPriceSuggestion,
    fetchValuationReport
  };
}
