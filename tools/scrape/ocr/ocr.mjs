import { createWorker } from "tesseract.js";

export async function callOcrApi(screenshotBuffer) {
    console.log("[OCR] Running Tesseract.js locally...");
    const worker = await createWorker("eng");
    try {
        const {
            data: { text },
        } = await worker.recognize(screenshotBuffer);
        console.log("[OCR] OCR completed");
        return text;
    } catch (err) {
        console.error("[OCR] Tesseract.js failed:", err.message);
        throw err;
    } finally {
        await worker.terminate();
    }
}
