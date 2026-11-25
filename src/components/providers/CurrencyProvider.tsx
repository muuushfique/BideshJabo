"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildRateMap } from "@/lib/currency";
import type {
  CountryDTO,
  CurrencyFormatMode,
  ExchangeRateDTO,
  LifestyleTierKey,
} from "@/lib/types";

interface PlatformContextValue {
  rates: ExchangeRateDTO[];
  rateMap: Record<string, ExchangeRateDTO>;
  countries: CountryDTO[];
  formatMode: CurrencyFormatMode;
  toggleFormatMode: () => void;
  lifestyleTier: LifestyleTierKey;
  setLifestyleTier: (tier: LifestyleTierKey) => void;
  refreshPlatformData: () => Promise<void>;
  isLoading: boolean;
}

const PlatformContext = createContext<PlatformContextValue>({
  rates: [],
  rateMap: {},
  countries: [],
  formatMode: "compact",
  toggleFormatMode: () => {},
  lifestyleTier: "balanced",
  setLifestyleTier: () => {},
  refreshPlatformData: async () => {},
  isLoading: true,
});

export function CurrencyProvider({
  children,
  initialRates,
  initialCountries,
}: {
  children: React.ReactNode;
  initialRates: ExchangeRateDTO[];
  initialCountries: CountryDTO[];
}) {
  const [rates, setRates] = useState<ExchangeRateDTO[]>(initialRates);
  const [countries, setCountries] = useState<CountryDTO[]>(initialCountries);
  const [formatMode, setFormatMode] = useState<CurrencyFormatMode>("compact");
  const [lifestyleTier, setLifestyleTier] = useState<LifestyleTierKey>("balanced");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("bideshjabo_bdt_mode") as CurrencyFormatMode | null;
    if (savedMode === "exact" || savedMode === "compact") {
      setFormatMode(savedMode);
    }
    const savedTier = localStorage.getItem("bideshjabo_lifestyle") as LifestyleTierKey | null;
    if (savedTier === "frugal" || savedTier === "balanced" || savedTier === "comfortable") {
      setLifestyleTier(savedTier);
    }
  }, []);

  const toggleFormatMode = useCallback(() => {
    setFormatMode((prev) => {
      const next = prev === "compact" ? "exact" : "compact";
      localStorage.setItem("bideshjabo_bdt_mode", next);
      return next;
    });
  }, []);

  const handleSetLifestyleTier = useCallback((tier: LifestyleTierKey) => {
    setLifestyleTier(tier);
    localStorage.setItem("bideshjabo_lifestyle", tier);
  }, []);

  const refreshPlatformData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.exchangeRates)) setRates(data.exchangeRates);
        if (Array.isArray(data.countries)) setCountries(data.countries);
      }
    } catch (e) {
      console.error("Failed to refresh platform data:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rateMap = useMemo(() => buildRateMap(rates), [rates]);

  return (
    <PlatformContext.Provider
      value={{
        rates,
        rateMap,
        countries,
        formatMode,
        toggleFormatMode,
        lifestyleTier,
        setLifestyleTier: handleSetLifestyleTier,
        refreshPlatformData,
        isLoading,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function useCurrency() {
  return useContext(PlatformContext);
}
