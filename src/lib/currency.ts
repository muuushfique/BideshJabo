import type { CurrencyFormatMode, ExchangeRateDTO } from "./types";

export const DEFAULT_EXCHANGE_RATES: Record<string, { symbol: string; rateToBdt: number; name: string }> = {
  EUR: { symbol: "€", rateToBdt: 132.0, name: "Euro" },
  USD: { symbol: "$", rateToBdt: 122.0, name: "US Dollar" },
  GBP: { symbol: "£", rateToBdt: 155.0, name: "British Pound" },
  CAD: { symbol: "CA$", rateToBdt: 88.0, name: "Canadian Dollar" },
  AUD: { symbol: "A$", rateToBdt: 79.0, name: "Australian Dollar" },
  SEK: { symbol: "SEK", rateToBdt: 11.6, name: "Swedish Krona" },
  NOK: { symbol: "NOK", rateToBdt: 11.2, name: "Norwegian Krone" },
  DKK: { symbol: "DKK", rateToBdt: 17.7, name: "Danish Krone" },
  PLN: { symbol: "PLN", rateToBdt: 31.2, name: "Polish Zloty" },
  KRW: { symbol: "₩", rateToBdt: 0.088, name: "South Korean Won" },
  TWD: { symbol: "NT$", rateToBdt: 3.8, name: "New Taiwan Dollar" },
  JPY: { symbol: "¥", rateToBdt: 0.81, name: "Japanese Yen" },
  BDT: { symbol: "৳", rateToBdt: 1.0, name: "Bangladeshi Taka" },
};

export function buildRateMap(rates: ExchangeRateDTO[]): Record<string, ExchangeRateDTO> {
  const map: Record<string, ExchangeRateDTO> = {};
  for (const r of rates) {
    map[r.code.toUpperCase()] = r;
  }
  return map;
}

export function convertToBdt(
  amount: number,
  currencyCode: string,
  rateMap?: Record<string, ExchangeRateDTO>
): number {
  const code = currencyCode.toUpperCase();
  if (code === "BDT") return amount;
  const rate =
    rateMap?.[code]?.rateToBdt ??
    DEFAULT_EXCHANGE_RATES[code]?.rateToBdt ??
    1;
  return amount * rate;
}

export function formatLocalCurrency(
  amount: number,
  currencyCode: string,
  rateMap?: Record<string, ExchangeRateDTO>
): string {
  const code = currencyCode.toUpperCase();
  const symbol =
    rateMap?.[code]?.symbol ?? DEFAULT_EXCHANGE_RATES[code]?.symbol ?? code;
  const rounded =
    Math.abs(amount) >= 100
      ? Math.round(amount).toLocaleString("en-US")
      : Number(amount.toFixed(2)).toLocaleString("en-US", {
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        });

  if (["SEK", "NOK", "DKK", "PLN"].includes(code)) {
    return `${rounded} ${code}`;
  }
  if (code === "CAD" || code === "AUD") {
    return `${symbol}${rounded}`;
  }
  return `${symbol}${rounded}`;
}

export function formatBdt(bdtAmount: number, mode: CurrencyFormatMode = "compact"): string {
  const abs = Math.abs(bdtAmount);
  const sign = bdtAmount < 0 ? "-" : "";

  if (mode === "exact") {
    return `${sign}${Math.round(abs).toLocaleString("en-IN")} BDT`;
  }

  if (abs >= 10_000_000) {
    return `${sign}${(abs / 10_000_000).toFixed(2)}Cr BDT`;
  }
  if (abs >= 100_000) {
    return `${sign}${(abs / 100_000).toFixed(1)}L BDT`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}k BDT`;
  }
  return `${sign}${Math.round(abs).toLocaleString("en-IN")} BDT`;
}
