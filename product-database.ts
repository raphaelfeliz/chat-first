/* *file-summary*
PATH: src/core/engine/productDatabase.ts

PURPOSE: Defines the Product type and exports the product catalog (our "database").

SUMMARY: Contains the Product data type, the BASE_PRODUCT_URL constant, 
         and the complete PRODUCT_CATALOG array. This file is the 
         single source of truth for all product data.

RELATES TO OTHER FILES:
- This is the "data" layer for the configurator engine.
- It is imported by `src/core/engine/configuratorEngine.ts`.

EXPORTS:
- Product (type)
- BASE_PRODUCT_URL (constant)
- PRODUCT_CATALOG (constant)
*/

// --- REFACTOR: Refined Product type for better type-safety based on new data ---
export type Product = {
    slug: string;
    image: string;
    categoria: "janela" | "porta";
    sistema: "janela-correr" | "porta-correr" | "maxim-ar" | "giro";
    persiana: "sim" | "nao";
    persianaMotorizada: "motorizada" | "manual" | null;
    material: "vidro" | "vidro + veneziana" | "lambri" | "veneziana" | "vidro + lambri";
    minLargura: number;
    maxLargura: number;
    folhasNumber: 1 | 2 | 3 | 4 | 6;
  };
  
  // The base URL for building product links
  export const BASE_PRODUCT_URL = "https://fabricadoaluminio.com.br/produto/";
  
  // The actual product catalog
  export const PRODUCT_CATALOG: Product[] = [
    { "slug": "janelasa/janela-de-correr-2-folhas-com-persiana-integrada-motorizada-30.php", "image": "/assets/images/janela_de_correr_2folhas_persiana-integrada_motorizada.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "sim", "persianaMotorizada": "motorizada", "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "janelasa/janela-de-correr-2-folhas-com-persiana-integrada-manual-18.php", "image": "/assets/images/janela_de_correr_2folhas_persiana_manual.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "sim", "persianaMotorizada": "manual", "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "janelasa/janela-de-correr-2-folhas-com-vidro-temperado-6mm-6.php", "image": "/assets/images/janela_de_correr_2folhas_manual.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "janelasa/janela-de-correr-3-folhas-com-vidro-temperado-6mm-37.php", "image": "/assets/images/janela_de_correr_3folhas_manual.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1, "maxLargura": 3, "folhasNumber": 3 },
    { "slug": "janelasa/janela-de-correr-4-folhas-com-vidro-temperado-6mm-14.php", "image": "/assets/images/janela_de_correr_4folhas_manual.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.2, "maxLargura": 4, "folhasNumber": 4 },
    { "slug": "janelasa/janela-veneziana-3-folhas-com-vidro-temperado-6mm--17.php", "image": "/assets/images/janela_de_correr_2folhas_veneziana.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 0.7, "maxLargura": 2, "folhasNumber": 3 },
    { "slug": "janelasa/janela-de-correr-6-folhas-veneziana-veneziana-vidro.php", "image": "/assets/images/janela_de_correr_6folhas_veneziana.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 1.4, "maxLargura": 3, "folhasNumber": 6 },
    { "slug": "janelasa/janela-maxim-ar-com-1-modulo-com-vidro-13.php", "image": "/assets/images/janela_maximar_1modulo.webp", "categoria": "janela", "sistema": "maxim-ar", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.4, "maxLargura": 1, "folhasNumber": 1 },
    { "slug": "janelasa/janela-maxim-ar-2-modulos-com-vidro-9.php", "image": "/assets/images/janela_maximar_2modulos.webp", "categoria": "janela", "sistema": "maxim-ar", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.8, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "janelasa/janela-maxim-ar-com-3-modulos-simetricos-com-vidro-46.php", "image": "/assets/images/janela_maximar_3modulos.webp", "categoria": "janela", "sistema": "maxim-ar", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.2, "maxLargura": 3, "folhasNumber": 3 },
    { "slug": "portas/porta-de-correr-2-folhas-com-persiana-integrada-motorizada-32.php", "image": "/assets/images/porta_de_correr_2folhas_persiana_integrada_motorizada.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "sim", "persianaMotorizada": "motorizada", "material": "vidro", "minLargura": 0.8, "maxLargura": 2.5, "folhasNumber": 2 },
    { "slug": "portas/porta-de-correr-2-folhas-com-persiana-integrada-manual-29.php", "image": "/assets/images/porta_de_correr_2folhas_persiana_integrada_manual.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "sim", "persianaMotorizada": "manual", "material": "vidro", "minLargura": 0.8, "maxLargura": 2.5, "folhasNumber": 2 },
    { "slug": "portas/porta-de-correr-2-folhas-com-vidro-temperado-6mm--27.php", "image": "/assets/images/porta_de_correr_2folhas_manual.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "portas/porta-de-correr-3-folhas-sequenciais-com-vidro-temperado-6mm--33.php", "image": "/assets/images/porta_de_correr_3folhas_manual.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.3, "maxLargura": 3, "folhasNumber": 3 },
    { "slug": "portas/porta-de-correr-4-folhas-com-vidro-temperado-6mm-38.php", "image": "/assets/images/porta_de_correr_4folhas_manual.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.5, "maxLargura": 3, "folhasNumber": 4 },
    { "slug": "portas/porta-veneziana-de-correr-3-folhas-2-venezianas-e-1-com-vidro-temperado-6mm--31.php", "image": "/assets/images/porta_de_correr_2folhas_veneziana.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 1, "maxLargura": 2.5, "folhasNumber": 3 },
    { "slug": "portas/porta-6-folhas-sendo-2-venezianas-cegas-2-venezianas-perfuradas-e-2-com-vidro-temperado-6mm--45.php", "image": "/assets/images/porta_de_correr_6folhas_veneziana.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 1.4, "maxLargura": 3, "folhasNumber": 6 },
    { "slug": "portas/porta-de-giro-1-folha-com-lambris-horizontais-34.php", "image": "/assets/images/porta_de_giro_1folha_lambris.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "lambri", "minLargura": 0.5, "maxLargura": 1, "folhasNumber": 1 },
    { "slug": "portas/porta-de-giro-2-folhas-em-lambris-horizontais-40.php", "image": "/assets/images/porta_de_giro_2folhas_lambris.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "lambri", "minLargura": 0.8, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "portas/porta-de-giro-1-folha-veneziana-8.php", "image": "/assets/images/porta_de_giro_1folha_veneziana.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "veneziana", "minLargura": 0.5, "maxLargura": 1, "folhasNumber": 1 },
    { "slug": "portas/porta-de-giro-2-folhas-veneziana-20.php", "image": "/assets/images/porta_de_giro_2folhas_veneziana.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "veneziana", "minLargura": 0.8, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "portas/porta-de-giro-1-folha-com-vidro-temperado-6mm-10.php", "image": "/assets/images/porta_de_giro_1folha_vidro.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.5, "maxLargura": 1, "folhasNumber": 1 },
    { "slug": "portas/porta-de-giro-2-folhas-com-vidro-temperado-6mm-23.php", "image": "/assets/images/porta_de_giro_2folhas_vidro.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.8, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "portas/porta-de-giro-metade-lambris-horizontais-e-metade-com-vidro-temperado-6mm-1-folha-36.php", "image": "/assets/images/porta_de_giro_1folha_metade_lambris.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + lambri", "minLargura": 0.5, "maxLargura": 1, "folhasNumber": 1 },
    { "slug": "portas/porta-de-giro-2-folhas-metade-em-lambris-horizontais-e-metade-com-vidro-temperado-6mm--39.php", "image": "/assets/images/porta_de_giro_2folhas_metade_lambris.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + lambri", "minLargura": 0.8, "maxLargura": 2, "folhasNumber": 2 },
    { "slug": "portas/porta-de-giro-metade-veneziana-e-metade-vidro-temperado-6mm--11.php", "image": "/assets/images/porta_de_giro_1folha_metade_veneziana.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 0.5, "maxLargura": 1, "folhasNumber": 1 },
    { "slug": "portas/porta-de-giro-2-folhas-metade-veneziana-e-metade-com-vidro-temperado-6mm-22.php", "image": "/assets/images/porta_de_giro_2folhas_metade_veneziana.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 0.8, "maxLargura": 2, "folhasNumber": 2 }
  ];