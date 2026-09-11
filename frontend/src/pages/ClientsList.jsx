import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineDocumentText,
  HiOutlineUsers,
} from 'react-icons/hi';
import api from '../api/axios';

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  country: 'Ethiopia',
};

export default function ClientsList() {
  const navigate = useNavigate();

  // Data states
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasPagination, setHasPagination] = useState({ next: false, previous: false });
  const pageSize = 10;

  // Add Client Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch clients from API
  const fetchClients = useCallback(async (search = searchQuery, pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) {
        params.search = search.trim();
      }
      if (pageNum > 1) {
        params.page = pageNum;
      }

      const response = await api.get('/clients/', { params });

      if (response.data && Array.isArray(response.data.results)) {
        setClients(response.data.results);
        setTotalCount(response.data.count || 0);
        setHasPagination({
          next: Boolean(response.data.next),
          previous: Boolean(response.data.previous),
        });
      } else if (Array.isArray(response.data)) {
        setClients(response.data);
        setTotalCount(response.data.length);
        setHasPagination({ next: false, previous: false });
      } else {
        setClients([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      const msg = err.response?.data?.detail || 'Failed to load clients. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(searchQuery, 1);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchClients(searchQuery, newPage);
  };

  // Modal input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Open modal
  const openAddModal = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Close modal
  const closeAddModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setFormData(initialFormData);
    setFormErrors({});
  };

  // Handle create client form submission
  const handleCreateClient = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Client name is required.' });
      toast.error('Client name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim() || 'Ethiopia',
      };

      const response = await api.post('/clients/', payload);
      toast.success('Client added successfully!');
      closeAddModal();

      // Refresh client list
      fetchClients(searchQuery, page);
      
      // Optionally redirect directly to client detail
      if (response.data?.id) {
        navigate(`/clients/${response.data.id}`);
      }
    } catch (err) {
      console.error('Error creating client:', err);
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        const errorMessages = Object.entries(serverErrors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        setFormErrors(serverErrors);
        toast.error(errorMessages || 'Failed to create client');
      } else {
        toast.error('Failed to create client. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
            {!loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {totalCount} {totalCount === 1 ? 'client' : 'clients'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your client accounts, view billing histories, and keep contact records up to date.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <HiOutlineSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, email, phone..."
            className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="text-xs text-gray-500 flex items-center gap-2 self-start sm:self-center">
            <span>
              Searching for <strong className="text-gray-700">"{searchQuery}"</strong>
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline font-medium"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-8">
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-gray-600">Loading clients...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <HiOutlineUsers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Failed to load clients</h3>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => fetchClients(searchQuery, page)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineUsers className="w-8 h-8" />
          </div>
          {searchQuery ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No matching clients found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                No clients match your search term <span className="font-semibold text-gray-700">"{searchQuery}"</span>. Try adjusting your query or clear the filter.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Search
                </button>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  Add New Client
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No clients yet. Add your first client!</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Keep track of all your customer contacts, invoice records, and billing activity in one place.
              </p>
              <button
                onClick={openAddModal}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
              >
                <HiOutlinePlus className="w-5 h-5" />
                Add Your First Client
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 divide-y divide-gray-200">
              <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Company</th>
                  <th scope="col" className="px-6 py-4">Email</th>
                  <th scope="col" className="px-6 py-4">Phone</th>
                  <th scope="col" className="px-6 py-4 text-center">Invoices</th>
                  <th scope="col" className="px-6 py-4 text-right">Total Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {clients.map((client) => {
                  const initial = (client.name || 'C').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {initial}
                          </div>
                          <div>
                            <Link
                              to={`/clients/${client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors block"
                            >
                              {client.name}
                            </Link>
                            {client.city && (
                              <span className="text-xs text-gray-400">
                                {client.city}{client.country ? `, ${client.country}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {client.company ? (
                          <div className="flex items-center gap-1.5">
                            <HiOutlineOfficeBuilding className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{client.company}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {client.email ? (
                          <div className="flex items-center gap-1.5">
                            <HiOutlineMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <a
                              href={`mailto:${client.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {client.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {client.phone ? (
                          <div className="flex items-center gap-1.5">
                            <HiOutlinePhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <a
                              href={`tel:${client.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-blue-600"
                            >
                              {client.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Invoices */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {client.invoice_count ?? 0}
                        </span>
                      </td>

                      {/* Total Billed */}
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                        {formatCurrency(client.total_billed)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {(totalCount > pageSize || page > 1) && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
              <div className="text-xs text-gray-500">
                Showing{' '}
                <span className="font-medium text-gray-700">
                  {Math.min((page - 1) * pageSize + 1, totalCount)}
                </span>{' '}
                to{' '}
                <span className="font-medium text-gray-700">
                  {Math.min(page * pageSize, totalCount)}
                </span>{' '}
                of <span className="font-medium text-gray-700">{totalCount}</span> clients
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <HiOutlineChevronDoubleLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs text-gray-600 px-2">
                  Page <strong className="text-gray-900">{page}</strong> of{' '}
                  <strong className="text-gray-900">{totalPages}</strong>
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || !hasPagination.next}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Next</span>
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page >= totalPages}
                  className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <HiOutlineChevronDoubleRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeAddModal}
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 sm:p-8 overflow-hidden z-10 transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enter the client and organization details below.
                  </p>
                </div>
                <button
                  onClick={closeAddModal}
                  disabled={submitting}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateClient} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="client-name" className="block text-xs font-semibold text-gray-700 mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <HiOutlineUser className="w-4 h-4" />
                    </div>
                    <input
                      id="client-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe or Acme Corp"
                      className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
                        formErrors.name
                          ? 'border-red-400 focus:ring-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="client-company" className="block text-xs font-semibold text-gray-700 mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <HiOutlineOfficeBuilding className="w-4 h-4" />
                    </div>
                    <input
                      id="client-company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Technologies Inc."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="client-email" className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <HiOutlineMail className="w-4 h-4" />
                      </div>
                      <input
                        id="client-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="billing@example.com"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
                          formErrors.email
                            ? 'border-red-400 focus:ring-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="client-phone" className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <HiOutlinePhone className="w-4 h-4" />
                      </div>
                      <input
                        id="client-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+251 91 123 4567"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label htmlFor="client-address" className="block text-xs font-semibold text-gray-700 mb-1">
                    Street Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 pointer-events-none text-gray-400">
                      <HiOutlineLocationMarker className="w-4 h-4" />
                    </div>
                    <textarea
                      id="client-address"
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g. Bole Subcity, Suite 402"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* City and Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="client-city" className="block text-xs font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      id="client-city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Addis Ababa"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="client-country" className="block text-xs font-semibold text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      id="client-country"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="e.g. Ethiopia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Create Client</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
