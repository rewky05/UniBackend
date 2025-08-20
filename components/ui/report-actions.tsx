"use client";

import { PrintView } from "./print-view";
import { PDFGenerator } from "./pdf-generator";

interface ReportActionsProps {
  title: string;
  subtitle?: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
    width?: number;
  }[];
  filters?: {
    label: string;
    value: string;
  }[];
  onPrint?: () => void;
  onGeneratePDF?: () => void;
  className?: string;
  filename?: string;
}

export function ReportActions({
  title,
  subtitle,
  data,
  columns,
  filters = [],
  onPrint,
  onGeneratePDF,
  className = "",
  filename
}: ReportActionsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <PrintView
        title={title}
        subtitle={subtitle}
        data={data}
        columns={columns}
        filters={filters}
        onPrint={onPrint}
      />
      
      <PDFGenerator
        title={title}
        subtitle={subtitle}
        data={data}
        columns={columns}
        filters={filters}
        onGenerate={onGeneratePDF}
        filename={filename}
      />
    </div>
  );
}
