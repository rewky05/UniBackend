"use client";

import { ReportActions } from "@/components/ui/report-actions";

const testData = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    status: "Active",
    date: "2024-01-15"
  },
  {
    id: "2", 
    name: "Jane Smith",
    email: "jane@example.com",
    status: "Inactive",
    date: "2024-01-16"
  },
  {
    id: "3",
    name: "Bob Johnson", 
    email: "bob@example.com",
    status: "Active",
    date: "2024-01-17"
  }
];

const testColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' }
];

const testFilters = [
  { label: 'Status', value: 'All' },
  { label: 'Date Range', value: 'Last 30 days' }
];

export default function TestPDFPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">PDF Generation Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Test Report</h2>
        
        <ReportActions
          title="Test Report"
          subtitle="Sample data for testing PDF generation"
          data={testData}
          columns={testColumns}
          filters={testFilters}
          filename="test_report.pdf"
        />
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Test Data:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm">{JSON.stringify(testData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
