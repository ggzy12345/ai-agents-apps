import fs from "fs";
import path from "path";

const dependencies = [
    "Node.js 18+",
    "TypeScript"
];

const srcDir = path.resolve("./src");

const customFileOrder = [
    "index.ts",
    "manager.ts",
    "agent.ts",
    "selectors.ts",
    "context.ts",
    "messages.ts",
    "config.ts",
    "utils.ts"
];

const includeFiles = [
    "index.ts",
    "manager.ts",
    "agent.ts",
    "selectors.ts",
    "context.ts",
    "messages.ts",
    "config.ts",
    "utils.ts"
];
const excludeFiles = [
    "secret-config.ts",
    "private-key.ts"
];

function getFiles(dir) {
    let results = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

function sortFiles(files) {
    const orderMap = new Map(customFileOrder.map((name, i) => [name, i]));
    return files.sort((a, b) => {
        const aName = path.basename(a);
        const bName = path.basename(b);
        const aIdx = orderMap.has(aName) ? orderMap.get(aName) : Infinity;
        const bIdx = orderMap.has(bName) ? orderMap.get(bName) : Infinity;
        return aIdx - bIdx || a.localeCompare(b);
    });
}

function filterFiles(files, mode) {
    const fileNames = f => path.relative(srcDir, f);
    if (mode === "whitelist") {
        return files.filter(f => includeFiles.includes(fileNames(f)));
    }
    if (mode === "blacklist") {
        return files.filter(f => !excludeFiles.includes(fileNames(f)));
    }
    return files;
}

function compressCode(code, ext) {
    if (!ext.match(/ts|js/)) return code;
    return code
        .split("\n")
        .filter(line => {
            const t = line.trim();
            if (t === "") return false;
            if (t.startsWith("//")) return false;
            if (t.startsWith("/*") || t.endsWith("*/")) return false;
            return true;
        })
        .join("\n");
}

function generateMarkdown(files, compress = false) {
    let md = `Dependencies:\n`;
    dependencies.forEach(dep => md += `- ${dep}\n`);
    md += `\n## Project Structure\n`;
    files.forEach(file => {
        md += `- ${path.relative(process.cwd(), file)}\n`;
    });

    md += `\n---\n`;

    files.forEach(file => {
        const ext = path.extname(file).slice(1) || "txt";
        let code = fs.readFileSync(file, "utf8");
        if (compress) code = compressCode(code, ext);
        md += `\n## File: ${path.relative(process.cwd(), file)}\n`;
        md += `\`\`\`${ext}\n${code}\n\`\`\`\n`;
    });

    return md;
}

function saveMarkdown(filename, files, compress) {
    const md = generateMarkdown(files, compress);
    fs.writeFileSync(filename, md, "utf8");
    console.log(`Writing to a File: ${filename}  （compression: ${compress ? "Yes" : "No"}）`);
}

const allFiles = getFiles(srcDir);
const filteredFiles = filterFiles(allFiles, "blacklist");
const sortedFiles = sortFiles(filteredFiles);

saveMarkdown("project-ai.md", sortedFiles, true);