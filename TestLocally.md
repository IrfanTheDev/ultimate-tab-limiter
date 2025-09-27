Step 2: Load the extension locally
Chrome / Edge

Open chrome://extensions/ (or edge://extensions/).

Enable Developer mode (toggle in top-right).

Click “Load unpacked”.

Select your tab-limiter/ folder.

Your extension will now appear in the toolbar.

Firefox

Open about:debugging#/runtime/this-firefox.

Click “Load Temporary Add-on”.

Select your manifest.json.

🔹 Step 3: Test and debug

Open some tabs → extension should auto-close after limit.

Use background console logs:

Chrome: chrome://extensions/ → “Service Worker” link under your extension.

Firefox: about:debugging → Inspect.

🔹 Step 4: Iterate

Change code, then click Refresh/Reload on the extension page.

Keep manifest and background logic small, move complex settings to popup/options page.



    "default_popup": "options.html"