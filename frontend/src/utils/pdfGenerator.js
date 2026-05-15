import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MAX_OUTPUT_BYTES = 10 * 1024 * 1024; // 10 MB hard cap (base64 ≈ 4/3 binary; we also compress in PDF)
const ORPHAN_PAGE_FRACTION = 0.28; // If last page would be shorter than this × usable page height, fit on one page

/**
 * Wait for <img> nodes to finish loading so PDF capture includes logos and signatures.
 */
function waitForImages(root, timeoutMs = 15000) {
    if (!root) return Promise.resolve();
    const imgs = Array.from(root.querySelectorAll("img")).filter((img) => img.getAttribute("src"));
    if (imgs.length === 0) return Promise.resolve();

    const waitOne = (img) =>
        new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
        });

    return Promise.race([
        Promise.all(imgs.map(waitOne)),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
}

function absolutizeMediaUrlsInClone(_document, clonedRoot) {
    if (!clonedRoot?.querySelectorAll) return;
    clonedRoot.querySelectorAll("img[src]").forEach((img) => {
        const s = img.getAttribute("src");
        if (!s || s.startsWith("data:") || s.startsWith("blob:") || /^https?:\/\//i.test(s)) return;
        if (s.startsWith("/")) {
            img.setAttribute("src", `${window.location.origin}${s}`);
        }
    });
}

/**
 * Pick html2canvas scale + JPEG quality to stay sharp but avoid huge captures.
 */
function pickCaptureOptions(element) {
    const w = element?.scrollWidth || 1000;
    const h = element?.scrollHeight || 1000;
    const megapixels = (w * h) / 1e6;
    let scale = 1.45;
    if (megapixels > 3.5) scale = 1.25;
    if (megapixels > 8) scale = 1.05;
    let jpegQuality = 0.74;
    if (megapixels > 5) jpegQuality = 0.68;
    if (megapixels > 10) jpegQuality = 0.62;
    return { scale, jpegQuality };
}

/**
 * If the bitmap would span two pages but the second slice is only a small strip,
 * scale the whole image down so everything fits on one page (no orphan page).
 */
function applyOrphanPageMerge(imgWidth, imgHeight, availableWidth, availableHeight, onePageOnly) {
    if (onePageOnly) return { imgWidth, imgHeight, singlePage: true };
    if (imgHeight <= availableHeight) return { imgWidth, imgHeight, singlePage: true };

    const fullPages = Math.floor(imgHeight / availableHeight);
    const remainder = imgHeight - fullPages * availableHeight;
    const pagesIfSplit = Math.ceil(imgHeight / availableHeight);

    if (pagesIfSplit === 2 && remainder > 0 && remainder < availableHeight * ORPHAN_PAGE_FRACTION) {
        const fit = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        return {
            imgWidth: imgWidth * fit,
            imgHeight: imgHeight * fit,
            singlePage: true,
        };
    }

    return { imgWidth, imgHeight, singlePage: false };
}

/**
 * Generates and downloads a PDF from a given HTML element reference.
 *
 * @param {React.RefObject} printRef - The useRef hook pointing to the component to print
 * @param {string} fileName - The desired name of the downloaded file
 * @param {function} onComplete - Callback executed after generation (e.g. to close the window)
 * @param {object} [options]
 * @param {boolean} [options.onePageOnly] - Force single page (scale down)
 * @param {number} [options.marginX] - Left/right inset (mm); default ~12
 * @param {number} [options.marginY] - Legacy vertical band; overridden by header/footer insets when not set with headerInset
 * @param {number} [options.headerInsetMm] - Top reserved band (mm)
 * @param {number} [options.footerInsetMm] - Bottom reserved band for footer text (mm)
 */
export const downloadPdfFromRef = async (printRef, fileName = "document", onComplete = null, options = {}) => {
    if (!printRef || !printRef.current) {
        console.error("No print reference provided for PDF generation.");
        return;
    }

    const { onePageOnly = false } = options;

    const marginX = options.marginX !== undefined ? options.marginX : 12;
    const legacyY = options.marginY;
    const headerInsetMm =
        options.headerInsetMm !== undefined ? options.headerInsetMm : legacyY !== undefined ? legacyY : 11;
    const footerInsetMm =
        options.footerInsetMm !== undefined ? options.footerInsetMm : legacyY !== undefined ? legacyY : 13;

    try {
        await waitForImages(printRef.current);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const el = printRef.current;
        const { scale, jpegQuality } = pickCaptureOptions(el);

        const canvas = await html2canvas(el, {
            useCORS: true,
            allowTaint: false,
            scale,
            logging: false,
            windowWidth: el.scrollWidth,
            windowHeight: el.scrollHeight,
            onclone: (_clonedDoc, clonedElement) => {
                absolutizeMediaUrlsInClone(_clonedDoc, clonedElement);
            },
        });

        const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const contentLeft = marginX;
        const contentRight = marginX;
        const availableWidth = pageWidth - contentLeft - contentRight;

        const contentTop = headerInsetMm;
        const contentBottom = footerInsetMm;
        const availableHeight = pageHeight - contentTop - contentBottom;

        let imgWidth = availableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (onePageOnly && imgHeight > availableHeight) {
            const r = availableHeight / imgHeight;
            imgHeight = availableHeight;
            imgWidth *= r;
        }

        const merged = applyOrphanPageMerge(
            imgWidth,
            imgHeight,
            availableWidth,
            availableHeight,
            onePageOnly
        );
        imgWidth = merged.imgWidth;
        imgHeight = merged.imgHeight;
        const forceSinglePage = merged.singlePage;

        let imgData = canvas.toDataURL("image/jpeg", jpegQuality);

        // If the embedded image is still huge, step down JPEG quality until under cap (rough guard).
        for (let q = jpegQuality - 0.06; q >= 0.45 && imgData.length > MAX_OUTPUT_BYTES * 0.55; q -= 0.06) {
            imgData = canvas.toDataURL("image/jpeg", q);
        }

        const totalPages = forceSinglePage ? 1 : Math.max(1, Math.ceil(imgHeight / availableHeight));
        const currentDate = new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const footerLineY = pageHeight - contentBottom + 4;
        const footerTextY = pageHeight - contentBottom + 8.5;

        const drawHeaderFooter = (pageNum) => {
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, contentTop, "F");
            pdf.rect(0, pageHeight - contentBottom, pageWidth, contentBottom, "F");

            pdf.setDrawColor(230, 230, 230);
            pdf.setLineWidth(0.2);
            pdf.line(contentLeft, contentTop - 0.5, pageWidth - contentRight, contentTop - 0.5);
            pdf.line(contentLeft, footerLineY, pageWidth - contentRight, footerLineY);

            pdf.setFontSize(8);
            pdf.setTextColor(90, 90, 90);
            pdf.text(currentDate, contentLeft + 2, footerTextY);
            const pageLabel = `Page ${pageNum} of ${totalPages}`;
            pdf.text(pageLabel, pageWidth - contentRight - 2, footerTextY, { align: "right" });
        };

        const xPos = contentLeft + (availableWidth - imgWidth) / 2;
        const yStart = contentTop;

        pdf.addImage(imgData, "JPEG", xPos, yStart, imgWidth, imgHeight, undefined, "FAST");
        drawHeaderFooter(1);

        if (!forceSinglePage && !onePageOnly) {
            let heightLeft = imgHeight - availableHeight;
            let currentPage = 2;
            while (heightLeft > 0) {
                const yPos = contentTop - availableHeight * (currentPage - 1);
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", xPos, yPos, imgWidth, imgHeight, undefined, "FAST");
                drawHeaderFooter(currentPage);
                heightLeft -= availableHeight;
                currentPage++;
            }
        }

        const out = pdf.output("arraybuffer");
        if (out.byteLength > MAX_OUTPUT_BYTES) {
            console.warn(
                `PDF output is ${(out.byteLength / (1024 * 1024)).toFixed(2)} MB (cap ${MAX_OUTPUT_BYTES / (1024 * 1024)} MB). Try printing a shorter section or reduce images.`
            );
        }

        pdf.save(`${fileName}.pdf`);

        if (onComplete) onComplete();
    } catch (err) {
        console.error("PDF generation failed:", err);
        if (onComplete) onComplete(err);
    }
};
