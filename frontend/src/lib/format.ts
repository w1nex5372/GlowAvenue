const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

export function formatPrice(value: number): string {
  return gbp.format(Number.isFinite(value) ? value : 0);
}
