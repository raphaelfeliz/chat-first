import { PRODUCT_CATALOG, BASE_PRODUCT_URL } from './productDatabase.js';

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
      folhas: 'folhasNumber'
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
      const card = document.createElement('article');
      card.className = 'border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-blue-50 hover:shadow-md transition-all transform hover:-translate-y-1 active:scale-95 flex flex-col items-center';
      
      const img = `<img src="${imageUrl}" alt="${label}" class="mb-3 rounded-md w-full h-32 object-contain">`;
      const title = `<h3 class="font-bold text-lg text-center text-blue-700">${label}</h3>`;

      card.innerHTML = `${img}${title}`;
      
      card.addEventListener('click', () => {
        window.ConfigEngine.applySelection(facet, value);
      });
      return card;
    }

    function createProductCard(product) {
      if (!product) return document.createElement('div');
      
      const card = document.createElement('article');
      card.className = 'border rounded-lg p-4 bg-white shadow-sm';
      
      const productName = product.slug.split('/').pop().replace('.php', '').replace(/-/g, ' ');
      const productLink = `${BASE_PRODUCT_URL}${product.slug}`;

      const img = `<img src="${product.image}" alt="${productName}" class="mb-2 rounded" />`;
      const title = `<h3 class="font-bold text-lg"><a href="${productLink}" target="_blank" class="hover:underline">${productName}</a></h3>`;
      const price = `<p class="text-gray-600">Preço sob consulta</p>`;
      
      card.innerHTML = `${img}${title}${price}`;
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
      console.log("New State:", state);
      console.log("User Selections:", userSelections);
      return state;
    }

    window.ConfigEngine = {
      FACET_ORDER,
      FACET_DEFINITIONS,
      userSelections,
      get state() { return { userSelections, currentFacet }; },
      
      applySelection: (facet, value) => {
        userSelections = applySelection(userSelections, facet, value);
        currentFacet = facet;
        return recomputeAndRender();
      },
      
      recompute: () => recomputeAndRender()
    };

    // Initial render
    recomputeAndRender();
