// Helpers de moneda para la app multi-moneda (ARS / USD). No se convierte entre
// monedas (no inventamos tipo de cambio): cada total se muestra en su moneda.

export function currencySymbol(currency: string): string {
  return currency === "USD" ? "US$" : "$";
}

// Formatea un monto con su símbolo y separador de miles rioplatense.
export function formatMoney(amount: number, currency: string = "ARS"): string {
  return `${currencySymbol(currency)}${Math.round(amount).toLocaleString("es-AR")}`;
}

// Suma una lista de ítems agrupando por moneda.
export function sumByCurrency<T>(
  items: T[],
  getAmount: (item: T) => number,
  getCurrency: (item: T) => string,
): Record<string, number> {
  return items.reduce((acc, item) => {
    const c = getCurrency(item) || "ARS";
    acc[c] = (acc[c] || 0) + Number(getAmount(item));
    return acc;
  }, {} as Record<string, number>);
}

// Convierte un {ARS: 1000, USD: 50} en "$1.000 · US$50". Muestra solo las
// monedas con monto distinto de cero; si todo es cero, "$0".
export function formatByCurrency(byCurrency: Record<string, number>): string {
  const order = ["ARS", "USD"];
  const keys = [...order, ...Object.keys(byCurrency).filter((k) => !order.includes(k))];
  const parts = keys
    .filter((c) => (byCurrency[c] ?? 0) !== 0)
    .map((c) => formatMoney(byCurrency[c], c));
  return parts.length ? parts.join(" · ") : "$0";
}
