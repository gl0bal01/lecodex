import path from "path"
import { FilePath } from "./path"
import { globby } from "globby"

export function toPosixPath(fp: string): string {
  return fp.split(path.sep).join("/")
}

export async function glob(
  pattern: string,
  cwd: string,
  ignorePatterns: string[],
): Promise<FilePath[]> {
  const fps = (
    await globby(pattern, {
      cwd,
      ignore: ignorePatterns,
      // content/ is ignored by this repo because CI populates it at build time.
      // Quartz's configured ignorePatterns are the source of truth for published files.
      gitignore: false,
    })
  ).map(toPosixPath)
  return fps as FilePath[]
}
