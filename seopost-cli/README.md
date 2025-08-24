# SEO Post CLI

A command-line tool for generating SEO-optimized blog articles using AI agents. This tool leverages multiple specialized agents (SEO analyst, content writer, and optimizer) to create high-quality, optimized content.

## Features

- Generate SEO-optimized blog articles on any topic
- Multiple AI agents working collaboratively
- Customizable output format and length
- Support for different AI models and API endpoints
- Markdown output with proper formatting

## Installation

1. Ensure you have Node.js 18+ installed
2. Install the package globally:
```bash
npm install -g seopost-cli

## Usage 
**Environment Variables**
You can set the API key as an environment variable instead of using the command line option:
bash
export API_KEY=your_api_key
export BASE_URL=your_base_url
export MODEL_NAME=your_model_name

seopost-cli "React Performance Optimization Techniques"
seopost-cli "React Performance Optimization Techniques" \
  --output ./my-article.md \
  --debug \
  --api-key YOUR_API_KEY \
  --base-url 'http://192.168.68.109:1234/v1' \
  --model-name 'qwen/qwen3-1.7b'