import { Toolbox } from 'gluegun/build/types/domain/toolbox';
import { spawn, type SpawnOptions, type StdioOptions } from 'node:child_process';

type STDIO = 'inherit' | 'ignore' | 'pipe' | 'overlapped';
type CommandStdio = readonly [STDIO, STDIO, STDIO] | STDIO | undefined;

export const ONLY_ERRORS = ['ignore', 'ignore', 'inherit'] as const;

type SystemCommandResult = {
  stdout: string | null;
  stderr: string | null;
  status: number | null;
  error?: unknown;
};

export async function runSystemCommand({
  command,
  errorMessage,
  stdio,
  toolbox,
  shell = true,
  env,
  failOnError = true
}: {
  command: string;
  toolbox: Toolbox;
  stdio: CommandStdio;
  errorMessage: string;
  shell?: boolean;
  env?: Record<string, string>;
  failOnError?: boolean;
}) {
  const {
    print: { error },
    system
  } = toolbox;

  const result =
    shell === false
      ? await system.spawn(command, {
          shell,
          stdio,
          env
        })
      : await spawnShellCommand(command, stdio, env);

  if (failOnError && (result.error || result.status !== 0)) {
    error(`${errorMessage}: ${JSON.stringify(result)}`);

    error(`failed to run command: ${command}`);

    return process.exit(1);
  } else {
    return result.stdout;
  }
}

export function quoteShellArg(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function spawnShellCommand(
  command: string,
  stdio: CommandStdio,
  env?: Record<string, string>
): Promise<SystemCommandResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const options: SpawnOptions = {
      shell: true,
      stdio: normalizeStdio(stdio) ?? 'pipe',
      env: env ? { ...process.env, ...env } : process.env
    };
    const child = spawn(command, options);

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', (spawnError) => {
      resolve({
        stdout: stdout || null,
        stderr: stderr || null,
        status: null,
        error: spawnError
      });
    });

    child.on('close', (status) => {
      resolve({
        stdout: stdout || null,
        stderr: stderr || null,
        status,
        error: undefined
      });
    });
  });
}

function normalizeStdio(stdio: CommandStdio): StdioOptions | undefined {
  if (stdio === undefined) {
    return undefined;
  }

  if (Array.isArray(stdio)) {
    return [...stdio] as StdioOptions;
  }

  return stdio as StdioOptions;
}
