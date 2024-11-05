import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * The filename of the current file
 * @type {string}
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * The directory of the current file
 * @type {string}
 */
const __dirname = path.dirname(__filename);

/**
 * Delay execution for `ms` milliseconds
 * @param {number} ms - Number of milliseconds to delay
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns yesterday's date in format YYYY-MM-DD
 * @returns {string}
 */
export function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

/**
 * Returns day before yesterday's date in format YYYY-MM-DD
 * @returns {string}
 */
export function getDayBeforeYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date.toISOString().split("T")[0];
}

/**
 * Returns the filename for a data dump with optional prefix
 * @param {string} prefix - Optional prefix for the filename (e.g., 'news', 'scrape')
 * @returns {string}
 */
export const getFileNameForDataDump = (prefix = 'data') => {
  return `${prefix}_dump_${getYesterdayDate()}.json`;
};

/**
 * Returns the filepath for a data dump
 * @param {string} prefix - Optional prefix for the filename
 * @returns {string}
 */
export const getFilePathForDataDump = (prefix = 'data') => {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, getFileNameForDataDump(prefix));
};

/**
 * Writes any data dump to a file
 * @param {Array} data - Array of objects to write to the file
 * @param {string} prefix - Optional prefix for the filename
 * @returns {void}
 */
export const writeDataDumpToFile = (data, prefix = 'data') => {
  const filePath = getFilePathForDataDump(prefix);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Wrote ${prefix} dump to ${filePath}`);
};

/**
 * Reads a data dump from a file
 * @param {string} prefix - Optional prefix for the filename
 * @returns {Array}
 */
export const readDataDumpFromFile = (prefix = 'data') => {
  return JSON.parse(fs.readFileSync(getFilePathForDataDump(prefix), 'utf8'));
};

/**
 * Checks if a data dump file exists
 * @param {string} prefix - Optional prefix for the filename
 * @returns {boolean}
 */
export const doesDataDumpFileExist = (prefix = 'data') => {
  return fs.existsSync(getFilePathForDataDump(prefix));
};

/**
 * Writes a summary to a file
 * @param {string} summaryText - The summary to write to the file
 * @returns {void}
 */
export const writeSummaryToFile = (summaryText) => {
  const filePath = path.join(__dirname, "..", "data", `summary_${getYesterdayDate()}.txt`);
  fs.writeFileSync(filePath, summaryText);
  console.log(`Wrote summary to ${filePath}`);
};
