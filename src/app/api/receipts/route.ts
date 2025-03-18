import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import tesseract from 'node-tesseract-ocr';
import { parseReceiptText, ExtractedReceiptData } from '../../../lib/ocr-utils';
import sharp from 'sharp';

// Add interface for line data
interface LineData {
  text: string;
  confidence: number;
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
    let lines: LineData[] = [];
    
    if (isPdf) {
      console.log('Processing PDF file...');
      try {
        // Convert PDF to image using sharp
        console.log('Converting PDF to image...');
        const image = await sharp(buffer, { pages: 1 })
          .grayscale()
          .normalize()
          .sharpen()
          .toBuffer();
        
        // Save the image buffer to a temporary file
        const tempDir = os.tmpdir();
        const imagePath = path.join(tempDir, `receipt_${Date.now()}.png`);
        await fs.writeFile(imagePath, image);
        
        // Perform OCR on the image
        console.log('Performing OCR on converted PDF...');
        const ocrResult = await performRobustOcr(imagePath);
        text = ocrResult.text;
        lines = ocrResult.lines;
        console.log(`OCR result from converted PDF: ${text.length} characters, ${lines.length} lines`);
      } catch (pdfError) {
        console.error('Error processing PDF:', pdfError);
        throw pdfError;
      }
    } else {
      console.log('Processing image file...');
      try {
        const imagePath = await preprocessImage(bytes, file.type);
        console.log('Image preprocessing completed, proceeding with OCR...');
        
        const ocrResult = await performRobustOcr(imagePath);
        text = ocrResult.text;
        lines = ocrResult.lines;
        console.log(`OCR completed: ${text.length} characters, ${lines.length} lines`);
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
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and image files are supported.' },
        { status: 400 }
      );
    }

    // Process the receipt
    const extractedData = await processReceipt(file);

    // Return the extracted data
    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 