declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    info: any;
    metadata: any;
    version: string;
    numpages: number;
  }
  
  function parse(buffer: Buffer): Promise<PDFData>;
  export = parse;
} 