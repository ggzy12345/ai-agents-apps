import { summary } from './summary.mjs';
import fs from 'fs';
import path from "path";

(async () => {
    try {
        let content = '';

        if (process.argv[2]) {
            // Read content from file
            try {
                content = fs.readFileSync(process.argv[2], 'utf8');
                console.log(` Reading content from file: ${process.argv[2]}`);
            } catch (fileError) {
                console.error(`Error reading file: ${fileError.message}`);
                process.exit(1);
            }
        }

        if (!content || content.length < 5) {
            console.log('No meaningful content to summarize');
            process.exit(0);
        }

        const summarized = await summary(content);
        const surrmaryPagesDir = path.resolve("generated/summary-pages");
        fs.mkdirSync(surrmaryPagesDir, { recursive: true });
        const summaryPagesPath = path.join(surrmaryPagesDir, `summary-page-${Date.now()}.md`);
        fs.writeFileSync(summaryPagesPath, summarized);
        console.log(`Sumamary page saved locally at: ${summaryPagesPath}`);
    } catch (error) {
        console.error('Summary failed:', error.message);
        process.exit(1);
    }
})();