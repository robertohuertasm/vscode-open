import * as vscode from 'vscode';

const OPENED_REPO_HISTORY_KEY = 'openedRepoHistory';
const PENDING_URI_TO_OPEN = 'vscode-open.last-uri';

export async function getOpenedRepoHistory(
  context: vscode.ExtensionContext,
): Promise<Record<string, string | undefined>> {
  return (await context.globalState.get(OPENED_REPO_HISTORY_KEY)) || {};
}

export async function addOpenedRepoToHistory(
  folder: vscode.WorkspaceFolder,
  context: vscode.ExtensionContext,
): Promise<void> {
  const repos = await getOpenedRepoHistory(context);
  repos[folder.name] = folder.uri.fsPath;
  await context.globalState.update(OPENED_REPO_HISTORY_KEY, repos);
  // re-check, there are some cases where this might not work
  const check = await getOpenedRepoHistory(context);
  if (!check[folder.name]) {
    console.error(`Failed to save ${folder.name} to repo history`);
  } else {
    console.log(`Added repo ${folder.name} to the repo history`);
  }
}

export async function removeOpenedRepoFromHistory(
  repoName: string,
  context: vscode.ExtensionContext,
): Promise<void> {
  const repos = await getOpenedRepoHistory(context);
  delete repos[repoName];
  await context.globalState.update(OPENED_REPO_HISTORY_KEY, repos);
  console.log(`Removed repo ${repoName} from the repo history`);
}

export async function resetOpenedRepoHistory(
  context: vscode.ExtensionContext,
): Promise<void> {
  await context.globalState.update(OPENED_REPO_HISTORY_KEY, {});
}

export async function addPendingUriToOpen(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
): Promise<void> {
  await context.globalState.update(PENDING_URI_TO_OPEN, uri.toString());
}

export function getPendingUriToOpen(context: vscode.ExtensionContext) {
  return context.globalState.get<string>(PENDING_URI_TO_OPEN);
}

export async function resetPendingUriToOpen(
  context: vscode.ExtensionContext,
): Promise<void> {
  await context.globalState.update(PENDING_URI_TO_OPEN, undefined);
}
