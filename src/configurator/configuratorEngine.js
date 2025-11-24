
/*
path: src/configurator/configuratorEngine.js
purpose: Core logic for the product configurator. It translates the application state (product choices) into the next logical question or final product display, and manages the associated UI rendering.
*/
import * as appState from '../state/appState.js';

let PRODUCT_CATALOG = [];
let BASE_PRODUCT_URL = '';

try {
    const imported = await import('./productCatalog.js');
    PRODUCT_CATALOG = imported.PRODUCT_CATALOG;
    BASE_PRODUCT_URL = imported.BASE_PRODUCT_URL;
} catch (error) {
    console.error("Failed to import product catalog. Engine cannot function.", error);
}

// ===============================================
// MODULE STATE
// ===============================================
let eventEmitter = null;
let dom = {};

// ===============================================
// FACET & ENGINE DEFINITIONS
// ===============================================
const FACET_ORDER = ['categoria', 'sistema', 'persiana', 'motorizada', 'material', 'folhas'];

const FACET_DEFINITIONS = {
    categoria: { title: 'O que você procura?', labelMap: { janela: 'Janela', porta: 'Porta' } },
    sistema: { title: 'Qual sistema de abertura você prefere?', labelMap: { 'janela-correr': 'de Correr', 'porta-correr': 'de Correr', 'maxim-ar': 'Maxim-ar', 'giro': 'de Giro' } },
    persiana: { title: 'Precisa de persiana integrada?', labelMap: { sim: 'Persiana Integrada', nao: 'Não' } },
    motorizada: { title: 'Persiana motorizada ou manual?', labelMap: { motorizada: 'Motorizada', manual: 'Manual' } },
    material: { title: 'Qual material de preenchimento?', labelMap: { 'vidro': 'Vidro', 'vidro + veneziana': 'Vidro e Veneziana', 'lambri': 'Lambri', 'veneziana': 'Veneziana', 'vidro + lambri': 'Vidro e Lambri' } },
    folhas: { title: 'Quantas folhas?', labelMap: { 1: '1 Folha', 2: '2 Folhas', 3: '3 Folhas', 4: '4 Folhas', 6: '6 Folhas' } }
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
    const productField = FIELD_MAP[uiFacet];
    return product[productField];
}

function calculateNextSelections(currentSelections, facet, value) {
    const idx = FACET_ORDER.indexOf(facet);
    const next = { ...currentSelections, [facet]: value };
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
            if (val == null || String(val) !== String(sel)) {
                return false;
            }
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
    if (attribute === 'folhas') {
        return arr.map(Number).sort((a, b) => a - b);
    }
    return arr.map(String).sort();
}

function runFacetLoop(selections) {
    let workingSelections = { ...selections };
    
    for (const facet of FACET_ORDER) {
        if (facet === 'motorizada' && workingSelections.persiana !== 'sim') continue;
        if (workingSelections[facet] !== null) continue;

        let currentFiltered = applyFilters(workingSelections, PRODUCT_CATALOG);

        if (currentFiltered.length <= 1) {
            return { selections: workingSelections, finalProduct: true, finalProducts: currentFiltered, currentQuestion: null };
        }

        const options = getUniqueOptions(facet, currentFiltered);

        if (options.length > 1) {
            const def = FACET_DEFINITIONS[facet];
            return { selections: workingSelections, finalProduct: false, finalProducts: currentFiltered, currentQuestion: { attribute: facet, title: def.title, options } };
        }

        if (options.length === 1) {
            workingSelections[facet] = options[0];
        } else if (options.length === 0) {
             console.warn(`Facet ${facet} has 0 options for remaining products. Configuration may be stuck.`, { selections: workingSelections });
        }
    }

    const finalFiltered = applyFilters(workingSelections, PRODUCT_CATALOG);
    return { selections: workingSelections, finalProduct: true, finalProducts: finalFiltered, currentQuestion: null };
}


// ===============================================
// RENDERING FUNCTIONS
// ===============================================

function createOptionCard(label, facet, value, imageUrl) {
    const card = document.createElement('article');
    card.className = 'option-card rounded-lg shadow-sm cursor-pointer transform hover:-translate-y-1 active:scale-95';
    card.innerHTML = `<div class="image-wrapper"><img src="${imageUrl}" alt="${label}"></div><div class="card-text-container"><h3 class="option-card-title">${label}</h3></div>`;
    card.addEventListener('click', () => window.ConfigEngine.applySelection(facet, value));
    return card;
}

function createProductCard(product) {
    if (!product) return document.createElement('div');

    const selections = appState.getState().productChoice;
    const card = document.createElement('article');
    card.className = 'product-card rounded-lg shadow-sm';
    const productLink = `${BASE_PRODUCT_URL}${product.slug}`;

    // --- DYNAMIC TITLE AND CHIPS ---
    const categoriaLabel = FACET_DEFINITIONS.categoria.labelMap[selections.categoria] || '';
    const sistemaLabel = FACET_DEFINITIONS.sistema.labelMap[selections.sistema] || '';
    const h2Title = `${categoriaLabel} ${sistemaLabel}`.trim();

    const chips = [];
    if (selections.persiana === 'sim') {
        chips.push(FACET_DEFINITIONS.persiana.labelMap.sim);
        if (selections.motorizada) {
            chips.push(FACET_DEFINITIONS.motorizada.labelMap[selections.motorizada]);
        }
    }
    if (selections.material) {
        chips.push(FACET_DEFINITIONS.material.labelMap[selections.material]);
    }
    if (selections.folhas) {
        chips.push(FACET_DEFINITIONS.folhas.labelMap[selections.folhas]);
    }

    const chipHTML = chips.map(chip => `<span class="chip">${chip}</span>`).join('');

    // --- CARD CONTENT ---
    const cardContent = document.createElement('div');
    card.appendChild(cardContent);

    cardContent.innerHTML = `
        <div class="image-wrapper"><img src="${product.image}" alt="${h2Title}" /></div>
        <div class="product-card-controls">
            <h2 class="product-card-main-title">${h2Title}</h2>
            <div class="product-card-chip-container">${chipHTML}</div>
            <div class="product-card-buttons">
                <a href="${productLink}" target="_blank" class="product-card-button btn-view-product">Ver Produto</a>
                <button class="product-card-button btn-specialist">Falar com Especialista</button>
            </div>
        </div>
    `;

    // --- EVENT LISTENERS ---
    const specialistButton = cardContent.querySelector('.btn-specialist');
    specialistButton.addEventListener('click', () => {
        appState.updateUserData({ talkToHuman: true });
        if (window.innerWidth <= 768) {
            document.body.setAttribute('data-active-tab', 'chat');
        }
    });

    return card;
}

function renderEngineState(state) {
    const questionEl = dom.facetQuestion;
    const gridEl = dom.optionGrid;

    if (!questionEl || !gridEl) {
        console.error('CRITICAL: Could not find required DOM elements (#facet-question or #option-grid). UI render aborted.');
        return;
    }

    questionEl.innerHTML = '';
    gridEl.innerHTML = '';

    // Reset grid classes to default
    gridEl.className = 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2';

    if (state.finalProduct && state.finalProducts.length > 0) {
        questionEl.textContent = state.finalProducts.length === 1 ? 'Produto final determinado:' : 'Produtos correspondentes:';
        gridEl.className = 'grid grid-cols-1 gap-2'; // Change to single column for final product
        state.finalProducts.forEach(product => gridEl.appendChild(createProductCard(product)));
    } else if (state.currentQuestion) {
        const { attribute, title, options } = state.currentQuestion;
        questionEl.textContent = title;

        if (eventEmitter && eventEmitter.emit) {
            eventEmitter.emit('facetQuestionUpdated', title);
        } else {
             console.warn("Event emitter is null. Skipping 'facetQuestionUpdated' emission.");
        }

        const def = FACET_DEFINITIONS[attribute] || { labelMap: {} };
        const possibleProducts = state.finalProducts || [];

        for (const optionValue of options) {
            const label = def.labelMap[optionValue] || optionValue.toString();
            const representativeProduct = possibleProducts.find(p => String(getProductField(p, attribute)) === String(optionValue));
            const imageUrl = representativeProduct ? representativeProduct.image : 'https://placehold.co/400x300/E2E8F0/333?text=Opção';
            gridEl.appendChild(createOptionCard(label, attribute, optionValue, imageUrl));
        }
    } else {
        questionEl.textContent = 'Nenhum produto encontrado para os filtros atuais.';
    }
}

// ===============================================
// PUBLIC API & INITIALIZATION
// ===============================================

function renderLatestState() {
    const currentSelections = appState.getState().productChoice;
    const engineState = runFacetLoop(currentSelections);
    renderEngineState(engineState);
}

window.ConfigEngine = {
    init: (emitter, domCache) => {
        eventEmitter = emitter;
        dom = domCache;
        if (dom.restartButton) {
            dom.restartButton.addEventListener('click', () => {
                appState.resetProductChoice();
            });
        }
    },
    applySelection: (facet, value) => {
        const currentSelections = appState.getState().productChoice;
        const nextSelections = calculateNextSelections(currentSelections, facet, value);
        appState.updateProductChoice(nextSelections);
    },
    render: renderLatestState // Expose the render function
};

appState.subscribe(renderLatestState);
