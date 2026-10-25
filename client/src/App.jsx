import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    fetch("/api/stocks/AAPL/prices")
      .then((res) => res.json())
      .then(setPrices);
  }, []);

  return (
    <main>
      <h1>Chart the Stock Market</h1>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={prices}>
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
          <Line dataKey="close" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <p>
        Data provided by <a href="https://marketstack.com">Marketstack</a>
      </p>
    </main>
  );
}

export default App;
