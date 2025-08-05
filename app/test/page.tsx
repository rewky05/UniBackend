'use client';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Page</h1>
      <p>If you can see this, the basic Next.js setup is working!</p>
      
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Firebase Connection Test</h2>
        <p>Your Firebase project: <strong>odyssey-test-db</strong></p>
        <p>Database URL: <strong>https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app</strong></p>
      </div>

      <div className="mt-4">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          → Go to Dashboard
        </a>
      </div>
      
      <div className="mt-2">
        <a href="/real-data-demo" className="text-blue-600 hover:underline">
          → View Your Real Data Demo
        </a>
      </div>
    </div>
  );
}