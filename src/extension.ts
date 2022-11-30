// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import type { API, GitExtension } from './git';
import {
  getOpenedRepoHistory,
  resetOpenedRepoHistory,
  resetPendingUriToOpen,
} from './repoHistory';
import { VSCodeOpenUriHandler } from './vscodeUriHandler';

async function getGitApi(): Promise<API | undefined> {
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExtension) {
    console.error('Git extension not found!');
    return undefined;
  }
  const gitApi = gitExtension.isActive
    ? gitExtension.exports
    : await gitExtension.activate();
  return gitApi.getAPI(1);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.log('vscode-open enabled!');

  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-open.reset', () => {
      resetOpenedRepoHistory(context);
      resetPendingUriToOpen(context);
      vscode.window.showInformationMessage(
        'Known repositories and pending uri records have been reseted',
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-open.knownRepos', async () => {
      const knownRepos = await getOpenedRepoHistory(context);
      if (!knownRepos || !Object.keys(knownRepos).length) {
        vscode.window.showInformationMessage('No known repositories');
      } else {
        const json = JSON.stringify(knownRepos, null, 2); // pretty print
        vscode.workspace.openTextDocument({ content: json, language: 'json' });
      }
    }),
  );

  const git = await getGitApi();

  context.subscriptions.push(
    vscode.window.registerUriHandler(new VSCodeOpenUriHandler(context, git)),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
