import puppeteer from 'puppeteer';
import { SCRAPING_SOURCES } from '../config/scrapingSources.js';
import { processPageWithGPT } from "./gptProcessor.js";

/**
 * Scrapes the websites for news articles and returns a CSV of the most relevant articles.
 * @returns {Promise<Array>} - The processed content
 */
export async function scrapeWebsites() {
    const browser = await puppeteer.launch({ headless: "new" });
    const results = [];

    try {
        for (const source of SCRAPING_SOURCES) {
            console.log(`Scraping ${source.name} (${source.url})`);
            const page = await browser.newPage();
            await page.goto(source.url, { 
                waitUntil: 'networkidle0',
                timeout: 60000 // Increased timeout to 60 seconds
            });
            
            // Get the entire rendered page content
            const content = await page.evaluate(() => {
                // Remove script and style elements to clean up the content
                const scripts = document.getElementsByTagName('script');
                const styles = document.getElementsByTagName('style');
                
                for (const element of scripts) {
                    element.remove();
                }
                for (const element of styles) {
                    element.remove();
                }
                
                // Get the cleaned body content
                return document.body.innerText;
            });

            const processedData = await processPageWithGPT(content, source.url, source.name);
            results.push(processedData);

            await page.close();
        }
    } catch (error) {
        console.error('Scraping error:', error);
    } finally {
        await browser.close();
    }

    return results;
}
