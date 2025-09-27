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
  const isExistingTab = changeInfo.status === 'loading' && changeInfo.url !== undefined;

  // --- 2. Check global limit ---
  if (config.globalLimit) {
    // Get all user tabs (exclude special browser & extension pages)
    const allTabs = (await getBrowser().tabs.query({})).filter(tab => {
      try {
        const url = new URL(tab.url);
        // Only count http and https pages
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (err) {
        // Invalid URL (chrome://, about:, etc.), skip
        return false;
      }
    });
    console.log("allTabs ::", allTabs)
    if (allTabs.length > config.globalLimit) {
      console.log(`Global tab limit exceeded (${allTabs.length}/${config.globalLimit}).`);

      try {
        // if (userOptions.closeNewTabsToggle) {
        // Send message to active tab to show modal
        try {
          const tabs = await getBrowser().tabs.query({ active: true, currentWindow: true });
          console.log("Active Tab :", tabs)
          getBrowser().tabs.sendMessage(tabs[0].id, {
            type: "showTabLimitModal",
            domain: "Overall ",
            count: allTabs.length
          });
        } catch (err) {
          // No content script in this tab, ignore
          console.warn("Could not send message to tab:", err);
        }
        // If this is a newly opened tab, we can remove it
        if (!isExistingTab) {
          await getBrowser().tabs.remove(tab.id);
          // After closing immediately, notify user for tab closed event happened
          getBrowser().notifications.create({
            type: "basic",
            iconUrl: "icons/16px.png",
            title: "Global Tab Limit Warning",
            message: `You have ${allTabs.length} tabs open. The newly opened tab will be closed.`
          });
        }
        // } else {
        //   // Close the oldest tab globally
        //   const oldest = allTabs.reduce((min, t) => (t.id < min.id ? t : min));
        //   getBrowser().notifications.create({
        //     type: "basic",
        //     iconUrl: "icons/16px.png",
        //     title: "Global Tab Limit Warning",
        //     message: `Global tab limit exceeded. Closing oldest tab: ${oldest.title} (ID: ${oldest.id}).`
        //   });
        //   await getBrowser().tabs.remove(oldest.id);
        // }
      } catch (err) {
        console.warn("Failed to enforce global tab limit:", err);
      }
      // If Global Limit is crossed then simply return,
      //  No need to check for domain especific
      return
    }
  }
  // --- 1. Check per-domain limits ---
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
          // const userOptions = await getOptions();
          // if (userOptions.closeNewTabsToggle) {



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
          // If this is a newly opened tab, we can remove it
          if (!isExistingTab) {
            await getBrowser().tabs.remove(tab.id);
            // After closing immediately, notify user for tab closed event happened
            getBrowser().notifications.create({
              type: "basic",
              iconUrl: "icons/16px.png",
              title: "Tab Limit Warning",
              message: `You already have ${openTabs.length} tabs open for ${entry.domain}.`
            });
          }

          // } else {
          //   console.log(openTabs);
          //   //lowest tab id is the oldest
          //   const lowest = openTabs.reduce((min, tab) =>
          //     tab.id < min.id ? tab : min
          //   );

          //   // Instead of closing immediately, first warn user
          //   getBrowser().notifications.create({
          //     type: "basic",
          //     iconUrl: "icons/16px.png",
          //     title: "Tab Limit Warning",
          //     message: `Too many tabs for ${entry.domain}. Oldest tab (${lowest.title} ID: ${lowest.id}) would be closed.`
          //   });

          //   await getBrowser().tabs.remove(lowest.id);



          // }
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
