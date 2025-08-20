declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface AutoTableOptions {
    head?: string[][];
    body?: string[][];
    startY?: number;
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      lineColor?: number[];
      lineWidth?: number;
    };
    headStyles?: {
      fillColor?: number[];
      textColor?: number;
      fontStyle?: string;
    };
    alternateRowStyles?: {
      fillColor?: number[];
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number;
      };
    };
    didDrawPage?: (data: any) => void;
  }
  
  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export = autoTable;
}
