console.log("[configuratorEngine.js] Script starting...");

try {
  const startTime = performance.now();
  console.log("[configuratorEngine.js] Attempting to import from '../../data/productCatalog.js'");
  var { PRODUCT_CATALOG, BASE_PRODUCT_URL } = await import('../../data/productCatalog.js');
  const endTime = performance.now();
  console.log(`[configuratorEngine.js] Successfully imported from '../../data/productCatalog.js' in ${(endTime - startTime).toFixed(2)}ms`);
} catch (error) {
  console.error("[configuratorEngine.js] Failed to import from '../../data/productCatalog.js'", error);
}

    /* ================================================
     * FACET & ENGINE DEFINITIONS
     * ================================================ */
    const FACET_ORDER = [
      'categoria', 'sistema', 'persiana', 'motorizada', 'material', 'folhas'
    ];

    const FACET_DEFINITIONS = {
      categoria: {
        title: 'O que você procura?',
        labelMap: { janela: 'Janela', porta: 'Porta' }
      },
      sistema: {
        title: 'Qual sistema de abertura você prefere?',
        labelMap: { 'janela-correr': 'Correr (Janela)', 'porta-correr': 'Correr (Porta)', 'maxim-ar': 'Maxim-ar', 'giro': 'Giro' }
      },
      persiana: {
        title: 'Precisa de persiana integrada?',
        labelMap: { sim: 'Sim', nao: 'Não' }
      },
      motorizada: {
        title: 'Persiana motorizada ou manual?',
        labelMap: { motorizada: 'Motorizada', manual: 'Manual' }
      },
      material: {
        title: 'Qual material de preenchimento?',
        labelMap: {
          'vidro': 'Vidro',
          'vidro + veneziana': 'Vidro e Veneziana',
          'lambri': 'Lambri',
          'veneziana': 'Veneziana',
          'vidro + lambri': 'Vidro e Lambri'
        }
      },
      folhas: {
        title: 'Quantas folhas?',
        labelMap: { 1: '1 Folha', 2: '2 Folhas', 3: '3 Folhas', 4: '4 Folhas', 6: '6 Folhas' }
      }
    };

    const FIELD_MAP = {
      categoria: 'categoria',
      sistema: 'sistema',
      persiana: 'persiana',
      motorizada: 'persianaMotorizada',
      material: 'material',
      folhas: 'folhas'
    };

    function getProductField(product, uiFacet) {
      const dbField = FIELD_MAP[uiFacet];
      return product[dbField];
    }

    let userSelections = {
      categoria: null, sistema: null, persiana: null,
      motorizada: null, material: null, folhas: null
    };
    
    let currentFacet = null;

    function applySelection(selections, facet, value) {
      const idx = FACET_ORDER.indexOf(facet);
      const next = { ...selections, [facet]: value };
      for (let i = idx + 1; i < FACET_ORDER.length; i++) {
        next[FACET_ORDER[i]] = null;
      }
      if (next.persiana !== 'sim') {
        next.motorizada = null;
      }
      return next;
    }

    function applyFilters(selections, catalog) {
      return catalog.filter((p) => {
        for (const facet of FACET_ORDER) {
          const sel = selections[facet];
          if (sel == null) continue;
          if (facet === 'motorizada' && selections.persiana !== 'sim') continue;
          const val = getProductField(p, facet);
          if (val == null) return false;
          if (String(val) !== String(sel)) return false;
        }
        return true;
      });
    }

    function getUniqueOptions(attribute, products) {
      const set = new Set();
      for (const p of products) {
        const v = getProductField(p, attribute);
        if (v !== null && v !== undefined) set.add(v);
      }
      const arr = Array.from(set);
      if (attribute === 'folhas') return arr.map(Number).sort((a, b) => a - b);
      return arr.map(String).sort((a, b) => a.localeCompare(b));
    }

    function runFacetLoop(selections, startAfterFacet) {
      console.log("[configuratorEngine.js] Running facet loop with selections:", selections);
      let workingSelections = { ...selections };
      let filtered = applyFilters(workingSelections, PRODUCT_CATALOG);
      
      let startIdx = startAfterFacet ? (FACET_ORDER.indexOf(startAfterFacet) + 1) : 0;
      if (startIdx >= FACET_ORDER.length) startIdx = 0;

      for (let i = 0; i < FACET_ORDER.length; i++) {
        const facet = FACET_ORDER[(startIdx + i) % FACET_ORDER.length];
        if (facet === 'motorizada' && workingSelections.persiana !== 'sim') continue;

        currentFacet = facet;
        filtered = applyFilters(workingSelections, PRODUCT_CATALOG);

        if (filtered.length === 1) {
          return { selections: workingSelections, currentFacet, finalProduct: true, finalProducts: filtered, currentQuestion: null };
        }

        const options = getUniqueOptions(facet, filtered);
        if (options.length > 1) {
          const def = FACET_DEFINITIONS[facet];
          return { 
            selections: workingSelections, 
            currentFacet, 
            finalProduct: false, 
            finalProducts: filtered, // Pass possible products
            currentQuestion: { attribute: facet, title: def.title, options }
          };
        }

        if (options.length === 1) {
          workingSelections = applySelection(workingSelections, facet, options[0]);
        }
      }

      filtered = applyFilters(workingSelections, PRODUCT_CATALOG);
      return { selections: workingSelections, currentFacet, finalProduct: filtered.length > 0, finalProducts: filtered, currentQuestion: null };
    }

    /* ================================================
     * RENDERING FUNCTIONS
     * ================================================ */

    function createOptionCard(label, facet, value, imageUrl) {
      console.log(`[configuratorEngine.js] Creating option card with image URL: ${imageUrl}`);
      const card = document.createElement('article');
      card.className = 'option-card rounded-lg shadow-sm cursor-pointer transform hover:-translate-y-1 active:scale-95';
      
      const img = `<img src="${imageUrl}" alt="${label}">`;
      const imageWrapper = `<div class="image-wrapper">${img}</div>`;
      const textContainer = `<div class="card-text-container"><h3 class="option-card-title">${label}</h3></div>`;

      card.innerHTML = `${imageWrapper}${textContainer}`;
      
      card.addEventListener('click', () => {
        window.ConfigEngine.applySelection(facet, value);
      });
      return card;
    }

    function createProductCard(product) {
      if (!product) return document.createElement('div');
      console.log(`[configuratorEngine.js] Creating product card with image URL: ${product.image}`);
      
      const card = document.createElement('article');
      card.className = 'product-card rounded-lg shadow-sm';
      
      const productName = product.slug.split('/').pop().replace('.php', '').replace(/-/g, ' ');
      const productLink = `${BASE_PRODUCT_URL}${product.slug}`;

      const img = `<img src="${product.image}" alt="${productName}" />`;
      const imageWrapper = `<div class="image-wrapper">${img}</div>`;
      const title = `<h3 class="product-card-title"><a href="${productLink}" target="_blank" class="hover:underline">${productName}</a></h3>`;
      const price = `<p class="product-card-price">Preço sob consulta</p>`;
      const textContainer = `<div class="card-text-container">${title}${price}</div>`;
      
      card.innerHTML = `${imageWrapper}${textContainer}`;
      return card;
    }

    function renderEngineState(state) {
      const questionEl = document.getElementById('facet-question');
      const gridEl = document.getElementById('option-grid');
      if (!questionEl || !gridEl) return;

      questionEl.innerHTML = '';
      gridEl.innerHTML = '';

      if (state.finalProduct && state.finalProducts.length > 0) {
        questionEl.textContent = state.finalProducts.length === 1 ? 'Produto final determinado:' : 'Produtos correspondentes:';
        state.finalProducts.forEach(product => {
          gridEl.appendChild(createProductCard(product));
        });
        
      } else if (state.currentQuestion) {
        const { attribute, title, options } = state.currentQuestion;
        questionEl.textContent = title;
        
        const def = FACET_DEFINITIONS[attribute] || { labelMap: {} };
        const possibleProducts = state.finalProducts || [];

        for (const optionValue of options) {
          const label = def.labelMap[optionValue] || optionValue.toString();
          
          const representativeProduct = possibleProducts.find(p => String(getProductField(p, attribute)) === String(optionValue));
          
          const imageUrl = representativeProduct 
              ? representativeProduct.image 
              : 'https://placehold.co/400x300/E2E8F0/333?text=Opção';

          const card = createOptionCard(label, attribute, optionValue, imageUrl);
          gridEl.appendChild(card);
        }
        
      } else {
        questionEl.textContent = state.finalProducts && state.finalProducts.length === 0 
            ? 'Nenhum produto encontrado para os filtros atuais.' 
            : 'Refine sua seleção para continuar.';
      }
    }

    /* ================================================
     * PUBLIC API
     * ================================================ */
    
    function recomputeAndRender() {
      const state = runFacetLoop(userSelections, currentFacet);
      userSelections = state.selections;
      renderEngineState(state);
      console.log("[configuratorEngine.js] New State:", state);
      console.log("[configuratorEngine.js] User Selections:", userSelections);
      return state;
    }

    window.ConfigEngine = {
      FACET_ORDER,
      FACET_DEFINITIONS,
      userSelections,
      get state() { return { userSelections, currentFacet }; },
      
      applySelection: (facet, value) => {
        console.log(`[configuratorEngine.js] Applying selection - Facet: ${facet}, Value: ${value}`);
        userSelections = applySelection(userSelections, facet, value);
        currentFacet = facet;
        return recomputeAndRender();
      },
      
      recompute: () => recomputeAndRender()
    };

    // Initial render
    console.log("[configuratorEngine.js] Initial render call.");
    recomputeAndRender();
