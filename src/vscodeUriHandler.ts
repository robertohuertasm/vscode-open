import * as vscode from 'vscode';
import type { API } from './git';
import { Opener, isGitRepository } from './opener';
import {
  addOpenedRepoToHistory,
  getPendingUriToOpen,
  resetPendingUriToOpen,
} from './repoHistory';

export class VSCodeOpenUriHandler implements vscode.UriHandler {
  constructor(private context: vscode.ExtensionContext, private git?: API) {
    // fire and forget
    this.handlePendingUriToOpen();
    this.storeFolderInformation();
  }

  public async handleUri(uri: vscode.Uri) {
    console.log(`[vscode-open]: Handling URI: ${uri}`);
    const info = new Opener(uri, this.context, this.git);
    await info.open();
  }

  private async storeFolderInformation(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      console.log('[vscode-open]: NO FOLDER OPEN!');
      return;
    }
    // check if the workspace folders are git repos.
    // in case they are, store the path of the repo.
    // { repoName: repoPath }
    await Promise.all(
      folders.map(async (folder) => {
        if (await this.isGitRepository(folder)) {
          await addOpenedRepoToHistory(folder, this.context);
        }
      }),
    );
  }

  private async handlePendingUriToOpen() {
    const pendingUriToOpen = getPendingUriToOpen(this.context);
    if (pendingUriToOpen) {
      console.log(
        `[vscode-open]: @@@@ Handler found pending uri to open! ${pendingUriToOpen}`,
      );
      await resetPendingUriToOpen(this.context);
      const info = new Opener(
        vscode.Uri.parse(pendingUriToOpen),
        this.context,
        this.git,
      );
      info.open();
    }
  }

  private async isGitRepository(
    folder: vscode.WorkspaceFolder,
  ): Promise<boolean> {
    if (folder.uri.scheme !== 'file') {
      return false;
    }
    return isGitRepository(folder.uri);
  }
}
