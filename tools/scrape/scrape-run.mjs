import { screenshotOcrToMarkdown } from './ocr/scrape-ocr.mjs'
import { fetchHtmlToMarkdown } from './html/scrape-html.mjs'
import fs from "fs";
import path from "path";

export async function scrapeUrl(url, mode) {
    try {
        let md;
        if (mode === "ocr") {
            md = await screenshotOcrToMarkdown(url);
        } else if (mode === "html") {
            md = await fetchHtmlToMarkdown(url);
        } else {
            throw new Error('Invalid mode');
        }

        if (md && md.length > 0) {
            const mdPagesDir = path.resolve("generated/md-pages");
            fs.mkdirSync(mdPagesDir, { recursive: true });
            const mdPagesPath = path.join(mdPagesDir, `page-${Date.now()}.md`);
            fs.writeFileSync(mdPagesPath, md);
            console.log(`[SCRAPER] MD page saved locally at: ${mdPagesPath}`);
            return md;
        } else {
            throw new Error('No content found');
        }

    } catch (err) {
        console.warn(`Fetch failed (${mode}), error: ${err.message}`);
        throw err;
    }
}
//node --experimental-network-imports scrape-run.mjs target_url
//node --experimental-network-imports scrape-run.mjs target_url ocr
(async () => {
    try {
        const url = process.argv[2];
        const mode = process.argv[3] || "html";
        const result = await scrapeUrl(url, mode);
        console.log(result);
    } catch (error) {
        console.error('Search failed:', error.message);
    }
})();
