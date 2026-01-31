#!/usr/bin/env node

/**
 * CLI Interface for Seeding System
 * Command-line tool to seed database with test data
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { config } from 'dotenv';
import { seedDemoShowcase } from './scenarios/demo-showcase.js';
import { initializeSupabase, cleanDatabase } from './utils/database.js';
import { validateAll } from './utils/validation.js';

// Load environment variables
config();

const program = new Command();

program
  .name('mosqos-seed')
  .description('MosqOS Database Seeding Tool')
  .version('1.0.0');

/**
 * Interactive mode
 */
program
  .command('interactive')
  .description('Interactive seeding wizard')
  .action(async () => {
    console.log(chalk.bold.blue('\n🌟 MosqOS Seeding Wizard\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'scenario',
        message: 'Which scenario would you like to seed?',
        choices: [
          { name: 'Demo Showcase (3 organizations: small, medium, large)', value: 'demo' },
          { name: 'Small Mosque (50 members)', value: 'small' },
          { name: 'Medium Mosque (350 members)', value: 'medium' },
          { name: 'Large Mosque (1000 members)', value: 'large' },
        ],
      },
      {
        type: 'confirm',
        name: 'clean',
        message: 'Clean existing data before seeding?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'validate',
        message: 'Run validation after seeding?',
        default: true,
      },
    ]);

    try {
      initializeSupabase();

      if (answers.clean) {
        console.log(chalk.yellow('\n🧹 Cleaning database...\n'));
        await cleanDatabase();
      }

      console.log(chalk.blue(`\n🌱 Starting ${answers.scenario} seeding...\n`));

      switch (answers.scenario) {
        case 'demo':
          await seedDemoShowcase();
          break;
        case 'small':
          console.log(chalk.red('Small scenario not yet implemented'));
          break;
        case 'medium':
          console.log(chalk.red('Medium scenario not yet implemented'));
          break;
        case 'large':
          console.log(chalk.red('Large scenario not yet implemented'));
          break;
      }

      if (answers.validate) {
        await validateAll();
      }

      console.log(chalk.bold.green('\n✅ Seeding completed successfully!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Seeding failed:'), error);
      process.exit(1);
    }
  });

/**
 * Demo scenario
 */
program
  .command('demo')
  .description('Seed demo showcase with all features')
  .option('--skip-clean', 'Skip cleaning database before seeding')
  .option('--skip-validation', 'Skip validation after seeding')
  .action(async (options) => {
    try {
      initializeSupabase();

      if (!options.skipClean) {
        console.log(chalk.yellow('\n🧹 Cleaning database...\n'));
        await cleanDatabase();
      }

      console.log(chalk.blue('\n🌱 Starting demo seeding...\n'));
      await seedDemoShowcase();

      if (!options.skipValidation) {
        await validateAll();
      }

      console.log(chalk.bold.green('\n✅ Demo seeding completed!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Seeding failed:'), error);
      process.exit(1);
    }
  });

/**
 * Clean command
 */
program
  .command('clean')
  .description('Remove all seeded data')
  .option('--force', 'Skip confirmation prompt')
  .action(async (options) => {
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.red('⚠️  This will delete ALL data. Are you sure?'),
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Aborted.'));
        return;
      }
    }

    try {
      initializeSupabase();
      console.log(chalk.yellow('\n🧹 Cleaning database...\n'));
      await cleanDatabase();
      console.log(chalk.green('\n✅ Database cleaned successfully!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Cleaning failed:'), error);
      process.exit(1);
    }
  });

/**
 * Reset command (clean + seed demo)
 */
program
  .command('reset')
  .description('Clean database and reseed demo')
  .action(async () => {
    try {
      initializeSupabase();

      console.log(chalk.yellow('\n🧹 Cleaning database...\n'));
      await cleanDatabase();

      console.log(chalk.blue('\n🌱 Reseeding demo...\n'));
      await seedDemoShowcase();

      await validateAll();

      console.log(chalk.bold.green('\n✅ Reset completed!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Reset failed:'), error);
      process.exit(1);
    }
  });

/**
 * Validate command
 */
program
  .command('validate')
  .description('Validate existing data integrity')
  .action(async () => {
    try {
      initializeSupabase();
      const passed = await validateAll();
      process.exit(passed ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('\n❌ Validation failed:'), error);
      process.exit(1);
    }
  });

/**
 * Scenario commands
 */
program
  .command('scenario <type>')
  .description('Seed a specific scenario (small, medium, large)')
  .action(async (type) => {
    if (!['small', 'medium', 'large'].includes(type)) {
      console.error(chalk.red(`Invalid scenario type: ${type}`));
      console.log(chalk.gray('Valid types: small, medium, large'));
      process.exit(1);
    }

    console.log(chalk.red(`\n${type} scenario not yet implemented\n`));
    process.exit(1);
  });

// Parse command line arguments
program.parse();
