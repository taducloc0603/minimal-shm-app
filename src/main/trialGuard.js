const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 30;
const TRIAL_DURATION_MS = TRIAL_DAYS * DAY_MS;
const TRIAL_FILE_NAME = "trial-state.json";

function getTrialFilePath() {
  return path.join(app.getPath("userData"), TRIAL_FILE_NAME);
}

function readTrialState(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

function writeTrialState(filePath, state) {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

function getOrCreateInstalledAt() {
  const filePath = getTrialFilePath();
  const now = Date.now();
  const parsed = readTrialState(filePath);
  const installedAt = Number(parsed?.installedAt);

  if (Number.isFinite(installedAt) && installedAt > 0 && installedAt <= now) {
    return installedAt;
  }

  writeTrialState(filePath, { installedAt: now });
  return now;
}

function getTrialStatus() {
  const installedAt = getOrCreateInstalledAt();
  const now = Date.now();
  const expiresAt = installedAt + TRIAL_DURATION_MS;
  const remainingMs = expiresAt - now;

  return {
    installedAt,
    expiresAt,
    expired: remainingMs <= 0,
    remainingDays: Math.max(0, Math.ceil(remainingMs / DAY_MS)),
  };
}

module.exports = { getTrialStatus, TRIAL_DAYS };
