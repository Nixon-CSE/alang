import { access, mkdir, readdir, writeFile } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { generateAppLang } from "../templates/app.js";
import { generateGitignore } from "../templates/gitignore.js";
import { generateReadme } from "../templates/readme.js";

export class ProjectGenerator {
  constructor(
    private readonly projectName: string,
    private readonly outputDir: string = projectName,
  ) {}

  async createProjectDirectory(): Promise<void> {
    try {
      await access(this.outputDir, constants.F_OK);
      const entries = await readdir(this.outputDir);

      if (entries.length > 0) {
        throw new Error(
          `Directory "${this.outputDir}" already exists and is not empty.`,
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

  async generateFiles(): Promise<void> {
    await writeFile(
      path.join(this.outputDir, "app.alang"),
      generateAppLang(this.projectName),
    );
    await writeFile(
      path.join(this.outputDir, "README.md"),
      generateReadme(this.projectName),
    );
    await writeFile(
      path.join(this.outputDir, ".gitignore"),
      generateGitignore(),
    );
  }
}
