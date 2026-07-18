import type { Command } from "commander";
import { ProjectGenerator } from "../generators/project.js";
import { logError, logSuccess } from "../utils/logger.js";

const DEFAULT_PROJECT_NAME = "my-alang-app";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize a new ALang project")
    .argument("[name]", "Project name", DEFAULT_PROJECT_NAME)
    .action(async (name: string) => {
      await runInit(name);
    });
}

async function runInit(projectName: string): Promise<void> {
  try {
    await ProjectGenerator.create(projectName);

    logSuccess("Project initialized successfully!");
    logSuccess(`Next steps:
  cd ${projectName}
  alang validate
  alang plan`);
  } catch (error) {
    logError(
      error instanceof Error
        ? error.message
        : "Failed to initialize project."
    );

    process.exit(1);
  }
}