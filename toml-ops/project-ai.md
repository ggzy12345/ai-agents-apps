Dependencies:
- Node.js 18+
- TypeScript

## Project Structure
- src/index.ts
- src/types.ts

---

## File: src/index.ts
```ts
import fs from 'fs';
import path from 'path';
import toml from 'toml';
import YAML from 'yaml';
import { execSync } from 'child_process';
import { RunbookToml, Env, Step } from './types';
import { program } from 'commander';
export function generateInventory(tomlData: RunbookToml): string {
    const inventory: string[] = [];
    inventory.push('[managed]');
    tomlData.hosts.forEach(host => {
        const addr = host.addr;
        const hostEnv = host.env || {};
        const env: Env = { ...tomlData.env, ...hostEnv };
        inventory.push(
            `${addr} ansible_user=${env.user} ansible_ssh_private_key_file=${env.ssh_key} ansible_python_interpreter=${env.python} ansible_become=${env.become}`
        );
    });
    return inventory.join('\n');
}
export function generatePlaybook(tomlData: RunbookToml, debug: boolean = false): string {
    const playbook: any[] = [];
    if (debug) {
        playbook.push({
            name: tomlData.name,
            hosts: 'managed',
            gather_facts: false,
            become: tomlData.env.become,
            vars: {
                ansible_verbosity: 2 // Increase verbosity level
            },
            tasks: tomlData.steps.map((step: Step) => ({
                name: step.name,
                shell: step.command,
                become: step.become ?? tomlData.env.become,
                register: 'result', // Register output for debugging
                ignore_errors: false
            }))
        });
    } else {
        playbook.push({
            name: tomlData.name,
            hosts: 'managed',
            gather_facts: false,
            become: tomlData.env.become,
            tasks: tomlData.steps.map((step: Step) => ({
                name: step.name,
                shell: step.command,
                become: step.become ?? tomlData.env.become
            }))
        });
    }
    return YAML.stringify(playbook);
}
export function writeFiles(tomlData: RunbookToml, outputDir: string, debug: boolean = false) {
    fs.mkdirSync(outputDir, { recursive: true });
    const inventory = generateInventory(tomlData);
    fs.writeFileSync(path.join(outputDir, 'hosts'), inventory, 'utf-8');
    const playbook = generatePlaybook(tomlData, debug); // Pass debug flag
    fs.writeFileSync(path.join(outputDir, 'playbook.yml'), playbook, 'utf-8');
    console.log(`Generated inventory and playbook in ${outputDir}`);
}
async function runAnsiblePlaybook(outputDir: string, debug: boolean = false) {
    console.log('Running ansible-playbook...');
    const playbookPath = path.join(outputDir, 'playbook.yml');
    const inventoryPath = path.join(outputDir, 'hosts');
    const debugFlag = debug ? '-vv' : '';
    execSync(`ansible-playbook ${debugFlag} -i ${inventoryPath} ${playbookPath}`, {
        stdio: 'inherit'
    });
}
async function processRunbook(tomlPath: string, outputDir: string, run: boolean = false, debug: boolean = false) {
    const tomlContent = fs.readFileSync(tomlPath, 'utf-8');
    const runbook: RunbookToml = toml.parse(tomlContent) as RunbookToml;
    writeFiles(runbook, outputDir, debug || runbook.debug);
    if (run) {
        await runAnsiblePlaybook(outputDir, debug || runbook.debug);
    }
}
program
    .name('runbook-cli')
    .description('CLI to generate and run Ansible playbooks from TOML')
    .version('0.0.1');
program
    .command('generate')
    .description('Generate Ansible files from TOML runbook')
    .argument('<toml-file>', 'Path to TOML runbook file')
    .option('-o, --output <directory>', 'Output directory', './generated')
    .action(async (tomlFile, options) => {
        await processRunbook(
            path.resolve(tomlFile),
            path.resolve(options.output)
        );
    });
program
    .command('run')
    .description('Generate and immediately run Ansible playbook')
    .argument('<toml-file>', 'Path to TOML runbook file')
    .option('-o, --output <directory>', 'Output directory', './generated')
    .option('--debug', 'Enable debug output', false) // Simple boolean flag
    .action(async (tomlFile, options) => {
        await processRunbook(
            path.resolve(tomlFile),
            path.resolve(options.output),
            true,
            options.debug
        );
    });
program.parse();
```

## File: src/types.ts
```ts
export type Env = {
    user?: string;
    ssh_key?: string;
    python?: string;
    become?: boolean;
};
export type HostEntry = { addr: string; env?: Env };
export type Step = {
    name: string;
    command: string;
    become?: boolean;
};
export type RunbookToml = {
    name: string;
    description?: string;
    debug?: boolean;
    hosts: HostEntry[];
    env: Env;
    steps: Step[];
};
```
