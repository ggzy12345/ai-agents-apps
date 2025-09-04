#!/usr/bin/env node
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

        if (addr === 'localhost') {
            inventory.push(
                `${addr} ansible_connection=local ansible_python_interpreter=${env.python} ansible_become=${env.become}`
            );
        } else {
            inventory.push(
                `${addr} ansible_user=${env.user} ansible_ssh_private_key_file=${env.ssh_key} ansible_python_interpreter=${env.python} ansible_become=${env.become}`
            );
        }
    });
    return inventory.join('\n');
}

export function generatePlaybook(tomlData: RunbookToml, debug: boolean = false): string {
    const playbook: any[] = [{
        name: tomlData.name,
        hosts: 'managed',
        gather_facts: false,
        become: tomlData.env.become,
        tasks: []
    }];

    if (debug) {
        playbook[0].vars = { ansible_verbosity: 2 };
    }

    tomlData.steps.forEach((step: Step) => {
        if (step.msg) {
            playbook[0].tasks.push({
                name: `Print: ${step.name}`,
                debug: {
                    msg: step.msg
                }
            });
        } else {
            const task: any = {
                name: step.name,
                become: step.become ?? tomlData.env.become
            };

            if (step.stdin) {
                // Use command module with stdin
                task['command'] = {
                    cmd: step.command,
                    stdin: step.stdin
                };
            } else {
                // Use shell module
                task['shell'] = step.command;
            }


            task.register = 'result';
            task.ignore_errors = false;


            playbook[0].tasks.push(task);
        }
    });

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
