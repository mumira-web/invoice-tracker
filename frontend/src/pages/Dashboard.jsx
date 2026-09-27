import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineUsers,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Determine user display name for welcome header
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.business_name || user?.username || 'there';

  // Format monthly revenue data for Recharts BarChart
  const chartData = MONTH_NAMES.map((name, index) => {
    const monthNum = index + 1;
    const found = data?.monthly_revenue?.find(
      (item) => Number(item.month) === monthNum || item.month === name
    );
    return {
      name,
      revenue: found ? Number(found.revenue) || 0 : 0,
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto mt-12">
        <p className="text-gray-600 mb-4">Unable to load dashboard information.</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {displayName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's an overview of your business activity and performance.
          </p>
        </div>
        <div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            Create Invoice
          </Link>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`${Number(data.total_revenue || 0).toLocaleString()} ETB`}
          icon={HiOutlineCash}
          color="green"
        />
        <StatsCard
          title="Outstanding"
          value={`${Number(data.outstanding || 0).toLocaleString()} ETB`}
          icon={HiOutlineClock}
          color="yellow"
        />
        <StatsCard
          title="Overdue"
          value={data.overdue_count ?? 0}
          subtitle="Invoices overdue"
          icon={HiOutlineExclamation}
          color="red"
        />
        <StatsCard
          title="Total Clients"
          value={data.total_clients ?? 0}
          icon={HiOutlineUsers}
          color="blue"
        />
      </div>

      {/* 3. Monthly Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monthly revenue breakdown for the current year</p>
          </div>
        </div>
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => `${Number(value).toLocaleString()}`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()} ETB`, 'Revenue']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '0.875rem',
                }}
              />
              <Bar
                dataKey="revenue"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <Link
            to="/invoices"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3">Invoice #</th>
                <th scope="col" className="px-6 py-3">Client</th>
                <th scope="col" className="px-6 py-3">Amount</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recent_invoices && data.recent_invoices.length > 0 ? (
                data.recent_invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {invoice.client_name || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {Number(invoice.total || 0).toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(invoice.due_date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No recent invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
