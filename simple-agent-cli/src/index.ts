#!/usr/bin/env node
import { AgentManager, Agent, IContext, IClientSdk, ModelClient, getRound, END_USER_NAME, AGENT_MANAGER_NAME, TYPE_NEW, MODEL_INBOUND_ROLE, getMessages } from "async-agents-core";
import OpenAI from "openai";
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import 'dotenv/config';

interface AgentConfig {
    name: string;
    system_message: string;
    model_name?: string;
    hand_offs?: string[];
}

interface ManagerConfig {
    termination_word?: string;
    max_rounds?: number;
    selector_prompt?: string;
}

interface ClientConfig {
    base_url?: string;
    model_name?: string;
}

interface Config {
    debug?: boolean;
    output?: string;
    client?: ClientConfig;
    manager?: ManagerConfig;
    agents?: AgentConfig[];
    prompt_template?: string;

}

const program = new Command();

async function loadConfig(configPath: string): Promise<Config> {
    try {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        return toml.parse(configFile);
    } catch (error) {
        console.error(`Error loading config file: ${error}`);
        process.exit(1);
    }
}

async function generate(topic: string, options: any) {
    try {
        let config: Config = {};
        if (options.config) {
            config = await loadConfig(options.config);
        }

        const debugMode = options.debug ?? config.debug ?? false;
        const outputSuffix = options.output ?? config.output;
        debugMode && console.debug(`Generating about: ${topic}`);

        const apiKey = process.env.API_KEY ?? options.apiKey;
        if (!apiKey) {
            console.error('API key is required. Set it via API_KEY environment variable or --api-key option');
            process.exit(1);
        }

        const baseURL =
            config.client?.base_url ??
            process.env.BASE_URL ??
            options.baseUrl;

        if (!baseURL) {
            console.error('Base URL is required. Set it via config file, BASE_URL environment variable or --base-url option');
            process.exit(1);
        }

        const modelName =
            config.client?.model_name ??
            process.env.MODEL_NAME ??
            options.modelName;

        if (!modelName) {
            console.error('Model name is required. Set it via config file, MODEL_NAME environment variable or --model-name option');
            process.exit(1);
        }

        const promptTemplate = config.prompt_template ?? "{topic}";
        const initialPrompt = promptTemplate.replace('{topic}', topic);

        const clientSdk: IClientSdk = new OpenAI({
            baseURL,
            apiKey
        });

        const managerConfig = config.manager || {};
        const shouldTerminate = (context: IContext, modelReplyText: string | undefined): boolean => {
            if (Boolean(managerConfig.termination_word)) {
                return modelReplyText?.endsWith(managerConfig.termination_word ?? '') ||
                    getRound(context) > (managerConfig.max_rounds ?? config.agents?.length ?? 3);
            } else {
                return getRound(context) > (managerConfig.max_rounds ?? config.agents?.length ?? 3);
            }
        }

        const manager = new AgentManager({
            shouldTerminate,
            modelClient: new ModelClient({ clientSdk, modelName }),
            onAfterSendingToModel: async (messages) => {
                debugMode && console.debug(`manager messages:`, messages);
            },
            selectorPrompt: config.manager?.selector_prompt,
            debug: debugMode
        });

        // Store agent names for later use
        const agentNames: string[] = [];

        if (config.agents && config.agents.length > 0) {
            config.agents.forEach(agentConfig => {
                manager.register(new Agent({
                    name: agentConfig.name,
                    handOffs: agentConfig.hand_offs,
                    onAfterSendingToModel: async (messages) => {
                        debugMode && console.debug(`${agentConfig.name} messages:`, messages);
                    },
                    modelClient: new ModelClient({
                        clientSdk,
                        modelName: agentConfig.model_name || modelName
                    }),
                    systemMessage: agentConfig.system_message
                }));
                agentNames.push(agentConfig.name);
            });
        }

        const input: IContext = {
            messages: [{
                from: END_USER_NAME,
                to: AGENT_MANAGER_NAME,
                type: TYPE_NEW,
                createdAt: new Date().toISOString(),
                modelMessage: {
                    role: MODEL_INBOUND_ROLE,
                    content: initialPrompt
                }
            }]
        };

        const output = await manager.handle(input);

        for (const agentName of agentNames) {
            const messages = getMessages(output, agentName);
            const lastMessage = messages
                .filter(m => m.modelMessage.role === 'assistant')
                .pop();

            if (lastMessage) {
                const finalContent = lastMessage.modelMessage.content ?? '';

                if (debugMode) {
                    console.log(`\n--- ${agentName} final content ---`);
                    console.log(finalContent);
                }
                if (outputSuffix) {
                    const outputPath = path.resolve(process.cwd(), agentName + '_' + outputSuffix);
                    fs.writeFileSync(outputPath, finalContent);
                    console.log(`Saved to: ${outputPath}`);
                }
            }
        }

    } catch (e) {
        console.error(`Failed to generate:`, e);
        process.exit(1);
    }
}

program
    .name('simple-agent-cli')
    .description('CLI tool for async AI agents')
    .version('0.0.1');

program
    .argument('<topic>', 'topic')
    .option('-c, --config <path>', 'path to TOML configuration file', 'config.toml')
    .option('-o, --output <file>', 'output file to save')
    .option('-k, --api-key <key>', 'API key for the generative language API')
    .option('-b, --base-url <url>', 'base URL for the API endpoint')
    .option('-m, --model-name <name>', 'model name to use for generation')
    .option('-v, --verbose', 'verbose output showing agent interactions')
    .option('-d, --debug', 'enable debug mode')
    .action(generate);

program.parse();