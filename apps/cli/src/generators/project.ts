import { mkdir, access, readdir, writeFile } from "fs/promises";
import { constants } from "fs";
import path from "path";

import { generateAppLang } from "../templates/app.js";
import { generateGitignore } from "../templates/gitignore.js";
import { generateReadme } from "../templates/readme.js";

export interface ProjectOptions {
  template?: string;
  git?: boolean;
  packageManager?: "pnpm" | "npm" | "yarn";
}

export class ProjectGenerator {
  private readonly outputDir: string;

  private constructor(
    private readonly projectName: string,
    private readonly options: ProjectOptions = {},
  ) {
    this.outputDir = path.resolve(process.cwd(), projectName);
  }

  static async create(
    projectName: string,
    options: ProjectOptions = {},
  ): Promise<ProjectGenerator> {
    const generator = new ProjectGenerator(projectName, options);

    await generator.createProjectDirectory();
    await generator.generateFiles();

    return generator;
  }

  private async createProjectDirectory(): Promise<void> {
    try {
      await access(this.outputDir, constants.F_OK);

      const entries = await readdir(this.outputDir);

      if (entries.length > 0) {
        throw new Error(
          `Directory "${this.projectName}" already exists and is not empty.`,
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await mkdir(this.outputDir, { recursive: true });
        return;
      }

      throw error;
    }
  }

  private async generateFiles(): Promise<void> {
    console.log("📁 Creating project...");

    const files = [
      {
        name: "app.alang",
        content: generateAppLang(this.projectName),
      },
      {
        name: "README.md",
        content: generateReadme(this.projectName),
      },
      {
        name: ".gitignore",
        content: generateGitignore(),
      },
    ];

    await Promise.all(
      files.map(async (file) => {
        await writeFile(
          path.join(this.outputDir, file.name),
          file.content,
        );

        console.log(`✔ ${file.name}`);
      }),
    );

    console.log("\n✨ Project created successfully!");
  }
}