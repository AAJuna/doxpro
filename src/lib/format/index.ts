import type { Currency } from "@/types";

const currencyLocale: Record<Currency, string> = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
  SGD: "en-SG",
  MYR: "ms-MY",
};

export function formatCurrency(amount: number, currency: Currency = "IDR"): string {
  return new Intl.NumberFormat(currencyLocale[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(amount);
}

export function formatNumber(amount: number, locale: string = "id-ID"): string {
  return new Intl.NumberFormat(locale).format(amount);
}

export function formatDate(date: string | Date, locale: string = "id-ID"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date, locale: string = "id-ID"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function terbilang(amount: number): string {
  const angka = Math.floor(Math.abs(amount));
  if (angka === 0) return "Nol Rupiah";

  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function read(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return read(n - 10) + " Belas";
    if (n < 100) return read(Math.floor(n / 10)) + " Puluh" + (n % 10 ? " " + read(n % 10) : "");
    if (n < 200) return "Seratus" + (n - 100 ? " " + read(n - 100) : "");
    if (n < 1000)
      return read(Math.floor(n / 100)) + " Ratus" + (n % 100 ? " " + read(n % 100) : "");
    if (n < 2000) return "Seribu" + (n - 1000 ? " " + read(n - 1000) : "");
    if (n < 1_000_000)
      return read(Math.floor(n / 1000)) + " Ribu" + (n % 1000 ? " " + read(n % 1000) : "");
    if (n < 1_000_000_000)
      return (
        read(Math.floor(n / 1_000_000)) +
        " Juta" +
        (n % 1_000_000 ? " " + read(n % 1_000_000) : "")
      );
    if (n < 1_000_000_000_000)
      return (
        read(Math.floor(n / 1_000_000_000)) +
        " Milyar" +
        (n % 1_000_000_000 ? " " + read(n % 1_000_000_000) : "")
      );
    return (
      read(Math.floor(n / 1_000_000_000_000)) +
      " Trilyun" +
      (n % 1_000_000_000_000 ? " " + read(n % 1_000_000_000_000) : "")
    );
  }

  return read(angka).trim() + " Rupiah";
}
