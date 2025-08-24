#!/usr/bin/env node

import { AgentManager, Agent, IContext, IClientSdk, ModelClient, getRound, END_USER_NAME, AGENT_MANAGER_NAME, TYPE_NEW, MODEL_INBOUND_ROLE, getMessages } from "async-agents-core";
import OpenAI from "openai";
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const program = new Command();

async function generateArticle(topic: string, options: any) {
    try {
        options.debug && console.debug(`Generating article about: ${topic}`);

        const apiKey = process.env.API_KEY || options.apiKey;
        if (!apiKey) {
            console.error('API key is required. Set it via API_KEY environment variable or --api-key option');
            process.exit(1);
        }

        const baseURL = process.env.BASE_URL || options.baseUrl;
        if (!baseURL) {
            console.error('Base URL is required. Set it via BASE_URL environment variable or --base-url option');
            process.exit(1);
        }

        const modelName = process.env.MODEL_NAME || options.modelName;
        if (!baseURL) {
            console.error('Model name is required. Set it via MODEL_NAME environment variable or --model-name option');
            process.exit(1);
        }

        const clientSdk: IClientSdk = new OpenAI({
            baseURL,
            apiKey
        });


        const shouldTerminate = (context: IContext, modelReplyText: string | undefined): boolean => {
            return getRound(context) > 3;
        }

        const manager = new AgentManager({
            shouldTerminate,
            modelClient: new ModelClient({ clientSdk, modelName }),
            debug: true
        });

        // SEO Analyst Agent
        manager.register(new Agent({
            name: 'seo_analyst',
            onAfterSendingToModel: async (messages) => {
                options.debug && console.debug('seo_analyst messages:', messages);
            },
            modelClient: new ModelClient({ clientSdk, modelName }),
            systemMessage: `You are an SEO analyst. Analyze keywords, competition, and suggest topics.
            Provide:
            1. Primary keyword and secondary keywords
            2. Search volume estimates
            3. Content angle suggestions
            4. Competitor analysis
            5. The original request of the user`
        }));

        // Content Writer Agent
        manager.register(new Agent({
            name: 'content_writer',
            onAfterSendingToModel: async (messages) => {
                options.debug && console.debug('content_writer messages:', messages);
            },
            modelClient: new ModelClient({ clientSdk, modelName }),
            systemMessage: `You are a content writer. Create engaging, SEO-friendly blog posts in markdown format.
            Guidelines:
            - Use headings with keywords
            - Write 300 - 500 words
            - Include internal links to other blog posts
            - Use bullet points and numbered lists
            - Add meta description
            Please follow the format used in below example: 
            ---
publishDate: 2025-08-23T01:00:00Z
title: Local LLMs for async agents framework development
excerpt: A local LLM is sufficient for testing async agents framework development
category: AI Models
tags:
  - ai models
metadata:
  canonical: ......
---

# Local LLMs for Agent Development

For the core tasks of logic validation and tool-calling reliability xxxxxx\n
        `
        }));

        // SEO Optimizer Agent
        manager.register(new Agent({
            name: 'optimizer',
            onAfterSendingToModel: async (messages) => {
                options.debug && console.debug('optimizer messages:', messages);
            },
            modelClient: new ModelClient({ clientSdk, modelName }),
            systemMessage: `You are an SEO optimizer. Review and improve content for:
            - Keyword density and placement
            - Readability score
            - Meta tags optimization
            - Internal linking structure
            - Content freshness`
        }));

        const input: IContext = {
            messages: [{
                from: END_USER_NAME,
                to: AGENT_MANAGER_NAME,
                type: TYPE_NEW,
                createdAt: new Date().toISOString(),
                modelMessage: {
                    role: MODEL_INBOUND_ROLE,
                    content: 'Create an SEO-optimized blog post about React Performance Optimization Techniques'
                }
            }]
        };

        const output = await manager.handle(input);
        const finalContent = getMessages(output, 'optimizer')
            .filter(m => m.modelMessage.role === 'assistant')
            .pop()?.modelMessage.content;

        if (options.output) {
            const outputPath = path.resolve(process.cwd(), options.output);
            fs.writeFileSync(outputPath, finalContent ?? '');
            console.log(`Article saved to: ${outputPath}`);
        } else {
            console.log('\nGenerated Article:\n');
            console.log(finalContent);
        }

    } catch (e) {
        console.error(`Failed to generate article:`, e);
        process.exit(1);
    }
}

// Set up CLI
program
    .name('seopost-cli')
    .description('CLI tool to generate SEO-optimized blog articles using AI agents')
    .version('0.0.1');

program
    .argument('<topic>', 'topic for the blog article')
    .option('-o, --output <file>', 'output file to save the article', './article.md')
    .option('-k, --api-key <key>', 'API key for the generative language API')
    .option('-b, --base-url <url>', 'base URL for the API endpoint')
    .option('-m, --model-name <name>', 'model name to use for generation')
    .option('-v, --verbose', 'verbose output showing agent interactions')
    .option('-d, --debug', 'enable debug mode')
    .action(generateArticle);

program.parse();