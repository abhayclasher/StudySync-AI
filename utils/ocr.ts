
/**
 * Performs OCR on the given image data using Tesseract.js
 * @param imageData - The image data (URL, Blob, etc.)
 * @returns The extracted text
 */
export const performOCR = async (imageData: any): Promise<string> => {
    try {
        const Tesseract = await import('tesseract.js');
        const { data: { text } } = await Tesseract.recognize(imageData, 'eng+hin', {
            logger: m => console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        });
        return text || '';
    } catch (error) {
        console.error('OCR Error:', error);
        return '';
    }
};

/**
 * Renders a PDF page to a canvas for OCR or display
 * @param page - The PDF page object from pdf.js
 * @param scale - The scale factor
 * @returns The canvas element
 */
export const imageFromPDFPage = async (page: any, scale: number = 2.0): Promise<any> => {
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) {
        throw new Error('Could not get canvas context');
    }

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };

    await page.render(renderContext).promise;
    return canvas;
};
