import TurndownService from "https://esm.sh/turndown@7.2.1?bundle&target=node";


import { canFetch } from "../can-fetch.mjs";

export async function fetchHtmlToMarkdown(url) {
    const allowed = await canFetch(url);
    if (!allowed) {
        console.warn(`robots.txt disallows scraping: ${url}`);
        return;
    }
    console.info(`robots.txt allows scraping: ${url}`);

    const res = await fetch(url);
    const html = await res.text();

    const turndownService = new TurndownService();
    turndownService.addRule("removeScriptsAndStyles", {
        filter: ["script", "style", "noscript"],
        replacement: () => ""
    });

    const md = turndownService.turndown(html);

    return md.trim();
}