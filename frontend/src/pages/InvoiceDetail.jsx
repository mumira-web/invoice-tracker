import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';
import toast from 'react-hot-toast';
import { HiDownload, HiPaperAirplane, HiPencil, HiTrash, HiX, HiCurrencyDollar } from 'react-icons/hi';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}/`);
      setInvoice(response.data);
      setPaymentForm(prev => ({ ...prev, amount: response.data.amount_due }));
    } catch (error) {
      toast.error('Failed to fetch invoice details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleSend = async () => {
    try {
      await api.post(`/invoices/${id}/send/`);
      toast.success('Invoice sent successfully');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      try {
        await api.post(`/invoices/${id}/cancel/`);
        toast.success('Invoice cancelled');
        fetchInvoice();
      } catch (error) {
        toast.error('Failed to cancel invoice');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}/`);
        toast.success('Invoice deleted');
        navigate('/invoices');
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      await api.post(`/invoices/${id}/payments/`, paymentForm);
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading invoice details...</div>;
  if (!invoice) return <div className="p-4 text-center text-gray-500">Invoice not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Invoice #{invoice.invoice_number}</h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <HiDownload className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Download PDF
          </button>
          
          {invoice.status === 'draft' && (
            <>
              <button
                onClick={handleSend}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <HiPaperAirplane className="-ml-1 mr-2 h-5 w-5" />
                Send Invoice
              </button>
              <Link
                to={`/invoices/${id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <HiPencil className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
              >
                <HiTrash className="-ml-1 mr-2 h-5 w-5" />
                Delete
              </button>
            </>
          )}

          {['sent', 'partial', 'overdue'].includes(invoice.status) && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <HiCurrencyDollar className="-ml-1 mr-2 h-5 w-5" />
              Record Payment
            </button>
          )}

          {!['paid', 'cancelled'].includes(invoice.status) && invoice.status !== 'draft' && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <HiX className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Billed To</h3>
              <div className="text-sm text-gray-500">
                <p className="font-semibold text-gray-900">{invoice.client_name}</p>
                {/* Add more client details if returned by API */}
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm text-gray-500 space-y-1">
                <p><span className="font-medium text-gray-900">Issue Date:</span> {invoice.issue_date}</p>
                <p><span className="font-medium text-gray-900">Due Date:</span> {invoice.due_date}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Description</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Qty</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                      <th className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{item.description}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 text-right">{item.quantity}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 text-right">${Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-4 pl-3 pr-4 text-sm text-gray-900 text-right sm:pr-6">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                <span className="text-gray-900">${Number(invoice.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-gray-900">-${Number(invoice.discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-medium border-t border-gray-200 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${Number(invoice.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="text-green-600">${Number(invoice.amount_paid).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium border-t border-gray-200 pt-3">
                <span className="text-gray-900">Amount Due</span>
                <span className="text-indigo-600">${Number(invoice.amount_due).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-500 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {invoice.payments?.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Payment History</h4>
              <ul className="divide-y divide-gray-200">
                {invoice.payments.map((payment, idx) => (
                  <li key={idx} className="py-3 flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{payment.payment_date}</p>
                      <p className="text-gray-500 capitalize">{payment.method.replace('_', ' ')}</p>
                    </div>
                    <p className="font-medium text-green-600">+${Number(payment.amount).toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsPaymentModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Record Payment</h3>
                <div className="mt-4">
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Method</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="check">Check</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      />
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:col-start-2 sm:text-sm disabled:opacity-50"
                      >
                        {submittingPayment ? 'Saving...' : 'Record Payment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
