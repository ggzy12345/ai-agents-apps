const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;

export async function googleSearch(query, numResults = 10) {
    if (!API_KEY || !SEARCH_ENGINE_ID) {
        throw new Error("Missing required environment variables: GOOGLE_API_KEY and GOOGLE_CSE_ID");
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Google API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Format the results
        const results = data.items ? data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })) : [];

        return results;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}