#!/usr/bin/env bun

type RunCommandOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
};

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].join(" ");
}

function normalizeEnv(
  env?: Record<string, string | undefined>
): Record<string, string> | undefined {
  if (!env) {
    return;
  }

  return Object.fromEntries(
    Object.entries(env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<void> {
  const fullCommand = formatCommand(command, args);

  try {
    const child = Bun.spawn([command, ...args], {
      cwd: options.cwd,
      env: normalizeEnv(options.env),
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await child.exited;
    if (exitCode !== 0) {
      throw new Error(
        `Command failed with exit code ${exitCode}: ${fullCommand}`
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to run command "${fullCommand}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
