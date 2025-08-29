const fs = require('fs/promises');
const path = require('path');

/**
 * Save content to a file
 */
exports.saveTool = {
    name: "save_to_file",
    description: "Save content to a file",
    parameters: {
        type: "object",
        properties: {
            file_path: {
                type: "string",
                description: "File path"
            },
            content: {
                type: "string",
                description: "Content to save"
            }
        },
        required: ["file_path", "content"]
    },
    execute: async ({ file_path, content }) => {
        try {
            // Create directory if it doesn't exist
            const dir = path.dirname(file_path);
            await fs.mkdir(dir, { recursive: true });

            // Write content to file
            await fs.writeFile(file_path, content, 'utf8');

            return `Successfully saved content to ${file_path}`;
        } catch (error) {
            throw new Error(`Failed to save file: ${error.message}`);
        }
    }
};

// Other tool remains unchanged
exports.otherTool = {
    name: "other_tool",
    description: "Another example tool",
    parameters: {
        type: "object",
        properties: {
            param1: {
                type: "string",
                description: "Example parameter"
            }
        },
        required: ["param1"]
    },
    execute: async ({ param1 }) => {
        return `Processed: ${param1}`;
    }
};