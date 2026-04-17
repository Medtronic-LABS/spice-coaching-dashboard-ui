import { BarChart } from '@/components/common/charts/BarChart';
import { LineChart } from '@/components/common/charts/LineChart';
import { PieChart } from '@/components/common/charts/PieChart';
import { PageTitle } from '@/components/common/PageTitle';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';

const mockChartData = [
  { month: 'Jan', completions: 40, activeUsers: 24 },
  { month: 'Feb', completions: 30, activeUsers: 13 },
  { month: 'Mar', completions: 20, activeUsers: 98 },
  { month: 'Apr', completions: 27, activeUsers: 39 },
  { month: 'May', completions: 18, activeUsers: 48 },
  { month: 'Jun', completions: 23, activeUsers: 38 },
  { month: 'Jul', completions: 34, activeUsers: 43 },
];

const mockPieData = [
  { name: 'Completed', value: 400 },
  { name: 'In Progress', value: 200 },
  { name: 'Not Started', value: 300 },
  { name: 'Overdue', value: 100 },
];

const mockTableData = [
  {
    id: 1,
    module: 'Introduction to Compliance',
    score: 95,
    date: '2023-10-01',
  },
  { id: 2, module: 'Advanced Data Security', score: 88, date: '2023-10-05' },
  { id: 3, module: 'Workplace Ethics', score: 100, date: '2023-10-12' },
  { id: 4, module: 'Health & Safety Policies', score: 72, date: '2023-10-15' },
];

type TableRow = (typeof mockTableData)[number];

const tableColumns: Array<ColumnDef<TableRow>> = [
  { key: 'module', header: 'Module Name' },
  {
    key: 'score',
    header: 'Score',
    render: (row) => (
      <span
        className={`font-semibold ${
          row.score >= 90
            ? 'text-green-600'
            : row.score >= 80
              ? 'text-yellow-600'
              : 'text-red-600'
        }`}
      >
        {row.score}%
      </span>
    ),
  },
  { key: 'date', header: 'Completion Date' },
];

export function ChartPreview() {
  return (
    <section>
      <div className="space-y-3">
        <PageTitle title="Dashboard" />
        <p className="text-sm text-slate-700">
          Welcome to the Micro Learning Analytics Dashboard. Below are some
          example generic components populated with mock data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <PageTitle
            as="h3"
            title="Engagement Chart (BarChart)"
            className="text-lg text-slate-800 mb-4"
          />
          <BarChart
            data={mockChartData}
            xAxisKey="month"
            series={[
              { key: 'completions', color: '#3b82f6', label: 'Completions' },
              { key: 'activeUsers', color: '#10b981', label: 'Active Users' },
            ]}
            ariaLabel="Engagement by month (bar chart)"
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <PageTitle
            as="h3"
            title="Recent Modules (Table)"
            className="text-lg text-slate-800 mb-4"
          />
          <Table
            data={mockTableData}
            columns={tableColumns}
            keyExtractor={(row) => row.id}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <PageTitle
            as="h3"
            title="Trend Over Time (LineChart)"
            className="text-lg text-slate-800 mb-4"
          />
          <LineChart
            data={mockChartData}
            xAxisKey="month"
            series={[
              { key: 'completions', color: '#f59e0b', label: 'Completions' },
              { key: 'activeUsers', color: '#8b5cf6', label: 'Active Users' },
            ]}
            ariaLabel="Engagement trend by month (line chart)"
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <PageTitle
            as="h3"
            title="Status Distribution (PieChart)"
            className="text-lg text-slate-800 mb-4"
          />
          <PieChart
            data={mockPieData}
            valueKey="value"
            nameKey="name"
            ariaLabel="Module status distribution (pie chart)"
          />
        </div>
      </div>
    </section>
  );
}
