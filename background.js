import { getBrowser, getConfig, getOptions } from './utils.js';

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
              message: `Too many tabs for ${entry.domain}. Oldest tab (ID: ${lowest.id}) would be closed.`
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

getBrowser().action.onClicked.addListener(() => {
  // Opens the extension options page
  getBrowser().runtime.openOptionsPage();
});


// chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
//   if (msg.type === "checkTabLimit") {
//     // const allTabs = await chrome.tabs.query({});
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
