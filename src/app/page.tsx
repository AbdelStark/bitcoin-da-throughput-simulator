"use client";

import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { saveAs } from "file-saver"; // Only if you want an easy CSV export

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Simulation mode type
type SimulationMode = "manual" | "query";

export default function HomePage() {
  // --- Simulation Parameters State ---
  // Bitcoin parameters
  const [bitcoinBlockSizeMB, setBitcoinBlockSizeMB] = useState<number>(4);
  const [bitcoinUtilization, setBitcoinUtilization] = useState<number>(100);
  const BITCOIN_BLOCK_TIME = 600; // 10 minutes

  // Simulation mode
  const [simulationMode, setSimulationMode] =
    useState<SimulationMode>("manual");

  // Manual TPS mode
  const [manualTPS, setManualTPS] = useState<number>(270);
  const [stateUpdateInterval, setStateUpdateInterval] = useState<number>(50);

  // Query mode
  const [queryStartBlock, setQueryStartBlock] = useState<number | "">("");
  const [queryEndBlock, setQueryEndBlock] = useState<number | "">("");
  const [queryTxCount, setQueryTxCount] = useState<number>(13516);
  const [queryTimeInterval, setQueryTimeInterval] = useState<number>(50);

  // Blob parameters
  const [numberOfBlobs, setNumberOfBlobs] = useState<number>(3);
  const [blobSizeKB, setBlobSizeKB] = useState<number>(128);

  // Cost parameters
  const [satsPerVByte, setVsatsPerByte] = useState<number>(1);
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(100000);

  // --- Derived Values Calculation ---
  const totalDataBytes = numberOfBlobs * blobSizeKB * 1024;
  const txPerUpdate =
    simulationMode === "manual"
      ? manualTPS * stateUpdateInterval
      : queryTxCount;

  const avgDataPerTx = txPerUpdate > 0 ? totalDataBytes / txPerUpdate : 0;
  const effectiveBlockBytes =
    bitcoinBlockSizeMB * 1024 * 1024 * (bitcoinUtilization / 100);
  const bitcoinThroughput = effectiveBlockBytes / BITCOIN_BLOCK_TIME;
  const simulatedBitcoinTPS =
    avgDataPerTx > 0 ? bitcoinThroughput / avgDataPerTx : 0;

  const costSats = totalDataBytes * satsPerVByte;
  const costBTC = costSats / 100_000_000;
  const costUSD = costBTC * bitcoinPrice;

  const ethereumTPS =
    simulationMode === "manual"
      ? manualTPS
      : queryTimeInterval > 0
      ? queryTxCount / queryTimeInterval
      : 0;

  // Chart Data
  const chartData = {
    labels: ["Starknet Ethereum", "Starknet Bitcoin"],
    datasets: [
      {
        label: "Transactions per Second",
        data: [ethereumTPS, simulatedBitcoinTPS],
        backgroundColor: ["#00ff00", "#f7931a"], // neon green & bitcoin orange
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#fff", // white text for legend
          font: {
            family: "'Press Start 2P', monospace",
          },
        },
      },
      title: {
        display: true,
        text: "L2 TPS Comparison",
        color: "#fff",
        font: {
          family: "'Press Start 2P', monospace",
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#fff",
          font: {
            family: "'Press Start 2P', monospace",
            size: 10,
          },
        },
      },
      y: {
        ticks: {
          color: "#fff",
          font: {
            family: "'Press Start 2P', monospace",
            size: 10,
          },
        },
      },
    },
  };

  // "Run Simulation" just triggers a re-render, so no special logic needed
  const handleRunSimulation = () => {
    // In a real app, you might do more here, but re-render is enough for derived calculations
  };

  // For query mode, we can simulate a block range fetch
  const handleQueryBlockRange = () => {
    // If you had a real backend or API, you'd fetch data here
    // For now, just do a console.log or set some dummy data
    console.log(
      "Querying block range start:",
      queryStartBlock,
      "end:",
      queryEndBlock,
    );
    // We'll assume it's immediate. Real usage might set loading states, etc.
  };

  // Export to CSV function for user-friendly saving
  const handleExportCSV = () => {
    const rows = [
      ["Parameter", "Value"],
      ["Bitcoin Block Size (MB)", bitcoinBlockSizeMB],
      ["Bitcoin Block Utilization (%)", bitcoinUtilization],
      ["Simulation Mode", simulationMode],
      ["Manual TPS", manualTPS],
      ["Block Range Interval (s)", stateUpdateInterval],
      ["Query Start Block", queryStartBlock],
      ["Query End Block", queryEndBlock],
      ["Query Tx Count", queryTxCount],
      ["Query Time Interval", queryTimeInterval],
      ["# Blobs per Update", numberOfBlobs],
      ["Blob Size (KB)", blobSizeKB],
      ["vsats per byte", satsPerVByte],
      ["Bitcoin Price (USD)", bitcoinPrice],
      ["Total Data (bytes)", totalDataBytes],
      ["Transactions per Update", txPerUpdate],
      ["Avg Data per Tx (bytes)", avgDataPerTx.toFixed(2)],
      ["Bitcoin Throughput (bytes/s)", bitcoinThroughput.toFixed(2)],
      ["Simulated Bitcoin L2 TPS", simulatedBitcoinTPS.toFixed(2)],
      ["Cost in sats", costSats.toFixed(0)],
      ["Cost in BTC", costBTC.toFixed(8)],
      ["Cost in USD", costUSD.toFixed(2)],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");

    // Using FileSaver for convenience:
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "simulation_results.csv");
  };

  return (
    <main className="main-layout" style={{ padding: "0 1rem" }}>
      {/* Left column: Controls */}
      <section className="sim-controls-panel nes-container is-dark">
        <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>
          Simulation Parameters
        </h2>

        {/* Bitcoin Block Settings */}
        <div className="nes-field" style={{ marginBottom: "1rem" }}>
          <label htmlFor="bitcoinBlockSize">Bitcoin Block Size (MB)</label>
          <input
            type="range"
            className="pixel-slider"
            id="bitcoinBlockSize"
            min={1}
            max={8}
            step={0.5}
            value={bitcoinBlockSizeMB}
            onChange={(e) => setBitcoinBlockSizeMB(Number(e.target.value))}
          />
          <span style={{ fontSize: "0.8rem" }}>{bitcoinBlockSizeMB} MB</span>
        </div>

        <div className="nes-field" style={{ marginBottom: "1rem" }}>
          <label htmlFor="bitcoinUtilization">
            Bitcoin Block Utilization (%)
          </label>
          <input
            type="range"
            className="pixel-slider"
            id="bitcoinUtilization"
            min={0}
            max={100}
            step={5}
            value={bitcoinUtilization}
            onChange={(e) => setBitcoinUtilization(Number(e.target.value))}
          />
          <span style={{ fontSize: "0.8rem" }}>{bitcoinUtilization}%</span>
        </div>

        {/* Simulation Mode */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>Simulation Mode:</p>
          <label style={{ marginRight: "1rem" }}>
            <input
              type="radio"
              className="nes-radio"
              name="mode"
              value="manual"
              checked={simulationMode === "manual"}
              onChange={() => setSimulationMode("manual")}
            />
            <span>Manual TPS</span>
          </label>
          <label>
            <input
              type="radio"
              className="nes-radio"
              name="mode"
              value="query"
              checked={simulationMode === "query"}
              onChange={() => setSimulationMode("query")}
            />
            <span>Query by Block Range</span>
          </label>
        </div>

        {/* Mode-Specific Inputs */}
        {simulationMode === "manual" ? (
          <div>
            <div className="nes-field" style={{ marginBottom: "1rem" }}>
              <label>StarkNet L2 TPS</label>
              <input
                type="number"
                className="pixel-input"
                value={manualTPS}
                onChange={(e) => setManualTPS(Number(e.target.value))}
              />
            </div>
            <div className="nes-field" style={{ marginBottom: "1rem" }}>
              <label>State Update Interval (seconds)</label>
              <input
                type="number"
                className="pixel-input"
                value={stateUpdateInterval}
                onChange={(e) => setStateUpdateInterval(Number(e.target.value))}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="nes-field" style={{ marginBottom: "1rem" }}>
              <label>Start Block</label>
              <input
                type="number"
                className="pixel-input"
                value={queryStartBlock}
                onChange={(e) =>
                  setQueryStartBlock(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
              />
            </div>
            <div className="nes-field" style={{ marginBottom: "1rem" }}>
              <label>End Block</label>
              <input
                type="number"
                className="pixel-input"
                value={queryEndBlock}
                onChange={(e) =>
                  setQueryEndBlock(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
            <div className="nes-field" style={{ marginBottom: "1rem" }}>
              <label>L2 Transactions in Batch</label>
              <input
                type="number"
                className="pixel-input"
                value={queryTxCount}
                onChange={(e) => setQueryTxCount(Number(e.target.value))}
              />
            </div>
            <div className="nes-field" style={{ marginBottom: "1rem" }}>
              <label>Time Interval (seconds)</label>
              <input
                type="number"
                className="pixel-input"
                value={queryTimeInterval}
                onChange={(e) => setQueryTimeInterval(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              className="nes-btn is-primary"
              onClick={handleQueryBlockRange}
              style={{ marginBottom: "1rem" }}
            >
              Query Range
            </button>
          </div>
        )}

        {/* Blob & Cost Parameters */}
        <div className="nes-field" style={{ marginBottom: "1rem" }}>
          <label>Number of Blobs per State Update</label>
          <input
            type="number"
            className="pixel-input"
            value={numberOfBlobs}
            onChange={(e) => setNumberOfBlobs(Number(e.target.value))}
          />
        </div>
        <div className="nes-field" style={{ marginBottom: "1rem" }}>
          <label>Blob Size (KB)</label>
          <input
            type="number"
            className="pixel-input"
            value={blobSizeKB}
            onChange={(e) => setBlobSizeKB(Number(e.target.value))}
          />
        </div>
        <div className="nes-field" style={{ marginBottom: "1rem" }}>
          <label>vsats per byte</label>
          <input
            type="number"
            className="pixel-input"
            value={satsPerVByte}
            onChange={(e) => setVsatsPerByte(Number(e.target.value))}
          />
        </div>
        <div className="nes-field" style={{ marginBottom: "1rem" }}>
          <label>Bitcoin Price (USD)</label>
          <input
            type="number"
            className="pixel-input"
            value={bitcoinPrice}
            onChange={(e) => setBitcoinPrice(Number(e.target.value))}
          />
        </div>

        {/* Run Simulation */}
        <button
          type="button"
          className="nes-btn is-success"
          onClick={handleRunSimulation}
          style={{ marginTop: "1rem" }}
        >
          Run Simulation
        </button>
      </section>

      {/* Right column: Results */}
      <section className="sim-results-panel nes-container is-dark">
        <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>
          Simulation Results
        </h2>
        <p>
          <strong>Total Data per State Update:</strong>{" "}
          {(totalDataBytes / 1024).toFixed(0)} KB
        </p>
        <p>
          <strong>Transactions per State Update:</strong> {txPerUpdate}
        </p>
        <p>
          <strong>Average Data per Transaction:</strong>{" "}
          {avgDataPerTx.toFixed(2)} bytes
        </p>
        <p>
          <strong>Bitcoin Throughput:</strong> {bitcoinThroughput.toFixed(2)}{" "}
          bytes/s
        </p>
        <p>
          <strong>Simulated Bitcoin L2 TPS:</strong>{" "}
          {simulatedBitcoinTPS.toFixed(2)} tx/s
        </p>
        <p>
          <strong>Cost per State Update:</strong> {costSats.toFixed(0)} sats (
          {costBTC.toFixed(8)} BTC, ${costUSD.toFixed(2)} USD)
        </p>

        {/* Chart */}
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Export CSV */}
        <button
          type="button"
          className="nes-btn is-primary"
          onClick={handleExportCSV}
          style={{ marginTop: "1rem" }}
        >
          Export CSV
        </button>
      </section>
    </main>
  );
}
