const BASE_URL = 'https://api.marketstack.com/v2/eod';

export async function fetchDailyPrices(symbol) {
  const url = new URL(BASE_URL);
  url.searchParams.set('access_key', process.env.MARKETSTACK_API_KEY);
  url.searchParams.set('symbols', symbol);

  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error?.message || `Marketstack error ${response.status}`);
  }

  return body.data.map((row) => ({
    date: row.date.slice(0, 10),
    close: row.close ?? row.adj_close,
  }))
    .filter(row => row.close !== null && row.close !== undefined);
}