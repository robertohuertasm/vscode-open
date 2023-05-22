<div align="center">
<h1>
<img src="https://raw.githubusercontent.com/robertohuertasm/vscode-open/master/resources/logo.png" alt="logo" width="250">

<b>vscode-open</b>
</h1>

<h3>Open <a href="https://code.visualstudio.com" target="_blank">Visual Studio Code</a> with a URL</h3>
<br/>

[![Version](https://vsmarketplacebadges.dev/version-short/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)
[![Installs](https://vsmarketplacebadges.dev/installs-short/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)
[![Ratings](https://vsmarketplacebadges.dev/rating/robertohuertasm.open-vscode.svg?style=for-the-badge&colorA=252525&colorB=3f860b)](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.open-vscode)

<br/>

![demo](https://raw.githubusercontent.com/robertohuertasm/vscode-open/master/resources/demo.gif)

</div>

## Purpose

The basic idea for this extension is to provide a **standard way to open your repositories and files in Visual Studio Code from a URL**.

## Challenge

Although VSCode [already provides a way to open files from a URL](https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls), it needs to know the specific path to the file. So it's **not practical** if you want to link to a particular file for any user.

Aside from that, it doesn't support cases such as:

- Open a repository which is not already cloned.
- Locate a repository in the system.
- Understand if the repository is in the same branch and let the user checkout to a particular commit if needed.

**This extension aims to cover all these use cases**.

## Features & link protocol

The extension allows you to open Visual Studio Code from any well-formed URL.

The **URL format** should be:

`vscode://robertohuertasm.open-vscode?repo=<name_of_your_repo>&file=<path_to_your_file>&range=<line:char-line:char>&uri=<git_clone_uri>&ref=<commit_hash_or_branch_name_or_tag_name>`.

Where:

Param Name | Mandatory | Description
---|:---:|---|
**repo**  | yes | Name of the repository.
**file**  | no  | Path to a file. It must be relative to the repo's root.
**range** | no  | There are several options here. You can reference a specific position in a line (*3:2, would put the cursor in line 3, column 2*), or a range, just passing a second position (*3:2-3:10, will select chars from 2 to 10 in line 3*). Note that `char` is totally optional and will fallback to 1. For instance, *3-10* is the same as *3:1-10:1*.
**uri**   | no  | Complete url of your git repository. supports both `https` and `ssh` git repo URIs. If you provide this parameter in your links, the extension will be able to clone the repository in case it cannot find it in the user's machine.
**ref**   | no  | Name of the branch, tag, commit sha.

As you can see, the **only mandatory parameter is the `repo`**.

> Note that you can also use `vscode-insiders://` or `vscodium://`.

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
- **Everytime the user opens a repo in VSCode, the extension will store both the name and the path**, so later it can use this information as a map to easily locate it.
- In case a repository is **not found**, the extension will ask the user whether to **locate it or clone it**.
- If a `ref` parameter is provided, the extension will use it when cloning the repository. In case the repository is already opened and it's not in the correct commit, the extension **will ask the user whether to checkout or not**.

## Settings

The extension offers a couple of settings:

- `vscode-open.gitFolders`: A **collection of folders containing your git repositories**. This will be used by the extension to try to find/locate your repositories when a url is handled. Note that there's also a `vscode-open.gitFoldersWindows` setting specifically to support `Windows` and a `vscode-open.gitFoldersMac` for `Mac`. If those are not set, `vscode-open.gitFolders` will be used by default.

- `vscode-open.maxGitFolderDepth`: This is set to 2 by default and **it represents the amount of nesting used by the extension when looking for your repositories**. Bear in mind that if this number is too high, the process of locating a repo in your `vscode-open.gitFolders` may take a long time. **It's recommended to only use a maximum of 3**.

## GitHub support

If you want to add links to [Visual Studio Code](https://code.visualstudio.com) in GitHub you can use our [Chrome extension](https://chrome.google.com/webstore/detail/open-in-vscode/fkjhdnadpbngmnkkbhecoblhmelbcnjp).

You'll get these links:

![github links](https://raw.githubusercontent.com/robertohuertasm/vscode-open/master/resources/github_links.png)

If you don't want to install the extension or you don't use a Chrome based browser you can also download this [user script](resources/userScripts/detailPage.js) and use the [TamperMonkey](https://www.tampermonkey.net/) browser extension.

## Logo

Credits to [Freepik](https://www.flaticon.com/free-icon/web_981896?related_id=981896&origin=tag)

## License

This extension is released under the [MIT license](/LICENSE).
