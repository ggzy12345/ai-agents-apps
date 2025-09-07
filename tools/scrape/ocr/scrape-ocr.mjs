import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { canFetch } from "../can-fetch.mjs";
import { callOcrApi } from "./ocr.mjs";
import TurndownService from "https://esm.sh/turndown@7.2.1?bundle&target=node";

export async function screenshotOcrToMarkdown(url) {
    console.log(`[SCRAPER] Checking robots.txt for: ${url}`);
    const allowed = await canFetch(url);

    if (!allowed) {
        console.warn(`[SCRAPER] robots.txt disallows scraping: ${url}`);
        return null;
    }
    console.info(`[SCRAPER] robots.txt allows scraping: ${url}`);

    console.log("[SCRAPER] Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 8000 });

    try {
        console.log(`[SCRAPER] Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForSelector('body', { timeout: 60000 });

        console.log("[SCRAPER] Page loaded, taking screenshot...");
        const screenshot = await page.screenshot({ fullPage: true });


        const screenshotsDir = path.resolve("generated/screenshots");
        fs.mkdirSync(screenshotsDir, { recursive: true });
        const screenshotPath = path.join(screenshotsDir, `screenshot-${Date.now()}.png`);
        fs.writeFileSync(screenshotPath, screenshot);
        console.log(`[SCRAPER] Screenshot saved locally at: ${screenshotPath}`);

        console.log("[SCRAPER] Closing browser...");
        await browser.close();

        console.log("[SCRAPER] Sending screenshot to OCR...");
        const text = await callOcrApi(screenshot);
        console.log("[SCRAPER] OCR text received");

        const html = `<pre>${text}</pre>`;

        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(html);

        return markdown;
    } catch (err) {
        console.error("[SCRAPER] Error during scraping:", err.message);
        await browser.close();
        throw err;
    }
}
