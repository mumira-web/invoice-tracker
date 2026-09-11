import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import api from '../api/axios';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  } catch {
    return dateStr;
  }
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data states
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [clientError, setClientError] = useState(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch client details
  const fetchClient = useCallback(async () => {
    setLoadingClient(true);
    setClientError(null);
    try {
      const response = await api.get(`/clients/${id}/`);
      setClient(response.data);
      setEditFormData({
        name: response.data.name || '',
        company: response.data.company || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        country: response.data.country || 'Ethiopia',
      });
    } catch (err) {
      console.error('Error fetching client details:', err);
      const msg = err.response?.data?.detail || 'Failed to load client details.';
      setClientError(msg);
      toast.error(msg);
    } finally {
      setLoadingClient(false);
    }
  }, [id]);

  // Fetch client invoices
  const fetchClientInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const response = await api.get('/invoices/', {
        params: { client: id },
      });

      if (response.data && Array.isArray(response.data.results)) {
        setInvoices(response.data.results);
      } else if (Array.isArray(response.data)) {
        setInvoices(response.data);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching client invoices:', err);
      // Non-blocking error for invoices
    } finally {
      setLoadingInvoices(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchClient();
      fetchClientInvoices();
    }
  }, [id, fetchClient, fetchClientInvoices]);

  // Handle edit form inputs
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Start editing
  const startEditing = () => {
    if (!client) return;
    setEditFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || 'Ethiopia',
    });
    setEditErrors({});
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditErrors({});
    if (client) {
      setEditFormData({
        name: client.name || '',
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || 'Ethiopia',
      });
    }
  };

  // Save edited client
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editFormData.name.trim()) {
      setEditErrors({ name: 'Client name is required.' });
      toast.error('Client name is required.');
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        name: editFormData.name.trim(),
        company: editFormData.company.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        address: editFormData.address.trim(),
        city: editFormData.city.trim(),
        country: editFormData.country.trim() || 'Ethiopia',
      };

      const response = await api.put(`/clients/${id}/`, payload);
      setClient(response.data);
      setIsEditing(false);
      toast.success('Client updated successfully!');
    } catch (err) {
      console.error('Error updating client:', err);
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        setEditErrors(serverErrors);
        const errorMessages = Object.entries(serverErrors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(errorMessages || 'Failed to update client.');
      } else {
        toast.error('Failed to update client. Please try again.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle client deletion
  const handleDeleteClient = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${id}/`);
      toast.success('Client deleted successfully');
      navigate('/clients');
    } catch (err) {
      console.error('Error deleting client:', err);
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to delete client.';
      toast.error(msg);
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Full page loading state
  if (loadingClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-gray-500">Loading client details...</p>
      </div>
    );
  }

  // Error loading client
  if (clientError || !client) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HiOutlineExclamation className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Client Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">
          {clientError || 'The client you are looking for does not exist or has been removed.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/clients"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition-colors"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <button
            onClick={fetchClient}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const initial = (client.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors group"
        >
          <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Clients</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
            >
              <HiOutlinePencilAlt className="w-4 h-4 text-gray-500" />
              <span>Edit Client</span>
            </button>
          )}

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 shadow-sm transition-colors"
          >
            <HiOutlineTrash className="w-4 h-4 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Client Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isEditing ? (
          /* Inline Editing Form */
          <form onSubmit={handleSaveEdit} className="p-6 sm:p-8">
            <div className="border-b border-gray-100 pb-4 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Client Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update personal and business information for this client.
                </p>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Editing Mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    editErrors.name
                      ? 'border-red-400 focus:ring-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {editErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{editErrors.name}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  value={editFormData.company}
                  onChange={handleEditChange}
                  placeholder="e.g. Acme Inc."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  placeholder="billing@example.com"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    editErrors.email
                      ? 'border-red-400 focus:ring-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {editErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{editErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  placeholder="+251 91 123 4567"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={editFormData.address}
                  onChange={handleEditChange}
                  placeholder="Street name, suite or building info"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={editFormData.city}
                  onChange={handleEditChange}
                  placeholder="e.g. Addis Ababa"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={editFormData.country}
                  onChange={handleEditChange}
                  placeholder="e.g. Ethiopia"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={savingEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
              >
                {savingEdit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
                  {initial}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                  {client.company && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                      <HiOutlineOfficeBuilding className="w-4 h-4 text-gray-400" />
                      <span>{client.company}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    <span>Client since {formatDate(client.created_at)}</span>
                  </p>
                </div>
              </div>

              {/* Summary Stats Badges */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200/80 self-start lg:self-center">
                <div className="pr-4 border-r border-gray-200">
                  <span className="block text-xs font-medium text-gray-500">Invoices</span>
                  <span className="text-lg font-bold text-gray-900">
                    {client.invoice_count ?? invoices.length}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500">Total Billed</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(client.total_billed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact & Location Info Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              {/* Email */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <HiOutlineMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="text-blue-600 hover:underline truncate"
                      title={client.email}
                    >
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Not provided</span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Phone
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <HiOutlinePhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="hover:text-blue-600"
                    >
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Not provided</span>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Address
                </span>
                <div className="flex items-start gap-2 text-sm text-gray-800">
                  <HiOutlineLocationMarker className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {client.address ? (
                      <p className="line-clamp-2">{client.address}</p>
                    ) : (
                      <span className="text-gray-400 italic">No street address</span>
                    )}
                  </div>
                </div>
              </div>

              {/* City & Country */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Location
                </span>
                <p className="text-sm text-gray-800">
                  {client.city && client.country
                    ? `${client.city}, ${client.country}`
                    : client.city || client.country || (
                        <span className="text-gray-400 italic">Not specified</span>
                      )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              {invoices.length}
            </span>
          </div>

          <Link
            to={`/invoices/new?client=${client.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>

        {/* Invoices Table / Empty State */}
        {loadingInvoices ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3 font-medium">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineDocumentText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No invoices yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              There are no invoices recorded for {client.name} yet. Create the first one now!
            </p>
            <Link
              to={`/invoices/new?client=${client.id}`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 divide-y divide-gray-200">
                <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Invoice #</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Total</th>
                    <th scope="col" className="px-6 py-4">Due Date</th>
                    <th scope="col" className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Invoice Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/invoices/${inv.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5"
                        >
                          <HiOutlineDocumentText className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                          <span>{inv.invoice_number || `INV-${inv.id}`}</span>
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {formatCurrency(inv.total)}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {formatDate(inv.due_date)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/invoices/${inv.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>View</span>
                          <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !deleting && setIsDeleteModalOpen(false)}
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 overflow-hidden z-10">
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <HiOutlineTrash className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Client</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete{' '}
                <strong className="text-gray-900 font-semibold">{client.name}</strong>?
                All associated records and billing information may also be affected.
              </p>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClient}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Client</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
