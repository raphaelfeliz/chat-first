
/*
path: src/utils/domCache.js
purpose: Caches frequently accessed DOM elements to avoid redundant queries.
*/

const domCache = {
  // Primary containers
  configuratorSection: document.getElementById('configurator-section'),
  chatSection: document.getElementById('chat-section'),
  
  // Configurator elements
  facetQuestion: document.getElementById('facet-question'),
  optionGrid: document.getElementById('option-grid'),
  restartButton: document.getElementById('restart-button'),
  
  // Chat elements
  bubbleArea: document.getElementById('bubble-area'),
  inputArea: document.getElementById('input-area'),
  chatInput: document.getElementById('chat-input'),
  
  // Mobile navigation
  mobileNav: document.getElementById('mobile-nav'),
  tabConfigurator: document.getElementById('tab-configurator'),
  tabChat: document.getElementById('tab-chat'),
};

export default domCache;
