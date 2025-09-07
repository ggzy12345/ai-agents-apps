import robotsParser from "https://esm.sh/robots-parser@latest";

export async function canFetch(url, userAgent = "MyScraperBot") {
    try {
        const robotsUrl = new URL("/robots.txt", url).href;
        const res = await fetch(robotsUrl);

        if (!res.ok) {
            return true;
        }

        const body = await res.text();
        const robots = robotsParser(robotsUrl, body);

        return robots.isAllowed(url, userAgent);
    } catch (err) {
        console.error("robots.txt check failed:", err);
        return true;
    }
}
