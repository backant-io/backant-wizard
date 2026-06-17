#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runWizard } from './run.js';
import { runMCPAdd, runMCPRemove } from './mcp.js';

const cli = yargs(hideBin(process.argv))
  .scriptName('backant-wizard')
  .usage('$0 [options]')
  .usage('$0 mcp add [options]')
  .usage('$0 mcp remove [options]')
  .command(
    '$0',
    'Install Backant MCP server to your coding agents',
    (yargs) =>
      yargs
        .option('local', {
          type: 'boolean',
          description: 'Use local mode (connects to localhost:8000)',
        })
        .option('remote', {
          type: 'boolean',
          description: 'Use remote mode (cloud)',
        })
        .option('debug', {
          type: 'boolean',
          default: false,
          description: 'Enable debug logging',
        })
        .option('ci', {
          type: 'boolean',
          default: false,
          description: 'CI mode (skip prompts)',
        }),
    async (argv) => {
      try {
        await runWizard({
          local: argv.local ?? (argv.remote ? false : undefined),
          debug: argv.debug,
          ci: argv.ci,
        });
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    },
  )
  .command(
    'mcp <command>',
    'Manage Backant MCP server installation',
    (yargs) =>
      yargs
        .command(
          'add',
          'Add Backant MCP server to coding agents',
          (yargs) =>
            yargs
              .option('local', {
                type: 'boolean',
                description: 'Use local mode',
              })
              .option('remote', {
                type: 'boolean',
                description: 'Use remote mode',
              })
              .option('debug', {
                type: 'boolean',
                default: false,
                description: 'Enable debug logging',
              })
              .option('ci', {
                type: 'boolean',
                default: false,
                description: 'CI mode (skip prompts)',
              }),
          async (argv) => {
            try {
              await runMCPAdd({
                local: argv.local ?? (argv.remote ? false : undefined),
                debug: argv.debug,
                ci: argv.ci,
              });
            } catch (error) {
              console.error('Error:', error);
              process.exit(1);
            }
          },
        )
        .command(
          'remove',
          'Remove Backant MCP server from coding agents',
          (yargs) =>
            yargs.option('debug', {
              type: 'boolean',
              default: false,
              description: 'Enable debug logging',
            }),
          async (argv) => {
            try {
              await runMCPRemove({ debug: argv.debug });
            } catch (error) {
              console.error('Error:', error);
              process.exit(1);
            }
          },
        )
        .demandCommand(1, 'You need to specify a command (add or remove)'),
    () => {},
  )
  .help()
  .version()
  .strict();

cli.parse();
