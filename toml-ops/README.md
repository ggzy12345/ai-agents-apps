# TomlOps

A command-line interface tool for generating and running Ansible playbooks from simplified TOML configuration files.

## Features

- Simplifed TOML-based configuration
- Support for multiple hosts with environment-specific settings
- Make the AI agents tool calls powerful
- Automatic Ansible inventory and playbook generation
- Debug mode for verbose output
- Step-based task execution with privilege escalation options
- **AI Agent Integration** Enables AI systems to execute complex infrastructure operations through simple declarative configurations

## Installation

Install dependencies:
```bash
npm install -g toml-ops
```

## Configuration example
```toml
name = "llama-server-start"
description = "Start llama-server on multiple hosts with per-host SSH overrides"
debug = true

hosts = [
    { addr = "192.168.67.112" },
    #   { addr = "192.168.67.113", env = { user = "admin", become = false } },
]

[env]
user = "admin"
ssh_key = "~/.ssh/id_rsa"
python = "/usr/bin/python3"
become = false

[[steps]]
name = "Check if llama-server is running"
command = "pgrep -f 'llama-server' || echo 'No processes found'"
become = false

[[steps]]
name = "Start llama-server"
command = "nohup /opt/homebrew/bin/llama-server --host 0.0.0.0 -hf ggml-org/gpt-oss-20b-GGUF --n-cpu-moe 12 -c 32768 --jinja --no-mmap > llama-server.log 2>&1 &"
become = false

[[steps]]
name = "Show running PID"
command = "pgrep -fl 'llama-server' || echo 'No processes found'"
become = false
```

## Prerequisites
Before using this tool, ensure you have:
### SSH Key Setup (Required for remote server access):
```
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -f ~/.ssh/my_key

# Copy public key to target servers
ssh-copy-id -i ~/.ssh/my_key.pub user@example.comdotnetcli
```
### Ansible Installation (Required for execution):
```
# On Ubuntu/Debian
sudo apt update
sudo apt install ansible

# On macOS
brew install ansible

# On CentOS/RHEL
sudo yum install ansible
```

## Usage
```

# Generate Ansible files without running
toml-ops generate runbook.toml

# Generate and immediately run playbook
toml-ops run runbook.toml
toml-ops run runbooks/llama.cpp/start.toml

# Enable debug output
toml-ops run runbook.toml --debug

# Specify custom output directory
toml-ops run runbook.toml -o ./ansible-files
```

## AI Agent Integration

This tool dramatically enhances AI agent capabilities by:

    **Simplified Interface**: AI agents can generate TOML configurations instead of complex Ansible playbooks

    **Structured Output**: Consistent format that agents can easily parse and generate

    **Powerful Execution**: Converts simple declarations into robust infrastructure operations

    **Safe Abstraction**: Agents don't need to understand Ansible internals to perform complex operations