(() => {
  if (customElements.get('arsenal-panel-models')) return;

  class ArsenalPanelModels extends HTMLElement {
    connectedCallback() {
      const comparison = this.querySelector('.apf-comparison');
      const tabList = comparison.querySelector('[role="tablist"]');
      const tabs = [...tabList.querySelectorAll('[role="tab"]')];
      const slides = tabs.map(tab => this.querySelector('#' + tab.getAttribute('aria-controls')));
      const modelIndex = hash => slides.findIndex(slide => '#' + slide.id === hash);
      this.listeners = new AbortController();
      const options = {signal: this.listeners.signal};

      function selectModel(index) {
        tabs.forEach((tab, position) => {
          const active = position === index;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          slides[position].setAttribute('aria-hidden', String(!active));
          slides[position].tabIndex = active ? 0 : -1;
        });
      }

      function selectFromTab(index) {
        selectModel(index);
        if (modelIndex(location.hash) >= 0) {
          history.replaceState(history.state, '', '#' + slides[index].id);
        }
      }

      slides.forEach((slide, index) => {
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-labelledby', tabs[index].id);
      });
      selectModel(Math.max(0, modelIndex(location.hash)));
      comparison.dataset.enhanced = '';
      tabList.hidden = false;

      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectFromTab(index), options);
        tab.addEventListener('keydown', event => {
          const destinations = {
            ArrowLeft: (index + tabs.length - 1) % tabs.length,
            ArrowRight: (index + 1) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
          };
          if (!Object.hasOwn(destinations, event.key)) return;
          event.preventDefault();
          const next = destinations[event.key];
          selectFromTab(next);
          tabs[next].focus();
        }, options);
      });

      this.querySelectorAll('.apf-cards .apf-model-link').forEach(link => {
        link.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const hash = link.getAttribute('href');
          const index = modelIndex(hash);
          if (index < 0) return;
          event.preventDefault();
          selectModel(index);
          if (location.hash !== hash) history.pushState(history.state, '', hash);
          tabs[index].focus({preventScroll: true});
          comparison.scrollIntoView({block: 'start'});
        }, options);
      });

      window.addEventListener('hashchange', () => {
        selectModel(Math.max(0, modelIndex(location.hash)));
      }, options);
    }

    disconnectedCallback() {
      this.listeners?.abort();
    }
  }

  customElements.define('arsenal-panel-models', ArsenalPanelModels);
})();