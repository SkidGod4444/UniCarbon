import React, { useEffect, useState } from "react";
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";

// Generate random numbers with normal distribution (mean 0, standard deviation 1)
function randn_bm() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Convert [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Helper function to generate price data points with fluctuations
function generatePriceData(initialPrice: number, currentPrice: number, period: string) {
  const dataPoints: { name: string; value: number }[] = [];
  let numDataPoints;

  // Determine number of data points based on period
  switch (period) {
    case "1m": // 1 month (30 days, 1 data point per day)
      numDataPoints = 30;
      break;
    case "6m": // 6 months (180 days)
      numDataPoints = 180;
      break;
    case "1y": // 1 year (365 days)
      numDataPoints = 365;
      break;
    case "All": // All time (simulating around 2 years)
      numDataPoints = 730;
      break;
    default:
      numDataPoints = 30;
  }

  const volatility = 0.1; // Adjust this value for more or less volatility

  for (let i = 0; i < numDataPoints; i++) {
    const date = `${i + 1}`;
    const t = i / (numDataPoints - 1); // time fraction from 0 to 1

    // Expected price at time t (linear interpolation)
    const expectedPrice = initialPrice + t * (currentPrice - initialPrice);

    // Standard deviation of fluctuations
    const sigma =
      volatility *
      Math.sqrt((1 - t) * t) *
      Math.abs(currentPrice - initialPrice);

    // Random fluctuation using normal distribution
    const fluctuation = randn_bm() * sigma;

    // New price with fluctuation
    let newPrice = expectedPrice + fluctuation;

    // Ensure the price stays within reasonable bounds
    newPrice = Math.max(0, newPrice);

    // Force the first price to be the initialPrice
    if (i === 0) {
      newPrice = initialPrice;
    }

    // Force the last price to be the currentPrice
    if (i === numDataPoints - 1) {
      newPrice = currentPrice;
    }

    dataPoints.push({
      name: date,
      value: newPrice, // Store as number, not string
    });
  }

  return dataPoints;
}

// Define types for the PriceChart component props
interface PriceChartProps {
  initialPrice: number;
  currentPrice: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ initialPrice, currentPrice }) => {
  const [period, setPeriod] = useState("1m");
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const generatedData = generatePriceData(initialPrice, currentPrice, period);
    setData(generatedData);
  }, [period, initialPrice, currentPrice]);

  // **Compute the minimum and maximum values from the data**
  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  // **Set the Y-axis domain with extra height**
  const minValue = dataMin * 0.9; // Start slightly below the minimum data value
  const maxValue = Math.max(
    dataMax * 1.1,
    currentPrice * 1.5,
    currentPrice + 20
  ); // Add extra space above the maximum data value

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <h2 className="mb-0 text-xl font-bold">Property Price</h2>
        <div className="flex flex-row items-center gap-x-3">
          <button
            onClick={() => setPeriod("1m")}
            className={
              period === "1m"
                ? "px-4 py-1 text-sm font-bold rounded-lg  bg-alpha text-beta border-0 border-black text-white"
                : "px-4 py-1 text-sm font-bold rounded-lg  bg-gamma text-alpha border-0 border-black"
            }
          >
            1M
          </button>
          <button
            onClick={() => setPeriod("6m")}
            className={
              period === "6m"
                ? "px-4 py-1 text-sm font-bold rounded-lg  bg-alpha text-beta border-0 border-black text-white"
                : "px-4 py-1 text-sm font-bold rounded-lg  bg-gamma text-alpha border-0 border-black"
            }
          >
            6M
          </button>
          <button
            onClick={() => setPeriod("1y")}
            className={
              period === "1y"
                ? "px-4 py-1 text-sm font-bold rounded-lg  bg-alpha text-beta border-0 border-black text-white"
                : "px-4 py-1 text-sm font-bold rounded-lg  bg-gamma text-alpha border-0 border-black"
            }
          >
            1Y
          </button>
          <button
            onClick={() => setPeriod("All")}
            className={
              period === "All"
                ? "px-4 py-1 text-sm font-bold rounded-lg  bg-alpha text-beta border-0 border-black text-white"
                : "px-4 py-1 text-sm font-bold rounded-lg  bg-gamma text-alpha border-0 border-black"
            }
          >
            All Time
          </button>
        </div>
      </div>
      {/* divider */}
      <div className="pt-3 pb-4 my-0 divider before:bg-black/10 after:bg-black/10"></div>
      <div className="pt-1 pr-6 mb-6 rounded-lg bg-">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis dataKey="name" />
            <YAxis domain={[minValue, maxValue]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#000000"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default PriceChart;
