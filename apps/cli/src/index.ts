#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("alang")
  .description("Programming by Intent. Built by AI.")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new ALang project")
  .action(() => {
    console.log("🚀 Initializing ALang project...");
  });

program.parse();