import { readdirSync } from 'fs';
import { join } from 'path';

export function getFilePaths(directory?: string, nesting?: boolean): string[] {
  let filePaths: string[] = [];
  if (!directory) return filePaths;

  try {
    const files = readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
      const filePath = join(directory, file.name);

      if (file.isFile()) {
        filePaths.push(filePath);
      }

      if (nesting && file.isDirectory()) {
        filePaths = [...filePaths, ...getFilePaths(filePath, true)];
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }

  return filePaths;
}

export function getFolderPaths(directory?: string, nesting?: boolean): string[] {
  let folderPaths: string[] = [];
  if (!directory) return folderPaths;

  try {
    const folders = readdirSync(directory, { withFileTypes: true });

    for (const folder of folders) {
      const folderPath = join(directory, folder.name);

      if (folder.isDirectory()) {
        folderPaths.push(folderPath);

        if (nesting) {
          folderPaths = [...folderPaths, ...getFolderPaths(folderPath, true)];
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }

  return folderPaths;
}