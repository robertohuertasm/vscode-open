<div align="center">
<h1>
<img src="https://raw.githubusercontent.com/robertohuertasm/vscode-open/master/resources/logo.png" alt="logo" width="250">

<b>vscode-open</b>
</h1>

<h3>Open <a href="https://code.visualstudio.com" target="_blank">Visual Studio Code</a> with a URL</h3>
<br/>

[![Version](https://img.shields.io/visual-studio-marketplace/v/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)
[![Ratings](https://img.shields.io/visual-studio-marketplace/r/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)

<br/>

![demo](https://raw.githubusercontent.com/robertohuertasm/vscode-open/master/resources/demo.gif)

</div>

## Purpose

This extension provides a **standard way to open repositories and files in Visual Studio Code from a URL**.

## Quick start

1. Install the extension from the VS Code marketplace.
2. Configure `vscode-open.gitFolders` (or the OS-specific settings) with the
   parent folders that contain your Git repositories.
3. Open a link using the protocol described below.
4. If the repo is not found, you can locate it or clone it when prompted (if a
   `uri` is provided).

## Challenge

Although VS Code [already provides a way to open files from a URL](https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls), it needs to know the specific path to the file. So it is **not practical** if you want to link to a particular file for any user.

Aside from that, it doesn't support cases such as:

- Open a repository that is not already cloned.
- Locate a repository on the system.
- Detect whether the repository is on the right ref and let the user check out
  the requested ref if needed.

**This extension aims to cover all these use cases**.

## Features and link protocol

The extension allows you to open Visual Studio Code from any well-formed URL.
Query values should be URL-encoded when needed (for example, spaces).

The **URL format** is:

`vscode://robertohuertasm.open-vscode?repo=<repo_name>&file=<path_to_file>&range=<line:char-line:char>&uri=<git_clone_uri>&ref=<commit_hash_or_branch_or_tag>`.

Where:

Param Name | Mandatory | Description
---|:---:|---|
**repo**  | yes | Name of the repository.
**file**  | no  | Path to a file. It must be relative to the repo root.
**range** | no  | Cursor position or range. Use `3:2` to place the cursor at line 3, column 2. Use `3:2-3:10` to select a range. `char` defaults to `1`, so `3-10` equals `3:1-10:1`.
**uri**   | no  | Full Git clone URL. Supports `https` and `ssh`. If provided, the extension can clone the repository when it cannot be found locally.
**ref**   | no  | Branch, tag, or commit SHA.

The **only mandatory parameter is `repo`**.

> You can also use `vscode-insiders://` or `vscodium://`.

Examples:

```sh
# Visual Studio Code
vscode://robertohuertasm.open-vscode?repo=licensebat&uri=https://github.com/licensebat/licensebat.git&ref=6ec2f28d98d61f8d56cabeb5028abcd432f5bf41&file=licensebat-cli/src/cli.rs&range=17:5

# Visual Studio Code Insiders
vscode-insiders://robertohuertasm.open-vscode?repo=licensebat&uri=https://github.com/licensebat/licensebat.git&ref=6ec2f28d98d61f8d56cabeb5028abcd432f5bf41&file=licensebat-cli/src/cli.rs&range=17:5

# VSCodium
vscodium://robertohuertasm.open-vscode?repo=licensebat&uri=https://github.com/licensebat/licensebat.git&ref=6ec2f28d98d61f8d56cabeb5028abcd432f5bf41&file=licensebat-cli/src/cli.rs&range=17:5
```

## Strategies to locate repositories

The extension uses several strategies to try to find and locate the repositories in the user's machine:

- The extension provides a setting for the user to inform the **paths of the folders containing git repositories**.
- **Every time the user opens a repo in VS Code, the extension will store both the name and the path**, so later it can use this information as a map to easily locate it.
- In case a repository is **not found**, the extension will ask the user whether to **locate it or clone it**.
- If a `ref` parameter is provided, the extension will use it when cloning the repository. In case the repository is already opened and it's not in the correct commit, the extension **will ask the user whether to check out or not**.

## Settings

The extension offers a couple of settings:

- `vscode-open.gitFolders`: A **list of folders containing your Git repositories**. This will be used by the extension to try to find/locate your repositories when a URL is handled. Note that there's also a `vscode-open.gitFoldersWindows` setting specifically to support `Windows` and a `vscode-open.gitFoldersMac` for `Mac`. If those are not set, `vscode-open.gitFolders` will be used by default.

- `vscode-open.maxGitFolderDepth`: Defaults to `2` and **controls the search depth when looking for your repositories**. A high value can slow the search. **A maximum of 3 is recommended**.

## Troubleshooting

- **Repo not found**: Add the parent folder to `vscode-open.gitFolders`, or
  open the repo once in VS Code so it is stored in the history. If you include
  `uri`, the extension can clone it.
- **File not found**: Confirm the `file` path is relative to the repo root and
  exists on the requested ref.
- **Ref not found**: Check the `ref` value. It can be a branch name, tag, or
  commit SHA.

## GitHub support

If you want to add links to [Visual Studio Code](https://code.visualstudio.com) inside GitHub, use the [Chrome extension](https://chrome.google.com/webstore/detail/open-in-vscode/fkjhdnadpbngmnkkbhecoblhmelbcnjp).

You'll get these links:

![github links](https://raw.githubusercontent.com/robertohuertasm/vscode-open/master/resources/github_links.png)

If you do not want to install the Chrome extension or you use a different browser, you can also use this [user script](resources/userScripts/detailPage.js) with [TamperMonkey](https://www.tampermonkey.net/).

## Logo

Credits to [Freepik](https://www.flaticon.com/free-icon/web_981896?related_id=981896&origin=tag)

## License

This extension is released under the [MIT license](/LICENSE).
