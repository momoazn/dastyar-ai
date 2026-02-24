#!/usr/bin/env bun

type RunCommandOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
  quiet?: boolean;
};

export type RunCommandResult = {
  command: string;
  durationMs: number;
  exitCode: number;
  stderr: string;
  stdout: string;
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
): Promise<RunCommandResult> {
  const fullCommand = formatCommand(command, args);
  const startedAt = Date.now();
  const quiet = options.quiet ?? false;

  try {
    const child = Bun.spawn([command, ...args], {
      cwd: options.cwd,
      env: normalizeEnv(options.env),
      stdin: "inherit",
      stdout: quiet ? "pipe" : "inherit",
      stderr: quiet ? "pipe" : "inherit",
    });

    const stdoutPromise =
      quiet && child.stdout
        ? new Response(child.stdout).text()
        : Promise.resolve("");
    const stderrPromise =
      quiet && child.stderr
        ? new Response(child.stderr).text()
        : Promise.resolve("");
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      stdoutPromise,
      stderrPromise,
    ]);

    if (exitCode !== 0) {
      const outputChunks: string[] = [];
      if (stdout.trim().length > 0) {
        outputChunks.push(`stdout:\n${stdout.trim()}`);
      }
      if (stderr.trim().length > 0) {
        outputChunks.push(`stderr:\n${stderr.trim()}`);
      }

      throw new Error(
        `Command failed with exit code ${exitCode}: ${fullCommand}${outputChunks.length > 0 ? `\n\n${outputChunks.join("\n\n")}` : ""}`
      );
    }

    return {
      command: fullCommand,
      durationMs: Date.now() - startedAt,
      exitCode,
      stdout,
      stderr,
    };
  } catch (error) {
    throw new Error(
      `Failed to run command "${fullCommand}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
