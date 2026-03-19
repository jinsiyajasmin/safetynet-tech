import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Generates and downloads a PDF from a given HTML element reference.
 * 
 * @param {React.RefObject} printRef - The useRef hook pointing to the component to print
 * @param {string} fileName - The desired name of the downloaded file
 * @param {function} onComplete - Callback executed after generation (e.g. to close the window)
 */
export const downloadPdfFromRef = async (printRef, fileName = "document", onComplete = null) => {
    if (!printRef || !printRef.current) {
        console.error("No print reference provided for PDF generation.");
        return;
    }

    try {
        const canvas = await html2canvas(printRef.current, {
            useCORS: true,
            scale: 2, // enhances quality
            logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const margin = 15; // 15mm margin on all sides
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let position = margin;
        let heightLeft = imgHeight;

        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        
        // White mask for bottom margin on the first page
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, pageHeight - margin, pageWidth, margin, "F");
        
        heightLeft -= (pageHeight - margin * 2);

        while (heightLeft > 0) {
            position -= (pageHeight - margin * 2);
            pdf.addPage();
            pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
            
            // White mask for top and bottom margins on subsequent pages
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, margin, "F");
            pdf.rect(0, pageHeight - margin, pageWidth, margin, "F");
            
            heightLeft -= (pageHeight - margin * 2);
        }

        pdf.save(`${fileName}.pdf`);
        
        if (onComplete) onComplete();
    } catch (err) {
        console.error("PDF generation failed:", err);
        if (onComplete) onComplete(err);
    }
};
