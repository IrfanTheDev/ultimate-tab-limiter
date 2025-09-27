document.addEventListener('click', async (e) => {

    console.log("from content : click intercepted")
    const link = e.target.closest('a');
    if (!link) return;

    // Only intercept links that would open in new tab
    const newTab = link.target === "_blank" || e.ctrlKey || e.metaKey;
    if (!newTab) return;

    e.preventDefault(); // stop new tab from opening

    // Ask background how many tabs exist for this domain
    const response = await chrome.runtime.sendMessage({
        type: "checkTabLimit",
        domain: new URL(link.href).hostname
    });
    console.log("form content- response -: ", response)
    if (response.limitReached) {
        // Show modal in current page
        if (!document.getElementById('tab-limiter-modal')) {
            const modal = document.createElement('div');
            modal.id = 'tab-limiter-modal';
            modal.style = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.5); display:flex;
        align-items:center; justify-content:center; z-index:999999;
      `;
            modal.innerHTML = `
        <div style="background:white;padding:20px;border-radius:8px;text-align:center;max-width:400px;">
          <h2>Tab Limit Reached</h2>
          <p>You have reached the tab limit for ${response.domain}.</p>
          <button id="tab-limiter-close-btn">OK</button>
        </div>
      `;
            document.body.appendChild(modal);
            document.getElementById('tab-limiter-close-btn').onclick = () => modal.remove();
        }
    } else {
        // Open the tab normally
        window.open(link.href, "_blank");
    }
});
