/*
path: src/configurator/configuratorEngine.js
purpose: Core logic for the product configurator. It translates the application state (product choices) into the next logical question or final product display, and manages the associated UI rendering.
*/
console.log(JSON.stringify({
    level: 'INFO',
    source: 'configuratorEngine.js',
    context: { process: 'INIT' },
    step: 'start',
    message: 'Configurator Engine script initialization.'
}));

import * as appState from '../state/appState.js';

try {
    const startTime = performance.now();
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'configuratorEngine.js',
        context: { process: 'INIT', function: 'import' },
        step: 'start',
        message: "Attempting to import product data from './productCatalog.js'"
    }));
    var { PRODUCT_CATALOG, BASE_PRODUCT_URL } = await import('./productCatalog.js');
    const endTime = performance.now();
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'configuratorEngine.js',
        context: { process: 'INIT', function: 'import' },
        step: 'end',
        message: "Successfully loaded product catalog.",
        payload: {
            loadTimeMs: (endTime - startTime).toFixed(2),
            productCount: PRODUCT_CATALOG.length
        }
    }));
} catch (error) {
    console.log(JSON.stringify({
        level: 'FATAL',
        source: 'configuratorEngine.js',
        context: { process: 'INIT', function: 'import' },
        step: 'fail',
        message: "Failed to import product catalog. Engine cannot function.",
        payload: { error: error.message, stack: error.stack }
    }));
}

// ===============================================
// MODULE STATE
// ===============================================
let eventEmitter = null;
console.log(JSON.stringify({
    level: 'DEBUG',
    source: 'configuratorEngine.js',
    context: { process: 'INIT' },
    step: 'process',
    message: 'Module state initialized.',
    payload: { eventEmitter: 'null' }
}));

// ===============================================
// FACET & ENGINE DEFINITIONS
// ===============================================
const FACET_ORDER = ['categoria', 'sistema', 'persiana', 'motorizada', 'material', 'folhas'];

const FACET_DEFINITIONS = {
    categoria: { title: 'O que você procura?', labelMap: { janela: 'Janela', porta: 'Porta' } },
    sistema: { title: 'Qual sistema de abertura você prefere?', labelMap: { 'janela-correr': 'Correr (Janela)', 'porta-correr': 'Correr (Porta)', 'maxim-ar': 'Maxim-ar', 'giro': 'Giro' } },
    persiana: { title: 'Precisa de persiana integrada?', labelMap: { sim: 'Sim', nao: 'Não' } },
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
    console.log(JSON.stringify({
        level: 'DEBUG', // Using DEBUG as this is high-frequency
        source: 'configuratorEngine.js',
        context: { function: 'getProductField' },
        step: 'process',
        message: `Mapping UI facet '${uiFacet}' to product field '${productField}'.`
    }));
    return product[productField];
}

function calculateNextSelections(currentSelections, facet, value) {
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'calculateNextSelections' },
        step: 'start',
        message: 'Calculating next selection state.',
        payload: { currentSelections, facet, value }
    }));

    const idx = FACET_ORDER.indexOf(facet);
    const next = { ...currentSelections, [facet]: value };
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'calculateNextSelections' },
        step: 'process',
        message: `Resetting all subsequent facets after index ${idx}.`,
        payload: { changedFacet: facet }
    }));
    for (let i = idx + 1; i < FACET_ORDER.length; i++) {
        next[FACET_ORDER[i]] = null;
    }
    if (next.persiana !== 'sim') {
        next.motorizada = null;
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'configuratorEngine.js',
            context: { function: 'calculateNextSelections' },
            step: 'process',
            message: 'Resetting "motorizada" as "persiana" is not "sim".'
        }));
    }

    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'calculateNextSelections' },
        step: 'end',
        message: 'Calculation complete.',
        payload: { nextState: next }
    }));
    return next;
}

function applyFilters(selections, catalog) {
    const initialCount = catalog.length;
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'applyFilters' },
        step: 'start',
        message: 'Applying filters to product catalog.',
        payload: { selections, initialCount }
    }));

    const filteredProducts = catalog.filter((p) => {
        for (const facet of FACET_ORDER) {
            const sel = selections[facet];
            if (sel == null) continue;
            // Skip motorizada check if persiana is not 'sim'
            if (facet === 'motorizada' && selections.persiana !== 'sim') continue;

            const val = getProductField(p, facet);

            // If the product doesn't have the attribute, or the attribute value doesn't match the selection
            if (val == null || String(val) !== String(sel)) {
                return false;
            }
        }
        return true;
    });

    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'applyFilters' },
        step: 'end',
        message: 'Product catalog filtered.',
        payload: { initialCount, finalCount: filteredProducts.length, selections }
    }));
    return filteredProducts;
}

function getUniqueOptions(attribute, products) {
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'getUniqueOptions' },
        step: 'start',
        message: 'Getting unique options.',
        payload: { attribute, productCount: products.length }
    }));

    const set = new Set();
    for (const p of products) {
        const v = getProductField(p, attribute);
        if (v !== null && v !== undefined) set.add(v);
    }
    const arr = Array.from(set);
    if (attribute === 'folhas') {
        const sortedArr = arr.map(Number).sort((a, b) => a - b);
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'configuratorEngine.js',
            context: { function: 'getUniqueOptions' },
            step: 'end',
            message: 'Unique options calculated (numeric sort).',
            payload: { attribute, options: sortedArr }
        }));
        return sortedArr;
    }
    
    const sortedArr = arr.map(String).sort();
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'getUniqueOptions' },
        step: 'end',
        message: 'Unique options calculated (string sort).',
        payload: { attribute, options: sortedArr }
    }));
    return sortedArr;
}

function runFacetLoop(selections) {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'configuratorEngine.js',
        context: { function: 'runFacetLoop', process: 'CONFIG_ENGINE_CORE' },
        step: 'start',
        message: 'Starting facet determination loop.',
        payload: { selections }
    }));

    let workingSelections = { ...selections };
    let filtered = applyFilters(workingSelections, PRODUCT_CATALOG);
    const productSlugs = filtered.map(p => p.slug);

    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'runFacetLoop' },
        step: 'process',
        message: 'Initial filter result.',
        payload: {
            'filtered-products-initial': {
                count: filtered.length,
                slugs: productSlugs.slice(0, 5), // Log only a few slugs
                selections: workingSelections
            }
        }
    }));

    for (const facet of FACET_ORDER) {
        // Skip motorizada if persiana is not 'sim'
        if (facet === 'motorizada' && workingSelections.persiana !== 'sim') continue;

        // If the facet is already selected, move to the next
        if (workingSelections[facet] !== null) continue;

        // Apply filters *before* checking options for the current facet
        let currentFiltered = applyFilters(workingSelections, PRODUCT_CATALOG);

        if (currentFiltered.length === 0) {
            console.log(JSON.stringify({
                level: 'WARN',
                source: 'configuratorEngine.js',
                context: { function: 'runFacetLoop' },
                step: 'warn',
                message: 'No products found after filtering. Halting loop.',
                payload: { selections: workingSelections }
            }));
            return { selections: workingSelections, finalProduct: false, finalProducts: [], currentQuestion: null };
        }

        if (currentFiltered.length === 1) {
            console.log(JSON.stringify({
                level: 'INFO',
                source: 'configuratorEngine.js',
                context: { function: 'runFacetLoop' },
                step: 'end',
                message: 'Only one product remains. Configuration complete.',
                payload: { finalSlug: currentFiltered[0].slug, selections: workingSelections }
            }));
            return { selections: workingSelections, finalProduct: true, finalProducts: currentFiltered, currentQuestion: null };
        }

        const options = getUniqueOptions(facet, currentFiltered);

        if (options.length > 1) {
            const def = FACET_DEFINITIONS[facet];
            console.log(JSON.stringify({
                level: 'INFO',
                source: 'configuratorEngine.js',
                context: { function: 'runFacetLoop' },
                step: 'end',
                message: 'Next question identified.',
                payload: { attribute: facet, optionsCount: options.length, selections: workingSelections }
            }));
            return { selections: workingSelections, finalProduct: false, finalProducts: currentFiltered, currentQuestion: { attribute: facet, title: def.title, options } };
        }

        if (options.length === 1) {
            // Auto-select the only available option and continue the loop
            const autoSelectedValue = options[0];
            workingSelections[facet] = autoSelectedValue;
            console.log(JSON.stringify({
                level: 'DEBUG',
                source: 'configuratorEngine.js',
                context: { function: 'runFacetLoop' },
                step: 'process',
                message: `Auto-selecting single option for facet: ${facet}`,
                payload: { value: autoSelectedValue, workingSelections }
            }));
        } else if (options.length === 0) {
            console.log(JSON.stringify({
                level: 'WARN',
                source: 'configuratorEngine.js',
                context: { function: 'runFacetLoop' },
                step: 'warn',
                message: `Facet ${facet} has 0 options for remaining products. Configuration may be stuck.`,
                payload: { selections: workingSelections }
            }));
        }
    }

    filtered = applyFilters(workingSelections, PRODUCT_CATALOG);
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'configuratorEngine.js',
        context: { function: 'runFacetLoop' },
        step: 'end',
        message: 'Loop completed without finding a new question.',
        payload: { finalProductCount: filtered.length, finalSelections: workingSelections }
    }));
    return { selections: workingSelections, finalProduct: filtered.length > 0, finalProducts: filtered, currentQuestion: null };
}

// ===============================================
// RENDERING FUNCTIONS
// ===============================================

function createOptionCard(label, facet, value, imageUrl) {
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'createOptionCard', process: 'UI_RENDER' },
        step: 'process',
        message: 'Creating option card DOM element.',
        payload: { label, facet, value }
    }));
    const card = document.createElement('article');
    card.className = 'option-card rounded-lg shadow-sm cursor-pointer transform hover:-translate-y-1 active:scale-95';
    card.innerHTML = `<div class="image-wrapper"><img src="${imageUrl}" alt="${label}"></div><div class="card-text-container"><h3 class="option-card-title">${label}</h3></div>`;
    card.addEventListener('click', () => window.ConfigEngine.applySelection(facet, value));
    return card;
}

function createProductCard(product) {
    if (!product) return document.createElement('div');
    const productName = product.slug.split('/').pop().replace('.php', '').replace(/-/g, ' ');
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'createProductCard', process: 'UI_RENDER' },
        step: 'process',
        message: 'Creating final product card DOM element.',
        payload: { productName, slug: product.slug }
    }));
    const card = document.createElement('article');
    card.className = 'product-card rounded-lg shadow-sm';
    const productLink = `${BASE_PRODUCT_URL}${product.slug}`;
    card.innerHTML = `<div class="image-wrapper"><img src="${product.image}" alt="${productName}" /></div><div class="card-text-container"><h3 class="product-card-title"><a href="${productLink}" target="_blank" class="hover:underline">${productName}</a></h3><p class="product-card-price">Preço sob consulta</p></div>`;
    return card;
}

function renderEngineState(state) {
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'renderEngineState', process: 'UI_RENDER' },
        step: 'start',
        message: 'Rendering engine state to DOM.',
        payload: {
            isFinal: state.finalProduct,
            question: state.currentQuestion?.title,
            productCount: state.finalProducts.length
        }
    }));
    const questionEl = document.getElementById('facet-question');
    const gridEl = document.getElementById('option-grid');
    if (!questionEl || !gridEl) {
        console.log(JSON.stringify({
            level: 'ERROR',
            source: 'configuratorEngine.js',
            context: { function: 'renderEngineState' },
            step: 'fail',
            message: 'CRITICAL: Could not find required DOM elements (#facet-question or #option-grid). UI render aborted.',
        }));
        return;
    }

    questionEl.innerHTML = '';
    gridEl.innerHTML = '';

    if (state.finalProduct && state.finalProducts.length > 0) {
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'renderEngineState' },
            step: 'process',
            message: 'Rendering final product result(s).',
            payload: { count: state.finalProducts.length }
        }));
        questionEl.textContent = state.finalProducts.length === 1 ? 'Produto final determinado:' : 'Produtos correspondentes:';
        state.finalProducts.forEach(product => gridEl.appendChild(createProductCard(product)));

    } else if (state.currentQuestion) {
        const { attribute, title, options } = state.currentQuestion;
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'renderEngineState' },
            step: 'process',
            message: `Rendering question for facet: ${attribute}.`,
            payload: { title, optionsCount: options.length }
        }));
        questionEl.textContent = title;

        // --- Event Emission to Chat UI ---
        if (eventEmitter && eventEmitter.emit) {
            console.log(JSON.stringify({
                level: 'DEBUG',
                source: 'configuratorEngine.js',
                context: { function: 'renderEngineState', process: 'EVENT_EMIT' },
                step: 'process',
                message: "Emitting 'facetQuestionUpdated' event to inform chat UI.",
                payload: { event: 'facetQuestionUpdated', questionTitle: title }
            }));
            eventEmitter.emit('facetQuestionUpdated', title);
        } else {
            console.log(JSON.stringify({
                level: 'WARN',
                source: 'configuratorEngine.js',
                context: { function: 'renderEngineState', process: 'EVENT_EMIT' },
                step: 'warn',
                message: "Event emitter is null. Skipping 'facetQuestionUpdated' emission.",
            }));
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
        const message = state.finalProducts && state.finalProducts.length === 0 ? 'Nenhum produto encontrado para os filtros atuais.' : 'Refine sua seleção para continuar.';
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'renderEngineState' },
            step: 'process',
            message: 'No question and no final product (potentially zero products found).',
            payload: { message }
        }));
        questionEl.textContent = message;
    }
}

// ===============================================
// PUBLIC API & INITIALIZATION
// ===============================================

function renderLatestState() {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'configuratorEngine.js',
        context: { function: 'renderLatestState', process: 'UI_RENDER' },
        step: 'start',
        message: 'SUBSCRIBER TRIGGERED: State has changed or initial render call. Re-rendering UI.',
    }));
    const currentSelections = appState.getState().productChoice;

    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'renderLatestState' },
        step: 'process',
        message: 'Current selections read from appState.',
        payload: { 'product-choice': currentSelections }
    }));

    const engineState = runFacetLoop(currentSelections);

    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'configuratorEngine.js',
        context: { function: 'renderLatestState' },
        step: 'process',
        message: 'Facet loop computation finished.',
        payload: { engineState } // Log the entire resulting state
    }));

    renderEngineState(engineState);
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'configuratorEngine.js',
        context: { function: 'renderLatestState', process: 'UI_RENDER' },
        step: 'end',
        message: 'UI rendering complete.'
    }));
}

window.ConfigEngine = {
    FACET_ORDER,
    FACET_DEFINITIONS,

    init: (emitter) => {
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.init', process: 'INIT' },
            step: 'start',
            message: 'Initializing ConfigEngine.',
            payload: { emitter: (emitter ? 'defined' : 'null') }
        }));
        eventEmitter = emitter;
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.init' },
            step: 'end',
            message: 'Event emitter set successfully.',
        }));

        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                console.log(JSON.stringify({
                    level: 'INFO',
                    source: 'configuratorEngine.js',
                    context: { function: 'restartButton.onClick', process: 'STATE_UPDATE' },
                    step: 'start',
                    message: 'User clicked the restart button.'
                }));
                appState.resetProductChoice();
            });
        }
    },

    applySelection: (facet, value) => {
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.applySelection', process: 'STATE_UPDATE' },
            step: 'start',
            message: 'User initiated a manual selection.',
            payload: { selectedFacet: facet, selectedValue: value }
        }));

        const currentSelections = appState.getState().productChoice;
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.applySelection' },
            step: 'process',
            message: 'Reading current state from appState.',
            payload: { currentSelections }
        }));

        const nextSelections = calculateNextSelections(currentSelections, facet, value);
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.applySelection' },
            step: 'process',
            message: 'Calculated next state.',
            payload: { nextSelections }
        }));

        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.applySelection' },
            step: 'process',
            message: 'Dispatching \'updateProductChoice\' to appState to persist and notify.',
            payload: { stateToDispatch: nextSelections }
        }));

        appState.updateProductChoice(nextSelections).then(() => {
            console.log(JSON.stringify({
                level: 'INFO',
                source: 'configuratorEngine.js',
                context: { function: 'ConfigEngine.applySelection', process: 'STATE_UPDATE' },
                step: 'end',
                message: 'Product choice update completed (state persisted and subscribers notified).',
            }));
        });
    },

    recompute: () => {
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'configuratorEngine.js',
            context: { function: 'ConfigEngine.recompute', process: 'UI_RENDER' },
            step: 'start',
            message: 'Manual recompute triggered.',
        }));
        renderLatestState();
    }
};

console.log(JSON.stringify({
    level: 'INFO',
    source: 'configuratorEngine.js',
    context: { process: 'INIT' },
    step: 'process',
    message: 'Subscribing renderLatestState function to appState changes.',
}));
appState.subscribe(renderLatestState);

console.log(JSON.stringify({
    level: 'INFO',
    source: 'configuratorEngine.js',
    context: { process: 'INIT' },
    step: 'process',
    message: 'Initial render call to bootstrap UI.',
}));
renderLatestState();