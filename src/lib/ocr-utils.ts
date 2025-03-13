/**
 * Utility functions for OCR processing
 */

export interface ExtractedReceiptData {
    merchant: string;
    date: string;
    total: number;
    items: {
      description: string;
      amount: number;
    }[];
  }
  
  /**
   * Parse raw OCR text to extract structured receipt data
   */
  export function parseReceiptText(text: string, lines: any[] = []): ExtractedReceiptData {
    // Default values
    let merchant = "Unknown Merchant";
    let date = new Date().toISOString().split('T')[0];
    let total = 0;
    const items: { description: string; amount: number }[] = [];
    
    // Convert text to lowercase for case-insensitive matching
    const lowerText = text.toLowerCase();
    const textLines = text.split('\n').filter(line => line.trim() !== '');
    
    // Try to extract merchant name (usually at the top of receipt)
    if (textLines.length > 0) {
      // First line is often the merchant name
      merchant = textLines[0].trim();
      
      // If first line is too short or looks like a header, try the second line
      if (merchant.length < 3 || /receipt|invoice|order/i.test(merchant)) {
        merchant = textLines.length > 1 ? textLines[1].trim() : "Unknown Merchant";
      }
    }
    
    // Try to extract date
    const dateRegexes = [
      /date\s*:\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/i,  // date: MM/DD/YYYY
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,               // MM/DD/YYYY or DD/MM/YYYY
      /(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/,               // YYYY/MM/DD
      /date\s*:\s*(\w+\s+\d{1,2},?\s+\d{4})/i,        // date: Month DD, YYYY
      /(\w+\s+\d{1,2},?\s+\d{4})/                      // Month DD, YYYY
    ];
    
    for (const regex of dateRegexes) {
      const match = lowerText.match(regex);
      if (match && match[1]) {
        // Try to parse the date
        try {
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          // Continue to next regex if date parsing fails
        }
      }
    }
    
    // Try to extract total amount
    const totalRegexes = [
      /total\s*:?\s*\$?\s*(\d+[.,]\d{2})/i,  // total: $XX.XX
      /total\s*\$?\s*(\d+[.,]\d{2})/i,        // total $XX.XX
      /sum\s*:?\s*\$?\s*(\d+[.,]\d{2})/i,     // sum: $XX.XX
      /amount\s*:?\s*\$?\s*(\d+[.,]\d{2})/i,  // amount: $XX.XX
      /\$\s*(\d+[.,]\d{2})\s*$/m             // $XX.XX at end of line
    ];
    
    for (const regex of totalRegexes) {
      const match = lowerText.match(regex);
      if (match && match[1]) {
        // Parse the amount, handling both period and comma as decimal separator
        const amountStr = match[1].replace(',', '.');
        const parsedAmount = parseFloat(amountStr);
        if (!isNaN(parsedAmount)) {
          total = parsedAmount;
          break;
        }
      }
    }
    
    // Try to extract line items
    // This is more complex and depends heavily on receipt format
    // Look for patterns like "Item name $XX.XX" or "Item name.....$XX.XX"
    const itemRegex = /(.*?)\s+\$?\s*(\d+[.,]\d{2})\s*$/;
    
    for (const line of textLines) {
      // Skip lines that are likely headers or totals
      if (/subtotal|tax|total|sum|amount|date|time|receipt|invoice|order/i.test(line)) {
        continue;
      }
      
      const match = line.match(itemRegex);
      if (match && match[1] && match[2]) {
        const description = match[1].trim();
        const amountStr = match[2].replace(',', '.');
        const amount = parseFloat(amountStr);
        
        if (description && !isNaN(amount) && description.length > 1) {
          // Only add if description is not just a single character and amount is valid
          items.push({ description, amount });
        }
      }
    }
    
    // If we couldn't extract any items but have lines from Tesseract
    if (items.length === 0 && lines && lines.length > 0) {
      // Try to extract items from Tesseract lines with confidence above threshold
      for (const line of lines) {
        if (line.confidence < 60) continue; // Default threshold
        
        const text = line.text.trim();
        const match = text.match(itemRegex);
        
        if (match && match[1] && match[2]) {
          const description = match[1].trim();
          const amountStr = match[2].replace(',', '.');
          const amount = parseFloat(amountStr);
          
          if (description && !isNaN(amount) && description.length > 1) {
            items.push({ description, amount });
          }
        }
      }
    }
    
    // If we still couldn't extract items, create a single item with the total
    if (items.length === 0 && total > 0) {
      items.push({
        description: "Unspecified Item",
        amount: total
      });
    }
    
    return {
      merchant,
      date,
      total,
      items
    };
  }
  
  /**
   * Apply image processing to improve OCR results
   */
  export function processImage(
    canvas: HTMLCanvasElement,
    settings: {
      brightness?: number;
      contrast?: number;
      grayscale?: boolean;
      invert?: boolean;
      threshold?: number;
    } = {}
  ): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply image processing
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      const brightness = (settings.brightness || 0) / 100 * 255;
      data[i] += brightness;     // R
      data[i + 1] += brightness; // G
      data[i + 2] += brightness; // B
      
      // Apply contrast
      const contrast = (settings.contrast || 0) / 100 + 1;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      data[i] = factor * (data[i] - 128) + 128;         // R
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
      
      // Apply grayscale
      if (settings.grayscale) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
      }
      
      // Apply threshold
      if (settings.threshold && settings.threshold > 0) {
        const thresholdValue = settings.threshold * 2.55;
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const value = avg > thresholdValue ? 255 : 0;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
      }
      
      // Apply invert
      if (settings.invert) {
        data[i] = 255 - data[i];         // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
      }
    }
    
    // Put processed image data back
    ctx.putImageData(imageData, 0, 0);
    
    return canvas;
  }
  