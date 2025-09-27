// import { getBrowser, getConfig, getOptions } from './utils.js';
// importScripts("utils.js");

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


// Helper: check if URL matches domain or subdomain
//todo perhaps make the entries a MAP to fascilitate faster searchings
function matchesDomain(url, domain) {
  try {
    const u = new URL(url);
    return u.hostname === domain || u.hostname.endsWith('.' + domain);
  } catch {
    return false;
  }
}

// Count all tabs for a domain
async function getTabsForDomain(domain) {
  return await getBrowser().tabs.query({ url: `*://*.${domain}/*` });
}

getBrowser().tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url) return;

  const config = await getConfig();

  for (const entry of config.entries) {
    const isMatchedDomain = matchesDomain(tab.url, entry.domain)
    console.log("isMatchedDomain : ", isMatchedDomain)
    if (isMatchedDomain) {
      const openTabs = await getTabsForDomain(entry.domain);
      console.log("no of openTabs : ", openTabs)
      if (openTabs.length > entry.number) {
        console.log(
          `Tab limit exceeded for ${entry.domain}. Closing tab ${tab.id}`
        );
        try {
          const userOptions = await getOptions();
          if (userOptions.closeNewTabsToggle) {

            // Instead of closing immediately, warn user
            getBrowser().notifications.create({
              type: "basic",
              iconUrl: "icons/16px.png",
              title: "Tab Limit Warning",
              message: `You already have ${openTabs.length} tabs open for ${entry.domain}.`
            });

            // Send message to active tab to show modal
            try {
              const tabs = await getBrowser().tabs.query({ active: true, currentWindow: true });
              console.log("Active Tab :", tabs)
              getBrowser().tabs.sendMessage(tabs[0].id, {
                type: "showTabLimitModal",
                domain: entry.domain,
                count: openTabs.length
              });
            } catch (err) {
              // No content script in this tab, ignore
              console.warn("Could not send message to tab:", err);
            }
            await getBrowser().tabs.remove(tab.id);

          } else {
            console.log(openTabs);
            //lowest tab id is the oldest
            const lowest = openTabs.reduce((min, tab) =>
              tab.id < min.id ? tab : min
            );

            // Instead of closing immediately, first warn user
            getBrowser().notifications.create({
              type: "basic",
              iconUrl: "icons/16px.png",
              title: "Tab Limit Warning",
              message: `Too many tabs for ${entry.domain}. Oldest tab (${lowest.title} ID: ${lowest.id}) would be closed.`
            });

            await getBrowser().tabs.remove(lowest.id);



          }
        } catch (err) {
          console.warn('Failed to close tab:', err);
        }
      }

      break; // only check the first matching entry
    }
  }
});

console.log("getBrowser() ::", getBrowser())
getBrowser().browserAction.onClicked.addListener(() => {
  console.log("clicking to open config page ")
  // Opens the extension options page
  getBrowser().runtime.openOptionsPage();
});

// In background.js
// getBrowser().tabs.query({ active: true, currentWindow: true }, tabs => {
//   console.log("from background.js , trying to load content script")
//   // getBrowser().tabs.executeScript(tabs[0].id, { file: "content.js" });
//   chrome.scripting.executeScript({
//     target: { tabId: tabs[0].id },
//     files: ["content.js"]
//   });
// });

// getBrowser().runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
//   if (msg.type === "checkTabLimit") {
//     // const allTabs = await getBrowser().tabs.query({});
//     //  const isMatchedDomain = matchesDomain(tab.url, msg.domain)
//     // const domainTabs = allTabs.filter(tab => new URL(tab.url).hostname === msg.domain);
//     // const MAX_TABS = 5; // set your limit
//     sendResponse({
//       // limitReached: domainTabs.length >= MAX_TABS,
//       limitReached: 5,
//       domain: msg.domain
//     });
//     return true; // keep message channel open for async
//   }
// });
