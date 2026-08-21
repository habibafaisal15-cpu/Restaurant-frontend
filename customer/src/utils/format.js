export const formatCurrency = (amount, currency = 'PKR') => {
  const num = Number(amount);
  const safe = Number.isFinite(num) ? num : 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(safe);
  return `${currency} ${formatted}`;
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
};
