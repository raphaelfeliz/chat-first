/*
  FUTURE TYPESCRIPT UPGRADE PATH:
  This project is currently using plain JavaScript modules. To upgrade to TypeScript,
  you would need to introduce a build step (like Vite, esbuild, or tsc) to compile
  the .ts files into .js files that the browser can understand.

  Once a build tool is in place, you could:
  1. Rename this file back to `productCatalog.ts`.
  2. Uncomment the `Product` type definition below.
  3. Restore the `: Product[]` type annotation on the `PRODUCT_CATALOG` export.
  4. Update all `.js` files to `.ts` and add types as needed.
  5. Configure the build tool to output the final JavaScript files to a `dist` directory,
     and point the `index.html` script tags to those bundled files.
*/

/*
  // This is the TypeScript type definition for a Product.
  // It is commented out because we are using plain JavaScript.
  // If you upgrade the project to TypeScript, you can uncomment this.
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
    folhas: 1 | 2 | 3 | 4 | 6;
  };
*/

// The base URL for building product links
export const BASE_PRODUCT_URL = "https://fabricadoaluminio.com.br/produto/";

// The actual product catalog.
// The `: Product[]` type annotation has been removed for plain JS compatibility.
export const PRODUCT_CATALOG = [
  { "slug": "janelasa/janela-de-correr-2-folhas-com-persiana-integrada-motorizada-30.php", "image": "assets/images/janela_correr_persiana-sim_motorizada_2folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "sim", "persianaMotorizada": "motorizada", "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhas": 2 },
  { "slug": "janelasa/janela-de-correr-2-folhas-com-persiana-integrada-manual-18.php", "image": "assets/images/janela_correr_persiana-sim_manual_2folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "sim", "persianaMotorizada": "manual", "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhas": 2 },
  { "slug": "janelasa/janela-de-correr-2-folhas-com-vidro-temperado-6mm-6.php", "image": "assets/images/janela_correr_persiana-nao_manual_2folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhas": 2 },
  { "slug": "janelasa/janela-de-correr-3-folhas-com-vidro-temperado-6mm-37.php", "image": "assets/images/janela_correr_persiana-nao_manual_3folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1, "maxLargura": 3, "folhas": 3 },
  { "slug": "janelasa/janela-de-correr-4-folhas-com-vidro-temperado-6mm-14.php", "image": "assets/images/janela_correr_persiana-nao_manual_4folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.2, "maxLargura": 4, "folhas": 4 },
  { "slug": "janelasa/janela-veneziana-3-folhas-com-vidro-temperado-6mm--17.php", "image": "assets/images/janela_correr_persiana-nao_veneziana_2folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 0.7, "maxLargura": 2, "folhas": 3 },
  { "slug": "janelasa/janela-de-correr-6-folhas-veneziana-veneziana-vidro.php", "image": "assets/images/janela_correr_persiana-nao_veneziana_6folhas.webp", "categoria": "janela", "sistema": "janela-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 1.4, "maxLargura": 3, "folhas": 6 },
  { "slug": "janelasa/janela-maxim-ar-com-1-modulo-com-vidro-13.php", "image": "assets/images/janela_maxim-ar_persiana-nao_blank_1folhas.webp", "categoria": "janela", "sistema": "maxim-ar", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.4, "maxLargura": 1, "folhas": 1 },
  { "slug": "janelasa/janela-maxim-ar-2-modulos-com-vidro-9.php", "image": "assets/images/janela_maxim-ar_persiana-nao_blank_2folhas.webp", "categoria": "janela", "sistema": "maxim-ar", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.8, "maxLargura": 2, "folhas": 2 },
  { "slug": "janelasa/janela-maxim-ar-com-3-modulos-simetricos-com-vidro-46.php", "image": "assets/images/janela_maxim-ar_persiana-nao_blank_3folhas.webp", "categoria": "janela", "sistema": "maxim-ar", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.2, "maxLargura": 3, "folhas": 3 },
  { "slug": "portas/porta-de-correr-2-folhas-com-persiana-integrada-motorizada-32.php", "image": "assets/images/porta_correr_persiana-sim_motorizada_2folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "sim", "persianaMotorizada": "motorizada", "material": "vidro", "minLargura": 0.8, "maxLargura": 2.5, "folhas": 2 },
  { "slug": "portas/porta-de-correr-2-folhas-com-persiana-integrada-manual-29.php", "image": "assets/images/porta_correr_persiana-sim_manual_2folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "sim", "persianaMotorizada": "manual", "material": "vidro", "minLargura": 0.8, "maxLargura": 2.5, "folhas": 2 },
  { "slug": "portas/porta-de-correr-2-folhas-com-vidro-temperado-6mm--27.php", "image": "assets/images/porta_correr_persiana-nao_manual_2folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.7, "maxLargura": 2, "folhas": 2 },
  { "slug": "portas/porta-de-correr-3-folhas-sequenciais-com-vidro-temperado-6mm--33.php", "image": "assets/images/porta_correr_persiana-nao_manual_3folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.3, "maxLargura": 3, "folhas": 3 },
  { "slug": "portas/porta-de-correr-4-folhas-com-vidro-temperado-6mm-38.php", "image": "assets/images/porta_correr_persiana-nao_blank_4folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 1.5, "maxLargura": 3, "folhas": 4 },
  { "slug": "portas/porta-veneziana-de-correr-3-folhas-2-venezianas-e-1-com-vidro-temperado-6mm--31.php", "image": "assets/images/porta_correr_persiana-nao_veneziana_2folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 1, "maxLargura": 2.5, "folhas": 3 },
  { "slug": "portas/porta-6-folhas-sendo-2-venezianas-cegas-2-venezianas-perfuradas-e-2-com-vidro-temperado-6mm--45.php", "image": "assets/images/porta_correr_persiana-nao_blank_6folhas.webp", "categoria": "porta", "sistema": "porta-correr", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 1.4, "maxLargura": 3, "folhas": 6 },
  { "slug": "portas/porta-de-giro-1-folha-com-lambris-horizontais-34.php", "image": "assets/images/porta_giro_persiana-nao_lambris_1folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "lambri", "minLargura": 0.5, "maxLargura": 1, "folhas": 1 },
  { "slug": "portas/porta-de-giro-2-folhas-em-lambris-horizontais-40.php", "image": "assets/images/porta_giro_persiana-nao_lambris_2folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "lambri", "minLargura": 0.8, "maxLargura": 2, "folhas": 2 },
  { "slug": "portas/porta-de-giro-1-folha-veneziana-8.php", "image": "assets/images/porta_giro_persiana-nao_veneziana_1folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "veneziana", "minLargura": 0.5, "maxLargura": 1, "folhas": 1 },
  { "slug": "portas/porta-de-giro-2-folhas-veneziana-20.php", "image": "assets/images/porta_giro_persiana-nao_veneziana_2folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "veneziana", "minLargura": 0.8, "maxLargura": 2, "folhas": 2 },
  { "slug": "portas/porta-de-giro-1-folha-com-vidro-temperado-6mm-10.php", "image": "assets/images/porta_giro_persiana-nao_blank_1folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.5, "maxLargura": 1, "folhas": 1 },
  { "slug": "portas/porta-de-giro-2-folhas-com-vidro-temperado-6mm-23.php", "image": "assets/images/porta_giro_persiana-nao_blank_2folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro", "minLargura": 0.8, "maxLargura": 2, "folhas": 2 },
  { "slug": "portas/porta-de-giro-metade-lambris-horizontais-e-metade-com-vidro-temperado-6mm-1-folha-36.php", "image": "assets/images/porta_giro_persiana-nao_metade-lambris_1folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + lambri", "minLargura": 0.5, "maxLargura": 1, "folhas": 1 },
  { "slug": "portas/porta-de-giro-2-folhas-metade-em-lambris-horizontais-e-metade-com-vidro-temperado-6mm--39.php", "image": "assets/images/porta_giro_persiana-nao_metade-lambris_2folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + lambri", "minLargura": 0.8, "maxLargura": 2, "folhas": 2 },
  { "slug": "portas/porta-de-giro-metade-veneziana-e-metade-vidro-temperado-6mm--11.php", "image": "assets/images/porta_giro_persiana-nao_metade-veneziana_1folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 0.5, "maxLargura": 1, "folhas": 1 },
  { "slug": "portas/porta-de-giro-2-folhas-metade-veneziana-e-metade-com-vidro-temperado-6mm-22.php", "image": "assets/images/porta_giro_persiana-nao_metade-veneziana_2folhas.webp", "categoria": "porta", "sistema": "giro", "persiana": "nao", "persianaMotorizada": null, "material": "vidro + veneziana", "minLargura": 0.8, "maxLargura": 2, "folhas": 2 }
];
