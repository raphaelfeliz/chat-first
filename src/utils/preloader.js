
/*
path: src/utils/preloader.js
purpose: A utility to preload images in the background to improve UI responsiveness, with priority for initial images.
*/

/**
 * Preloads an array of images.
 * @param {Array<string>} imageUrls - An array of image URLs to load.
 * @returns {Promise<void[]>} A promise that resolves when all images have been loaded (or failed).
 */
function load(imageUrls) {
  const promises = imageUrls.map(src => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = resolve; // Always resolve, so one failure doesn't stop the process.
    });
  });
  return Promise.all(promises);
}

/**
 * Preloads images, prioritizing the initial set and then loading the rest during idle time.
 * @param {Array<string>} priorityUrls - The image URLs to load immediately.
 * @param {Array<string>} otherUrls - The rest of the image URLs to load in the background.
 */
export async function preloadImages(priorityUrls, otherUrls) {
  if (!priorityUrls || !otherUrls) return;

  // Immediately load high-priority images
  try {
    await load(priorityUrls);
  } catch (error) {
    console.error("Error preloading high-priority images:", error);
  }

  // Load the rest of the images when the browser is idle
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      load(otherUrls);
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      load(otherUrls);
    }, 1000); // Wait a second before starting the background load
  }
}
