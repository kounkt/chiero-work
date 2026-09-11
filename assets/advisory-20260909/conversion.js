/* Progressive enhancement: all examples and disclosures work without JavaScript. */
(() => {
  const picker = document.querySelector('[data-topic-picker]');
  if (picker) {
    const tabs = [...picker.querySelectorAll('[data-topic]')];
    const tablist = picker.querySelector('.topic-tabs');
    const panels = tabs.map(tab => document.getElementById(`topic-${tab.dataset.topic}`));
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    };
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'いま相談したいテーマ');
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', tab.id);
      panels[i].tabIndex = 0;
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', event => {
        let index;
        if (event.key === 'ArrowRight') index = (i + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') index = (i + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = tabs.length - 1;
        else return;
        event.preventDefault();
        select(index, true);
      });
    });
    select(0);
    tablist.hidden = false;
  }

  // Keep old shared URLs useful when their target now lives inside a disclosure.
  const revealHash = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    let changed = false;
    let parent = target.parentElement;
    while (parent) {
      if (parent.tagName === 'DETAILS' && !parent.open) { parent.open = true; changed = true; }
      parent = parent.parentElement;
    }
    const panel = target.closest('.topic-panel');
    if (panel?.hidden) {
      document.querySelector(`[aria-controls="${panel.id}"]`)?.click();
      changed = true;
    }
    if (changed) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  addEventListener('hashchange', revealHash);
  // Fonts and images can affect the first layout of an incoming anchor URL.
  if (document.readyState === 'complete') revealHash();
  else addEventListener('load', revealHash, { once: true });
})();
