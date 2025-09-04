import { googleSearch } from './search.mjs';
(async () => {
    try {
        const results = await googleSearch('JavaScript programming', 5);
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Search failed:', error.message);
    }
})();
