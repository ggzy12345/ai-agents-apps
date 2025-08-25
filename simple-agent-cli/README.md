# Simple Agent CLI

A command-line interface tool for running asynchronous AI agents using configuration files.

## Features

- Multi-agent conversations with configurable agents
- TOML-based configuration
- Support for OpenAI-compatible APIs
- Debug mode for agent interaction monitoring
- Output generation to files

## Installation

Install dependencies:
```bash
npm install -g simple-agent-cli
```

Configuration
Create a config.toml file:
```
debug = true
output = 'generated.md'

[client]
base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
model_name = "gemini-2.5-flash"

[manager]
#termination_word = "terminate"
max_rounds = 3

prompt_template = "Create an SEO-optimized blog post about {topic} with a focus on best practices"

[[agents]]
name = "seo_analyst"
system_message = """
You are an SEO analyst. Analyze keywords, competition, and suggest topics.
Provide:
1. Primary keyword and secondary keywords
2. Search volume estimates
3. Content angle suggestions
4. Competitor analysis
5. The original request of the user
"""

[[agents]]
name = "content_writer"
system_message = """
You are a content writer. Create engaging, SEO-friendly blog posts in markdown format.
Guidelines:
- Use headings with keywords
- Write 300-500 words
- Include internal links to other blog posts
- Use bullet points and numbered lists
- Add meta description
"""

[[agents]]
name = "optimizer"
system_message = """
You are an SEO optimizer. Review and improve content for:
- Keyword density and placement
- Readability score
- Meta tags optimization
- Internal linking structure
- Content freshness
"""

```

## Usage 

```
# Basic usage
simple-agent-cli "topic to generate" --api-key YOUR_API_KEY --base-url https://api.example.com

# With config file
simple-agent-cli "topic to generate" -c config.toml

# Save output to file
simple-agent-cli  "topic to generate" -o result.txt

#Example
simple-agent-cli --config config_roundrobin.toml "Write a very short article about the impact of AI on society." 
```

**Environment Variables**
You can set below environment variables instead of using the command line option:
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