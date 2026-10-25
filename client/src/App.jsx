import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const COLORS = [
  "#0072B2",
  "#D55E00",
  "#009E73",
  "#CC79A7",
  "#E69F00",
  "#56B4E9",
  "#9467BD",
  "#999999",
  "#8C564B",
  "#17BECF",
];

async function loadChart() {
  const list = await fetch("/api/stocks").then((res) => res.json());
  const symbols = list.map((stock) => stock.symbol);

  const byDate = {};
  for (const symbol of symbols) {
    const prices = await fetch(`/api/stocks/${symbol}/prices`).then((res) =>
      res.json(),
    );
    for (const { date, close } of prices) {
      byDate[date] = { ...byDate[date], date, [symbol]: close };
    }
  }

  const data = Object.values(byDate).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  return { symbols, data };
}

function App() {
  const [symbols, setSymbols] = useState([]);
  const [data, setData] = useState([]);
  const [version, setVersion] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadChart().then((result) => {
      setSymbols(result.symbols);
      setData(result.data);
    });
  }, [version]);

    useEffect(() => {
    let socket;
    let retryTimer;
    let stopped = false;

    function connect() {
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
      socket = new WebSocket(`${protocol}://${location.host}/ws`);
      socket.onopen = () => setVersion((v) => v + 1);
      socket.onmessage = () => setVersion((v) => v + 1);
      socket.onclose = () => {
        if (!stopped) retryTimer = setTimeout(connect, 2000);
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      socket.close();
    };
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    setError("");
    setAdding(true);

    const res = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: input }),
    });

    setAdding(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong. Please try again.");
      return;
    }

    setInput("");
    setVersion((v) => v + 1);
  }

  async function handleRemove(symbol) {
    await fetch(`/api/stocks/${symbol}`, { method: "DELETE" });
    setVersion((v) => v + 1);
  }

  return (
    <main>
      <h1>Chart the Stock Market</h1>

      <form onSubmit={handleAdd}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Stock symbol, e.g. TSLA"
          aria-label="Stock symbol"
        />
        <button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul className="stock-list">
        {symbols.map((symbol, i) => (
          <li
            key={symbol}
            className="stock-tag"
            style={{ "--stock-color": COLORS[i] }}
          >
            {symbol}{" "}
            <button
              onClick={() => handleRemove(symbol)}
              aria-label={`Remove ${symbol}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={(d) =>
              new Date(`${d}T00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            minTickGap={20}
          />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          {symbols.map((symbol, i) => (
            <Line
              key={symbol}
              dataKey={symbol}
              stroke={COLORS[i]}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p>
        Data provided by <a href="https://marketstack.com">Marketstack</a>
      </p>
    </main>
  );
}

export default App;
