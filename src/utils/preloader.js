
/*
path: src/utils/preloader.js
purpose: Handles the preloading of images to improve UI responsiveness. It logs the precise success or failure of each image load attempt.
*/
import log from './logger.js';

const loadImage = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;

        log('debug', 'preloader', 'ATTEMPT_LOAD', `Attempting to load image.`, { url });

        img.onload = () => {
            log('info', 'preloader', 'IMAGE_SUCCESS', `Successfully preloaded image.`, { url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
            resolve({ url, status: 'success' });
        };
        
        img.onerror = (error) => {
            log('error', 'preloader', 'IMAGE_FAIL', `Failed to preload image. The browser returned an error.`, { url, error: error ? error.type : 'UnknownError' });
            resolve({ url, status: 'error' }); // Resolve even on failure to not block Promise.all
        };
    });
};

export const preloadImages = (priorityUrls, otherUrls) => {
    log('info', 'preloader', 'PRELOAD_START', `Starting image preloading process.`, { priorityCount: priorityUrls.length, otherCount: otherUrls.length });

    const allUrls = [...priorityUrls, ...otherUrls];
    if (allUrls.length === 0) {
        log('warn', 'preloader', 'PRELOAD_SKIP', 'No image URLs were provided to the preloader.');
        return Promise.resolve();
    }

    const promises = allUrls.map(loadImage);

    return Promise.all(promises).then(results => {
        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'error').length;
        log('info', 'preloader', 'PRELOAD_COMPLETE', `Image preloading finished.`, { total: results.length, successful, failed });
    });
};