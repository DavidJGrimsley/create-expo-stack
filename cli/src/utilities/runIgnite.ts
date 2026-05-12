import { Toolbox } from 'gluegun/build/types/domain/toolbox';
import { getPackageManager } from './getPackageManager';
import { CliResults } from '../types';
import { quoteShellArg, runSystemCommand } from './systemCommand';

export async function runIgnite(toolbox: Toolbox, projectName: string, cliResults: CliResults) {
  const {
    print: { success }
  } = toolbox;

  const packageManager = getPackageManager(toolbox, cliResults);
  const projectDir = quoteShellArg(projectName);

  success('Running Ignite CLI to create an opinionated stack...');
  await runSystemCommand({
    command: `npx ignite-cli@$latest new ${projectDir} --packager=${packageManager} --yes`,
    errorMessage: 'Error creating Ignite project',
    stdio: 'inherit',
    toolbox
  });
}
