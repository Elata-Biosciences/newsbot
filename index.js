import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import NewsAPI from "newsapi";
import { Client, Events, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";
import { config } from "./config/config.js";
import { KEYWORDS } from "./config/keywords.js";
import { MAIN_PROMPT, STOP_DELIMITER } from "./config/prompt.js";

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

const newsApiClient = new NewsAPI(config.newsApi.key);

const openAIClient = new OpenAI({
  apiKey: config.openai.key,
  organization: config.openai.organization,
  project: config.openai.project,
});

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

/**
 * Delay execution for `ms` milliseconds
 * @param {number} ms - Number of milliseconds to delay
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns yesterday's date in format YYYY-MM-DD
 * @returns {string}
 */
function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

/**
 * Returns day before yesterday's date in format YYYY-MM-DD
 * @returns {string}
 */
function getDayBeforeYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date.toISOString().split("T")[0];
}

/**
 * Returns the filename for the current data dump
 * @returns {string}
 */
const getFileNameForCurrentDataDump = () => {
  return `data_dump_${getYesterdayDate()}.json`;
};

/**
 * Returns the filepath for the current data dump
 * @returns {string}
 */
const getFilePathForCurrentDataDump = () => {
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, getFileNameForCurrentDataDump());
};

/**
 * Writes the data dump to a file
 * @param {Array} data - Array of objects to write to the file
 * @returns {void}
 */
const writeDataDumpToFile = (data) => {
  const filePath = getFilePathForCurrentDataDump();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Wrote data dump to ${filePath}`);
};

/**
 * Writes the summary to a file
 * @param {string} summaryText - The summary to write to the file
 * @returns {void}
 */
const writeSummaryToFile = (summaryText) => {
  const filePath = path.join(
    __dirname,
    "data",
    `summary_${getYesterdayDate()}.txt`
  );
  fs.writeFileSync(filePath, summaryText);
  console.log(`Wrote summary to ${filePath}`);
};

/**
 * Reads the data dump from a file
 * @returns {Array}
 */
const readDataDumpFromFile = () => {
  return JSON.parse(fs.readFileSync(getFilePathForCurrentDataDump(), "utf8"));
};

/**
 * Checks if the data dump file exists already
 * @returns {boolean}
 */
const doesDataDumpFileExist = () => {
  return fs.existsSync(getFilePathForCurrentDataDump());
};

/**
 * Sends the summary to the Discord channel
 * @param {Channel} channel - The Discord channel to send the summary to
 * @param {string} summary - The summary to send
 * @returns {Promise<void>}
 */
const sendSummaryToDiscord = async (channel, summary) => {
  const summaries = summary.split(STOP_DELIMITER);
  console.log(`Sending ${summaries.length} summaries to Discord...`);
  channel.send("Here are the top stories from the past 24 hours:");
  summaries.map((s) => channel.send(s));
};

/**
 * Fetches news stories from NewsAPI
 * @param {string} q - The query to search for
 * @returns {Promise<Object>}
 */
function getStories(q) {
  return newsApiClient.v2.everything({
    q,
    from: getDayBeforeYesterdayDate(),
    to: getYesterdayDate(),
    language: "en",
  });
}

/**
 * Fetches news stories from NewsAPI for a list of keywords
 * @param {Array} keywords - Array of keywords to search for
 * @returns {Promise<Array>}
 */
const getStoriesFromKeywords = async (keywords) => {
  // First check if the data dump file exists
  if (doesDataDumpFileExist()) {
    console.log("Data dump file exists, loading from file...");
    return readDataDumpFromFile();
  }

  // If it doesn't exist, we need to fetch the data from the API
  const stories = [];

  for (const keyword of keywords) {
    try {
      const { articles } = await getStories(keyword);
      stories.push(...articles);
    } catch (error) {
      console.error(`Error fetching stories for keyword ${keyword}: ${error}`);
    }
  }
  console.log(`Found ${stories.length} stories`);

  writeDataDumpToFile(stories);
  return stories;
};

/**
 * Converts an array of stories to a CSV string
 * @param {Array} stories - Array of stories to convert
 * @returns {string}
 */
const convertStoriesToCSV = (stories) => {
  let str = "title,description,url,source";

  str += "\n";

  for (const story of stories) {
    str += `${story.title},${story.description},${story.url},${story.source.name}`;
    str += "\n";
  }

  return str;
};

/**
 * Gets a summary of the stories from the AI
 * @param {Array} stories - Array of stories to summarize
 * @returns {Promise<string>}
 */
const getAISummaryOfStories = async (stories) => {
  try {
    const combinedPrompt = `
    ${MAIN_PROMPT}
    
    ${convertStoriesToCSV(stories)}
    `;

    console.log("Loading AI summary of stories...");

    const summary = await openAIClient.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: "system", content: combinedPrompt }],
    });
    console.log("Summary: ", summary);
    return summary.choices[0].message.content;
  } catch (error) {
    console.error("Error loading AI summary of stories: ", error);
    return "";
  }
};

/**
 * Handles main logic when the Discord client is ready
 * @returns {Promise<void>}
 */
const onClientReady = async () => {
  try {
    console.log(`Ready! Logged in as ${discordClient.user.tag}`);
    const channel = await discordClient.channels.fetch(
      config.discord.newsFeedChannelId
    );

    const stories = await getStoriesFromKeywords(KEYWORDS);

    const summary = await getAISummaryOfStories(stories);
    writeSummaryToFile(summary);
    await sendSummaryToDiscord(channel, summary);

    // Give 5 minute grace period for messages to send before terminating process
    await wait(5 * 60 * 1000);
    process.exit(0);
  } catch (error) {
    console.error("Error in onClientReady: ", error);
  }
};

/**
 * Main function that calls root logic. First, the script logs in to Discord,
 * then waits for the client to be ready, then calls the onClientReady function
 * to load all stories and send the AI summary to the Discord channel.
 * @returns {void}
 */
const main = () => {
  try {
    discordClient.once(Events.ClientReady, onClientReady);
    discordClient.login(config.discord.token);
  } catch (error) {
    console.error("Error logging in to Discord: ", error);
  }
};

main();
