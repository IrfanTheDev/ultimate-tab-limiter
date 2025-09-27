// TODO move to utils.js

async function getConfig() {
  const result = await getBrowser().storage.local.get('userConfig');
  return result.userConfig || { entries: [] };
}
async function getOptions() {
  const result = await getBrowser().storage.local.get('userOptions');
  return result.userOptions || { closeNewTabsToggle: true };
}
function getBrowser() {
  if (typeof browser !== 'undefined') {
    return browser;
  } else return chrome;
}
