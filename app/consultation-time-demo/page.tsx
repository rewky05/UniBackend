'use client';

import { ConsultationTimeChart } from '@/components/ui/consultation-time-chart';

// Sample data based on the consultation time metrics from the image
const sampleConsultationData = [
  {
    id: '1',
    date: '2024-01-15',
    duration: 25,
    specialty: 'Cardiology',
    doctorName: 'Dr. Smith',
    patientName: 'John Doe',
    status: 'completed' as const,
  },
  {
    id: '2',
    date: '2024-01-16',
    duration: 11, // Shortest consultation
    specialty: 'General Medicine',
    doctorName: 'Dr. Johnson',
    patientName: 'Jane Smith',
    status: 'completed' as const,
  },
  {
    id: '3',
    date: '2024-01-17',
    duration: 43, // Longest consultation
    specialty: 'Neurology',
    doctorName: 'Dr. Williams',
    patientName: 'Bob Wilson',
    status: 'completed' as const,
  },
  {
    id: '4',
    date: '2024-01-18',
    duration: 28,
    specialty: 'Cardiology',
    doctorName: 'Dr. Smith',
    patientName: 'Alice Brown',
    status: 'completed' as const,
  },
  {
    id: '5',
    date: '2024-01-19',
    duration: 22,
    specialty: 'General Medicine',
    doctorName: 'Dr. Johnson',
    patientName: 'Charlie Davis',
    status: 'completed' as const,
  },
  {
    id: '6',
    date: '2024-01-20',
    duration: 35,
    specialty: 'Neurology',
    doctorName: 'Dr. Williams',
    patientName: 'Diana Evans',
    status: 'completed' as const,
  },
  {
    id: '7',
    date: '2024-01-21',
    duration: 18,
    specialty: 'Cardiology',
    doctorName: 'Dr. Smith',
    patientName: 'Frank Miller',
    status: 'completed' as const,
  },
  {
    id: '8',
    date: '2024-01-22',
    duration: 31,
    specialty: 'General Medicine',
    doctorName: 'Dr. Johnson',
    patientName: 'Grace Taylor',
    status: 'completed' as const,
  },
  {
    id: '9',
    date: '2024-01-23',
    duration: 26,
    specialty: 'Neurology',
    doctorName: 'Dr. Williams',
    patientName: 'Henry Anderson',
    status: 'completed' as const,
  },
  {
    id: '10',
    date: '2024-01-24',
    duration: 20,
    specialty: 'Cardiology',
    doctorName: 'Dr. Smith',
    patientName: 'Ivy Martinez',
    status: 'completed' as const,
  },
  // Add more data points for better chart visualization
  {
    id: '11',
    date: '2024-01-25',
    duration: 24,
    specialty: 'General Medicine',
    doctorName: 'Dr. Johnson',
    patientName: 'Jack Thompson',
    status: 'completed' as const,
  },
  {
    id: '12',
    date: '2024-01-26',
    duration: 29,
    specialty: 'Neurology',
    doctorName: 'Dr. Williams',
    patientName: 'Kate Garcia',
    status: 'completed' as const,
  },
  {
    id: '13',
    date: '2024-01-27',
    duration: 16,
    specialty: 'Cardiology',
    doctorName: 'Dr. Smith',
    patientName: 'Liam Rodriguez',
    status: 'completed' as const,
  },
  {
    id: '14',
    date: '2024-01-28',
    duration: 33,
    specialty: 'General Medicine',
    doctorName: 'Dr. Johnson',
    patientName: 'Mia Lewis',
    status: 'completed' as const,
  },
  {
    id: '15',
    date: '2024-01-29',
    duration: 27,
    specialty: 'Neurology',
    doctorName: 'Dr. Williams',
    patientName: 'Noah Lee',
    status: 'completed' as const,
  },
];

export default function ConsultationTimeDemoPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Consultation Time & Efficiency Chart
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive line chart showing consultation duration trends and efficiency metrics
        </p>
      </div>
      
      <ConsultationTimeChart 
        data={sampleConsultationData} 
        className="w-full"
      />
      
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Chart Features:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Line Chart:</strong> Shows average consultation duration over time</li>
          <li>• <strong>Target Line:</strong> Reference line at 25 minutes (industry standard)</li>
          <li>• <strong>Interactive Controls:</strong> Filter by time range, grouping, and specialty</li>
          <li>• <strong>Summary Stats:</strong> Average, shortest, longest, efficiency score, and specialty averages</li>
          <li>• <strong>Responsive Design:</strong> Adapts to different screen sizes</li>
          <li>• <strong>Dark Mode Support:</strong> Fully compatible with dark/light themes</li>
        </ul>
      </div>
    </div>
  );
}
