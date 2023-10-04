import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { FormatterUtil } from "./FormatterUtil.ts";

export async function readFileFromAppConfig(filename: string): Promise<string> {
  try {
    return await readTextFile(filename, {
      dir: BaseDirectory.AppConfig,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return "";
  }
}

export async function writeFileToAppConfigXml(
  filename: string,
  content: string,
): Promise<void> {
  const formattedContent = FormatterUtil.format(content);
  writeFileToAppConfig(filename, formattedContent);
}

export async function writeFileToAppConfig(
  filename: string,
  content: string,
): Promise<void> {
  try {
    writeTextFile(filename, content, { dir: BaseDirectory.AppConfig });
  } catch (error) {
    console.error("Error writing file:", error);
  }
}
