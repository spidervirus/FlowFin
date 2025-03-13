import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import tesseract from 'node-tesseract-ocr';
import { parseReceiptText, ExtractedReceiptData } from '../../../lib/ocr-utils';
import sharp from 'sharp';

// Import pdf-parse using require
const pdfParse = require('pdf-parse');

// Add interface for line data
interface LineData {
  text: string;
  confidence: number;
}

// Add interface for PDF data
interface PDFData {
  text: string;
  info: any;
  metadata: any;
  version: string;
  numpages: number;
}

// Function to preprocess image for better OCR results
async function preprocessImage(imageBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  try {
    console.log('Starting image preprocessing...');
    
    // Create a temporary file to save the image
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `receipt_${Date.now()}.png`); // Always save as PNG
    
    console.log('Applying image enhancements...');
    // Process the image with sharp for better OCR results
    const processedBuffer = await sharp(Buffer.from(imageBuffer))
      .png() // Convert to PNG format
      .grayscale() // Convert to grayscale
      .normalize() // Normalize the image
      .modulate({ brightness: 1.2 }) // Increase brightness
      .sharpen() // Basic sharpening
      .toBuffer();
    
    // Write the processed buffer to the temporary file
    await fs.writeFile(tempFilePath, processedBuffer);
    
    // Verify the file was created
    try {
      await fs.access(tempFilePath);
      console.log(`Enhanced image saved to: ${tempFilePath}`);
    } catch (error) {
      throw new Error('Failed to save processed image');
    }
    
    return tempFilePath;
  } catch (error) {
    console.error('Error during image preprocessing:', error);
    throw new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to perform OCR using node-tesseract-ocr with robust error handling
async function performRobustOcr(imagePath: string): Promise<{ text: string; lines: LineData[] }> {
  console.log('Starting Tesseract OCR processing...');
  
  try {
    // Verify file exists before processing
    try {
      await fs.access(imagePath);
      console.log('Input file exists and is accessible');
    } catch (error) {
      throw new Error(`Input file not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Configure Tesseract options for better receipt recognition
    const config = {
      lang: 'eng',
      oem: 3, // Default OCR Engine Mode
      psm: 6, // Assume uniform block of text
      dpi: 300,
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:$%&()+-=*/\\\'"`!?@#_[]{}|<>^~ '
    };
    
    console.log('Starting OCR with config:', JSON.stringify(config));
    const text = await tesseract.recognize(imagePath, config);
    
    if (!text || text.trim().length === 0) {
      console.error('OCR completed but no text was extracted');
      throw new Error('No text extracted from image');
    }
    
    console.log('OCR completed successfully');
    console.log('Extracted text sample:', text.substring(0, 100));
    
    // Clean up the temporary file
    try {
      await fs.unlink(imagePath);
      console.log(`Temporary file removed: ${imagePath}`);
    } catch (unlinkError) {
      console.error('Error removing temporary file:', unlinkError);
    }
    
    // Create line objects with proper typing
    const lines: LineData[] = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((lineText: string) => ({
        text: lineText,
        confidence: 90
      }));
    
    return { text, lines };
  } catch (error) {
    console.error('Error during Tesseract OCR processing:', error);
    
    // Try to clean up the temporary file even if OCR fails
    try {
      await fs.unlink(imagePath);
      console.log(`Temporary file removed after error: ${imagePath}`);
    } catch (unlinkError) {
      console.error('Error removing temporary file:', unlinkError);
    }
    
    throw error;
  }
}

// Function to extract text from PDF
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{ text: string; lines: LineData[] }> {
  try {
    console.log('Extracting text from PDF...');
    const data = await pdfParse(pdfBuffer);
    
    // Split text into lines and create line objects with proper typing
    const lines: LineData[] = data.text.split('\n').map((lineText: string) => ({
      text: lineText.trim(),
      confidence: 95 // High confidence for direct PDF text extraction
    })).filter((line: LineData) => line.text.length > 0);
    
    return { text: data.text, lines };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return { text: '', lines: [] };
  }
}

// Function to convert PDF page to image
async function convertPdfPageToImage(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    console.log('Converting PDF to image...');
    
    // First try to extract text
    const { text } = await extractTextFromPdf(pdfBuffer);
    
    // If we got meaningful text, no need to convert to image
    if (text && text.trim().length > 50) {
      return null;
    }
    
    // If text extraction failed or returned little text, the PDF might be scanned
    // Use sharp to convert the first page to an image
    const image = await sharp(pdfBuffer, { pages: 1 })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
    
    return image;
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    return null;
  }
}

// Function to process receipt and extract data
async function processReceipt(file: File): Promise<ExtractedReceiptData> {
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  
  console.log('Starting receipt processing...');
  console.log(`File details: name=${file.name}, type=${file.type}, size=${file.size} bytes`);
  
  if (!isPdf && !isImage) {
    console.error(`Unsupported file type: ${file.type}`);
    throw new Error(`Unsupported file type: ${file.type}. Only PDF and image files are supported.`);
  }
  
  try {
    console.log('Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`Buffer created successfully, size: ${buffer.length} bytes`);
    
    let text = '';
    let lines: any[] = [];
    
    if (isPdf) {
      console.log('Processing PDF file...');
      try {
        // First try to extract text directly from PDF
        console.log('Attempting direct PDF text extraction...');
        const pdfResult = await extractTextFromPdf(buffer);
        text = pdfResult.text;
        lines = pdfResult.lines;
        console.log(`PDF text extraction result: ${text.length} characters, ${lines.length} lines`);
        
        // If direct text extraction yields insufficient results, try converting to image
        if (!text || text.trim().length < 50) {
          console.log('PDF text extraction returned insufficient text, attempting image conversion...');
          const imageBuffer = await convertPdfPageToImage(buffer);
          
          if (imageBuffer) {
            console.log('PDF successfully converted to image, proceeding with OCR...');
            // Save the image buffer to a temporary file
            const tempDir = os.tmpdir();
            const imagePath = path.join(tempDir, `receipt_${Date.now()}.png`);
            await fs.writeFile(imagePath, imageBuffer);
            
            // Perform OCR on the image
            const ocrResult = await performRobustOcr(imagePath);
            text = ocrResult.text;
            lines = ocrResult.lines;
            console.log(`OCR result from converted PDF: ${text.length} characters, ${lines.length} lines`);
          } else {
            console.error('Failed to convert PDF to image');
          }
        }
      } catch (pdfError) {
        console.error('Error processing PDF:', pdfError);
        throw pdfError;
      }
    } else {
      console.log('Processing image file...');
      try {
        const imagePath = await preprocessImage(bytes, file.type);
        console.log('Image preprocessing completed, proceeding with OCR...');
        
        const ocrPromise = new Promise<{ text: string; lines: any[] }>(async (resolve, reject) => {
          try {
            const result = await performRobustOcr(imagePath);
            console.log(`OCR completed: ${result.text.length} characters, ${result.lines.length} lines`);
            resolve(result);
          } catch (error) {
            console.error('OCR processing error:', error);
            reject(error);
          }
        });
        
        const ocrTimeoutPromise = new Promise<{ text: string; lines: any[] }>((resolve) => {
          setTimeout(() => {
            console.log('OCR processing timeout reached');
            resolve({ text: '', lines: [] });
          }, 30000); // Increased timeout to 30 seconds
        });
        
        const result = await Promise.race([ocrPromise, ocrTimeoutPromise]);
        text = result.text;
        lines = result.lines;
        
        if (text) {
          console.log('Text extraction successful');
          console.log('First 200 characters:', text.substring(0, 200));
        } else {
          console.log('No text extracted from image');
        }
      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
        throw ocrError;
      }
    }
    
    // If we have text, process it using the utility function
    if (text && text.trim() && text.trim().length >= 20) {
      console.log('Processing extracted text...');
      const result = parseReceiptText(text, lines);
      console.log('Receipt parsing completed:', result);
      return result;
    } else {
      console.log('Insufficient text extracted, returning error data');
      return {
        merchant: "Text Extraction Failed",
        date: new Date().toISOString().split('T')[0],
        total: 0,
        items: [{ 
          description: "Failed to extract text from receipt. Please ensure the image is clear and well-lit.", 
          amount: 0 
        }]
      };
    }
  } catch (error) {
    console.error('Fatal error in processReceipt:', error);
    return {
      merchant: "Error Processing Receipt",
      date: new Date().toISOString().split('T')[0],
      total: 0,
      items: [{ 
        description: `Processing error - ${error instanceof Error ? error.message : 'Unknown error occurred'}`, 
        amount: 0 
      }]
    };
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Receipt scanning feature is coming soon!',
    status: 'unavailable'
  }, { status: 503 });
} 