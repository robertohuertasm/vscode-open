import * as vscode from 'vscode';
import * as qs from 'qs';
import { API, Branch, Repository } from './git';
import {
  addPendingUriToOpen,
  getOpenedRepoHistory,
  removeOpenedRepoFromHistory,
} from './repoHistory';

// The kind of URIS we are handling will be like this:
// file & position are optional.
// repo is required.
// repo uri is optional: https://gitlab.com/valudio/dev-server.git or git@gitlab.com:valudio/dev-server.git
// ref is optional: branch name, tag name, commit hash
// vscode://robertohuertasm.vscode-open?repo=syntethics-poc&file=src/index.ts&position=2:13
// vscode://robertohuertasm.vscode-open?repo=synthetics-tunnel-poc&file=test/index.test.js&position=2:13
// vscode-insiders://robertohuertasm.vscode-open?repo=licensebat-tester&uri=https://github.com/robertohuertasm/licensebat-tester.git&ref=6a6f81df68878681d2727ec05f5e3a8516ccd21d&file=.licrc&position=1:5

function isAvoidableDir(dir: string): boolean {
  // add more meaningful dirs here
  return (
    dir === '.git' ||
    dir === '.vscode' ||
    dir === 'node_modules' ||
    dir === 'dist' ||
    dir === '$RECYBLE.BIN' ||
    dir === 'out'
  );
}

async function isGitRepo(dirUri: vscode.Uri) {
  const gitFolder = vscode.Uri.joinPath(dirUri, '.git');
  try {
    await vscode.workspace.fs.stat(gitFolder);
    return true;
  } catch (error) {
    return false;
  }
}

export class Opener {
  public readonly repoName: string;
  public readonly repoUri?: string;
  public readonly file?: string;
  public readonly repoRef?: string;

  public readonly range?: vscode.Range;

  constructor(
    private originalUri: vscode.Uri,
    private context: vscode.ExtensionContext,
    private git: API,
  ) {
    const query = qs.parse(originalUri.query) as {
      repo: string;
      uri?: string;
      ref?: string;
      file?: string;
      range?: string;
    };
    this.repoName = query.repo;
    this.repoUri = query.uri;
    this.repoRef = query.ref;
    this.file = query.file;
    this.range = this.rangeFromString(query.range);
  }

  public async open(): Promise<void> {
    const workspaces = vscode.workspace.workspaceFolders;
    if (!workspaces?.length) {
      // there is no workspace open
      await this.openNewWorkspace();
      return;
    }

    // there is at least a workspace open
    // is the correct workspace already open?
    const correctWorkspace = workspaces.find((w) =>
      w.uri.fsPath.endsWith(this.repoName),
    );

    if (correctWorkspace) {
      // did the user asked for a particular ref?
      const gitRepo = await this.git.openRepository(correctWorkspace.uri);
      if (gitRepo && this.repoRef) {
        // are we in the correct ref?
        let currentCommit = (await this.getCurrentCommit(gitRepo))?.commit;
        let repoRefCommit = await gitRepo.getCommit(this.repoRef);
        console.log(`CurrentCommit ${currentCommit} === ${repoRefCommit.hash}`);
        if (
          currentCommit &&
          repoRefCommit &&
          currentCommit !== repoRefCommit.hash
        ) {
          // it seems that's not the case!!
          // ask the user if they want to checkout the correct branch
          const response = await vscode.window.showInformationMessage(
            `It seems that you're not in the correct branch. Do you want to checkout ${this.repoRef}?`,
            'Yes',
            'No',
          );
          if (response === 'Yes') {
            await gitRepo.checkout(this.repoRef);
          }
        }
      } else {
        console.log('NO GIT REPO????');
      }

      if (!this.file) {
        // we wanted to open precisely this particular repo (not a file) which is already open.
        return;
      }

      // for the moment, we'll check that the file exists (in case it has been deleted in the current branch)
      const files = await vscode.workspace.findFiles(this.file);
      if (files) {
        await this.openFile(correctWorkspace, this.file);
      }
    } else {
      // it's not in the correct workspace, let's open it in a new window
      await this.openNewWorkspace(true);
    }
  }

  private async openNewWorkspace(forceNewWindow = false) {
    // has this repo been ever opened?
    const knownRepoInfo = await getOpenedRepoHistory(this.context);
    const knownRepo = knownRepoInfo[this.repoName];
    console.log(`knownRepo ${this.repoName}: ${knownRepo}`);
    // if the repo is not found in the history, we're going to search it in the config roots
    const repoPath = knownRepo
      ? vscode.Uri.file(knownRepo)
      : await this.findFolderInConfigRoots();

    if (this.file) {
      // NOTE: opening a folder causes the extension to reload again.
      // This means that if you want to open a file, you need to do it on extension activation.
      //
      // We're going to store the info about the latest uri before opening the folder,
      // so we can open it after the folder is opened and the extension is re-activated.
      // see uriHandler.ts for details on how this is handled.
      await addPendingUriToOpen(this.context, this.originalUri);
    }

    await this.openFolder(repoPath, forceNewWindow);
  }

  private async getCurrentCommit(
    repo: Repository,
  ): Promise<Branch | undefined> {
    if (repo.state.HEAD) {
      return repo.state.HEAD;
    }

    let attempts = 0;
    let interval: string | number | NodeJS.Timeout;
    const branch = await new Promise<Branch | undefined>((res) => {
      interval = setInterval(() => {
        if (repo.state.HEAD || attempts > 3) {
          clearInterval(interval);
          res(repo.state.HEAD);
        }
        attempts += 1;
        console.log(`Attempt ${attempts} to get current commit`);
      }, 1000);
    });
    console.log(`Current commit: ${branch?.commit} - name: ${branch?.name}`);
    return branch;
  }

  private async openFolder(
    folder: vscode.Uri | undefined,
    forceNewWindow = false,
  ): Promise<void> {
    // 1.  if folder exists, we're going to open it directly.
    if (folder) {
      // before doing anything we'll test that the folder exists,
      // just in case this comes from an old known repo that has been moved or deleted.
      try {
        await vscode.workspace.fs.stat(folder);
        return vscode.commands.executeCommand('vscode.openFolder', folder, {
          forceNewWindow,
        });
      } catch (err) {
        // let's remove it from the knwon repos
        removeOpenedRepoFromHistory(this.repoName, this.context);
        console.error(`Known repo must have been deleted. Not found. ${err}`);
      }
    }
    // 2. if folder doesn't exist, we're going to ask the user to select a folder or clone the repo
    const cloneIt = `Clone it`;
    const openIt = `Open it from my computer`;
    const response = await vscode.window.showInformationMessage(
      `We cannot find repo ${this.repoName}. What do you want to do?`,
      cloneIt,
      openIt,
    );
    if (response === cloneIt) {
      await vscode.commands.executeCommand('vscode.open', this.toGitCloneUri());
    } else if (response === openIt) {
      await vscode.commands.executeCommand('vscode.openFolder', undefined, {
        forceNewWindow,
      });
    }
  }

  private toGitCloneUri(): vscode.Uri {
    const uri = this.originalUri;
    return vscode.Uri.parse(
      `${uri.scheme}://vscode.git/clone?url=${this.repoUri}&ref=${this.repoRef}`,
    );
  }

  private async openFile(
    workspaceFolder: vscode.WorkspaceFolder,
    file: string,
  ): Promise<void> {
    const rootPath = workspaceFolder.uri;
    const openUri = vscode.Uri.joinPath(rootPath, file);
    await vscode.commands.executeCommand('vscode.open', openUri, {
      selection: this.range,
    });
  }

  private async searchRepoInDir(
    directory: string,
    maxDepth: number,
    level = 0,
  ): Promise<vscode.Uri | undefined> {
    console.info(`Searching ${this.repoName} in ${directory}`);
    if (level > maxDepth) {
      console.log(`Max depth reached ${maxDepth}`);
      return;
    }
    const dir = vscode.Uri.file(directory);
    try {
      const items = await vscode.workspace.fs.readDirectory(dir);
      for (const item of items) {
        const itemName = item[0];
        if (item[1] === vscode.FileType.File || isAvoidableDir(itemName)) {
          continue;
        }
        const dirUri = vscode.Uri.joinPath(dir, itemName);
        if (itemName === this.repoName && (await isGitRepo(dirUri))) {
          // found!
          return dirUri;
        } else {
          // keep looking
          const result = await this.searchRepoInDir(
            dirUri.fsPath,
            maxDepth,
            level + 1,
          );
          if (result) {
            return result;
          }
        }
      }
    } catch (error) {
      // most probably the root is not ok.
      console.error(error);
    }
  }

  private async findFolderInConfigRoots(): Promise<vscode.Uri | undefined> {
    if (!this.repoName) {
      vscode.window.showErrorMessage('No repo specified in the link');
      return;
    }

    const roots = this.getRootsFromConfig();
    const maxDepth = this.getMaxDepthFromConfig();

    for (const root of roots) {
      const uri = await this.searchRepoInDir(root, maxDepth);
      if (uri) {
        return uri;
      }
    }
  }

  private positionFromString(
    position: string | undefined,
  ): vscode.Position | undefined {
    if (!position) {
      return undefined;
    }
    const [line, character] = position.split(':');
    const char = character ? Number(character) - 1 : 0;
    return new vscode.Position(Number(line) - 1, char);
  }

  private rangeFromString(range: string | undefined): vscode.Range | undefined {
    if (!range) {
      return undefined;
    }
    const [position1, position2] = range.split('-');
    const start = this.positionFromString(position1);
    const end = this.positionFromString(position2);

    if (!start) {
      return undefined;
    }

    return new vscode.Range(start, end || start);
  }

  private getRootsFromConfig(): string[] {
    const config = vscode.workspace.getConfiguration('vscode-open');
    const prop =
      process.platform === 'win32'
        ? 'gitFoldersWindows'
        : process.platform === 'darwin'
        ? 'gitFoldersMac'
        : 'gitFolders';
    const roots = (config.get(prop) ||
      config.get('gitFolders') ||
      []) as string[];
    return roots;
  }

  private getMaxDepthFromConfig(): number {
    const config = vscode.workspace.getConfiguration('vscode-open');
    const maxDepth: number = config.get('maxGitFolderDepth') || 2;
    return maxDepth;
  }
}
