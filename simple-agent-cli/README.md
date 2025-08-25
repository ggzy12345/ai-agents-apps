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
base_url = "http://192.168.68.109:1234/v1"
model_name = "qwen/qwen3-1.7b"

[manager]
termination_word = "terminate"
max_rounds = 6
selector_prompt = """
Select an agent to perform task.
        [writer, reviewer]
Read the above conversation, then select an agent from [writer, reviewer] to perform the next task.
Only select one agent.
Only say the agent, nothing else
"""

[[agents]]
name = "writer"
system_message = """
You are a writer. Please write article. If there is feedback, do the rework.
"""

[[agents]]
name = "reviewer"
system_message = """
You are a reviewer. 
        Provide a very short improvement suggestion for the article. 
        If you think it is good enough, say: terminate
        Please at least have two rounds of the reviews.
        If you think it is not good enough, provide a suggestion to improve the article
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
```
export API_KEY=your_api_key
export BASE_URL=your_base_url
export MODEL_NAME=your_model_name
```