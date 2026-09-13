// Opening a tab for a URL that isn't known yet (it comes back from a Server
// Action). The tab has to be created synchronously inside the click handler,
// before any await -- open it after the await and the popup blocker kills it,
// because the user-gesture window has closed by then.
//
// Usage:
//   const tab = openBlankTab();
//   const { url, error } = await someServerAction();
//   if (url) showUrlInTab(tab, url); else closeTab(tab);
//
// IMPORTANT: do not pass "noopener" to window.open() here. Per the HTML spec
// that makes window.open() return null on purpose, which destroys the handle
// needed to navigate the tab once the URL arrives -- every resume "view"
// button did exactly that and so always fell through to its error branch.
// showUrlInTab drops the opener reference manually instead, which gives the
// same protection without losing the handle.

export function openBlankTab(): Window | null {
    return window.open("about:blank", "_blank");
}

export function showUrlInTab(tab: Window | null, url: string): void {
    if (tab && !tab.closed) {
        try {
            // Equivalent to what "noopener" would have done, applied after the
            // fact while the placeholder tab is still same-origin.
            tab.opener = null;
        } catch {
            // Already cross-origin; nothing to drop.
        }
        tab.location.href = url;
        return;
    }

    // The popup was blocked (or the placeholder was closed). Navigating the
    // current tab is not subject to the popup blocker, so do that rather than
    // showing an error the user has no way to act on.
    window.location.href = url;
}

export function closeTab(tab: Window | null): void {
    if (tab && !tab.closed) tab.close();
}
