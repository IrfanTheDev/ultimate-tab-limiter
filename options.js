import { getBrowser, getConfig, getOptions } from './utils.js';

function matchesDomain(url, domain) {
  try {
    const u = new URL(url);
    return u.hostname === domain || u.hostname.endsWith('.' + domain);
  } catch {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await getConfig();
  const userOptions = await getOptions();

  const list = document.querySelector('#entriesList');
  const closeNewTabsToggle = document.querySelector('#closeNewTabs');
  closeNewTabsToggle.checked = userOptions.closeNewTabsToggle;
  // list.innerHTML = '';

  for (let index = 0; index < config.entries.length; index++) {
    const entry = config.entries[index];
    const li = document.createElement('li');

    // Get the number of currently open tabs for this domain
    const openTabs = await chrome.tabs.query({});
    console.log("no of total openTabs :", openTabs)
    const domainTabCount = openTabs.filter(tab => matchesDomain(tab.url, entry.domain)).length;
    console.log("no of domainTabCount :", domainTabCount)
    // li.textContent = `${entry.domain} - ${entry.number} - Open: ${domainTabCount}`;
    // li.appendChild(getRemoveButton(li, config, index));
    // list.appendChild(li);

    li.style.display = 'flex';
    li.style.padding = '5px 0';
    li.style.borderBottom = '1px solid #eee';

    const domainSpan = document.createElement('span');
    domainSpan.style.flex = '2';
    domainSpan.textContent = entry.domain;

    const allowedSpan = document.createElement('span');
    allowedSpan.style.flex = '1';
    allowedSpan.style.textAlign = 'center';
    allowedSpan.textContent = entry.number;

    const openSpan = document.createElement('span');
    openSpan.style.flex = '1';
    openSpan.style.textAlign = 'center';
    openSpan.textContent = domainTabCount;

    li.appendChild(domainSpan);
    li.appendChild(allowedSpan);
    li.appendChild(openSpan);
    li.appendChild(getRemoveButton(li, config, index));
    list.appendChild(li);
  };
});

// Add new domain-number entry
document.querySelector('#addEntryBtn').addEventListener('click', async () => {
  const domain = document.querySelector('#domain').value.trim();
  const number = parseInt(document.querySelector('#number').value, 10);

  if (!domain || isNaN(number) || number < 1) {
    alert('Enter a valid domain and max tab number (>=1).');
    return;
  }

  const config = await getConfig();
  config.entries.push({ domain, number });

  await getBrowser().storage.local.set({ userConfig: config });

  document.querySelector('#domain').value = '';
  document.querySelector('#number').value = '';

  // Add the new entry with animation
  const list = document.querySelector('#entriesList');

  const li = document.createElement('li');
  li.textContent = `${domain} - ${number}`;

  li.appendChild(getRemoveButton(li, config, config.entries.length - 1));

  // Arcade pop animation
  li.classList.add('new-entry');
  li.addEventListener('animationend', () => li.classList.remove('new-entry'));

  list.appendChild(li);
});

function getRemoveButton(element, config, index) {
  // accept index
  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    config.entries.splice(index, 1);
    await getBrowser().storage.local.set({ userConfig: config });

    element.classList.add('undertale-death');

    setTimeout(() => {
      element.remove();
    }, 250);
  });
  return removeBtn;
}

document
  .querySelector('#closeNewTabs')
  .addEventListener('change', async (event) => {
    const userOptions = await getOptions();

    userOptions.closeNewTabsToggle = event.target.checked;

    await getBrowser().storage.local.set({ userOptions: userOptions });
  });


// Load saved option and set radio selection
async function loadTabCloseOption() {
  const userOptions = await getOptions();
  const closeOption = userOptions.closeNewTabsToggle ? 'new' : 'old';

  if (closeOption === 'new') {
    document.querySelector('#closeNewTabs').checked = true;
  } else {
    document.querySelector('#closeOldTabs').checked = true;
  }
}

// Listen for change on both radio buttons
document.querySelectorAll('input[name="tabCloseOption"]').forEach((radio) => {
  radio.addEventListener('change', async (event) => {
    const userOptions = await getOptions();

    userOptions.closeNewTabsToggle = event.target.value === 'new';

    await getBrowser().storage.local.set({ userOptions });
  });
});

// Initialize on page load
loadTabCloseOption();
