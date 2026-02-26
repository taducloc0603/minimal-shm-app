import { escapeHtml } from "../utils/escapeHtml.js";
import { normalizeSans } from "../utils/normalizeSans.js";

export function createConfigListView({ listEl, state, onActiveToggle, onRunStateToggle }) {
  function formatNumber(value, digits = 5) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toFixed(digits);
  }

  function formatLatency(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "--";
    return String(Math.round(n));
  }

  function formatTimeMsc(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "-";
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("vi-VN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
      "." +
      String(d.getMilliseconds()).padStart(3, "0");
  }

  function formatGapValue(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toFixed(2);
  }

  function getGapValues(sans, quoteByMap, point) {
    if (!Array.isArray(sans) || sans.length !== 2) {
      return { gapBuy: null, gapSell: null };
    }

    const mapA = sans[0];
    const mapB = sans[1];
    const quoteA = quoteByMap?.[mapA];
    const quoteB = quoteByMap?.[mapB];

    if (quoteA?.status !== "FOUND" || quoteB?.status !== "FOUND") {
      return { gapBuy: null, gapSell: null };
    }

    const askA = Number(quoteA.ask);
    const bidA = Number(quoteA.bid);
    const askB = Number(quoteB.ask);
    const bidB = Number(quoteB.bid);
    const pointValue = Number(point);

    if (![askA, bidA, askB, bidB, pointValue].every(Number.isFinite)) {
      return { gapBuy: null, gapSell: null };
    }

    return {
      gapBuy: (bidB - askA) * pointValue,
      gapSell: (askB - bidA) * pointValue,
    };
  }

  function getCellText(cell, field) {
    if (!cell || cell.status === "END") return "-";

    if (cell.status === "NOT_FOUND") {
      if (field === "status") return "NOT_FOUND";
      return "-";
    }

    if (cell.status === "ERROR") {
      if (field === "status") return "ERROR";
      return "-";
    }

    switch (field) {
      case "symbol":
        return cell.symbol || "-";
      case "bid":
        return formatNumber(cell.bid, 5);
      case "ask":
        return formatNumber(cell.ask, 5);
      case "spread":
        return formatNumber(cell.spread, 5);
      case "latencyMs":
        return formatLatency(cell.latencyMs);
      case "tps":
        return formatNumber(cell.tps, 1);
      case "time":
        return formatTimeMsc(cell.time_msc);
      case "maxLatencyMs":
        return formatLatency(cell.maxLatencyMs);
      case "avgLatencyMs":
        return formatLatency(cell.avgLatencyMs);
      case "status":
        return cell.status || "-";
      default:
        return "-";
    }
  }

  function render(items) {
    if (!items.length) {
      listEl.innerHTML = "";
      state.activeConfigIdx = -1;
      state.displayedConfigs = [];
      return;
    }

    state.displayedConfigs = [...items];

    const cards = state.displayedConfigs.map((it, idx) => {
      const sans = normalizeSans(it.sans);
      const runState = state.runStateByIdx[idx] || "END";
      const quoteByMap = state.quoteTableByIdx[idx] || {};
      const headerCols = sans.length
        ? sans.map((s) => `<th>${escapeHtml(s)}</th>`).join("")
        : "<th>(chưa có sàn)</th>";

      const makeRowCells = (field) => sans.length
        ? sans
            .map((mapName) => `<td>${escapeHtml(getCellText(quoteByMap[mapName], field))}</td>`)
            .join("")
        : "<td>-</td>";

      return `
        <div class="active-panel">
          <div class="active-head">
            <h3>Thông tin</h3>
            <div class="active-actions">
              <button type="button" class="btn-toggle ${runState === "START" ? "is-active" : ""}" data-idx="${idx}" data-value="START">Start</button>
              <button type="button" class="btn-toggle ${runState === "END" ? "is-active" : ""}" data-idx="${idx}" data-value="END">End</button>
            </div>
          </div>

          <table class="san-table">
            <thead>
              <tr>
                <th></th>
                ${headerCols}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="row-label">Symbol</td>
                ${makeRowCells("symbol")}
              </tr>
              <tr>
                <td class="row-label">Bid</td>
                ${makeRowCells("bid")}
              </tr>
              <tr>
                <td class="row-label">Ask</td>
                ${makeRowCells("ask")}
              </tr>
              <tr>
                <td class="row-label">Spread</td>
                ${makeRowCells("spread")}
              </tr>
              <tr>
                <td class="row-label">Latency(ms)</td>
                ${makeRowCells("latencyMs")}
              </tr>
              <tr>
                <td class="row-label">TPS</td>
                ${makeRowCells("tps")}
              </tr>
              <tr>
                <td class="row-label">Time</td>
                ${makeRowCells("time")}
              </tr>
              <tr>
                <td class="row-label">Max Lat(ms)</td>
                ${makeRowCells("maxLatencyMs")}
              </tr>
              <tr>
                <td class="row-label">Avg Lat(ms)</td>
                ${makeRowCells("avgLatencyMs")}
              </tr>
              <tr>
                <td class="row-label">Status</td>
                ${makeRowCells("status")}
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }).join("");

    listEl.innerHTML = `<div class="config-list">${cards}</div>`;

    listEl.querySelectorAll(".btn-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        onRunStateToggle(Number(btn.getAttribute("data-idx")), btn.getAttribute("data-value"));
      });
    });
  }

  return { render };
}
