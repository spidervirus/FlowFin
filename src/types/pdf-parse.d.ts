declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    numpages: number;
  }
  
  function PDFParse(buffer: Buffer): Promise<PDFData>;
  export = PDFParse;
}
