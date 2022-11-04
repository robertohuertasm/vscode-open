const DETAIL_PAGE_SEPARATOR = '/blob/';
const BTN_VSCODE = 'vscode';
const BTN_INSIDERS = 'vscode-insiders';

console.log('Loading content script');

function addButton(text, link, node, id) {
  const el = document.createElement('a');
  el.id = id;
  el.innerHTML = text;
  el.href = link;
  el.target = '_blank';
  el.className =
    'SelectMenu-item no-wrap width-full text-normal color-fg-default f5';
  const children = node.children;
  const last = children[children.length - 1];
  node.insertBefore(el, last.nextSibling);
  // console.log('Element added!');
}

function addElement(time) {
  setTimeout(() => {
    try {
      const url = window.location.href;
      // are we in page detail?
      // url example: https://github.com/robertohuertasm/vscode-open/blob/master/.prettierignore#L3
      const isDetailPage = url.includes(DETAIL_PAGE_SEPARATOR);
      if (!isDetailPage) {
        return;
      }

      const hasButtons = document.querySelector(`#${BTN_VSCODE}`);
      if (hasButtons) {
        // console.log('already has buttons');
        return;
      }
      // repo would be https://github.com/robertohuertasm/vscode-open
      // rest would be master/file#L3, L3 is optional
      const [repoUri, rest] = url.split(DETAIL_PAGE_SEPARATOR);
      // we only want the name, not the org or the owner.
      const [_owner, repoName] = repoUri
        .replace('https://github.com/', '')
        .split('/');
      // let's get the branch
      // console.log(rest);
      const firstSlashIndex = rest.indexOf('/');
      const ref = rest.substring(0, firstSlashIndex);
      // note that line can be undefined
      const [file, range] = rest
        .substring(firstSlashIndex + 1, rest.length)
        .split('#');
      // build link
      let link = `vscode://robertohuertasm.vscode-open?repo=${repoName}&file=${file}&uri=${repoUri}&ref=${ref}`;
      if (range) {
        // L3
        // L3-L5
        const [position1, position2] = range.replace(/L/g, '').split('-');
        const start = `${position1}:1`;
        const end = `${position2 || position1}:1000`;
        link += `&range=${start}-${end}`;
      }
      // page detail
      const node = document.querySelector(
        '.SelectMenu-list.SelectMenu-list--borderless.py-2',
      );
      addButton('Open in VSCode', link, node, BTN_VSCODE);
      addButton(
        'Open in VSCode Insiders',
        link.replace('vscode://', 'vscode-insiders://'),
        node,
        BTN_INSIDERS,
      );
    } catch (e) {
      console.error(e);
      console.log('Trying to add the element again');
      addElement(time + 1000);
    }
  }, time);
}

chrome.runtime.onMessage.addListener(function (
  request,
  _sender,
  _sendResponse,
) {
  // listen for messages sent from background.js
  if (request.message === 'urlChanged') {
    // console.log(`url change: ${request.url}`);
    addElement(1000);
  }
});

addElement(1000);
