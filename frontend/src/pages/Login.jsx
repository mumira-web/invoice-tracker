import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiArrowRight,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password) {
      toast.error('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      await login(formData.username.trim(), formData.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const errorData = err?.response?.data;
      let errorMessage = 'Failed to sign in. Please verify your credentials.';

      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(' ')
            : errorData.non_field_errors;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
            <HiOutlineDocumentText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            <span className="text-blue-500">Invoice</span>Hub
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your invoices and business clients
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-200"
              >
                Username
              </label>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <HiOutlineUser className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. johndoe"
                  className="block w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <HiOutlineLockClosed className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="block w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-11 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <HiArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer link to Register */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
            <span>Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors focus:outline-none underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Small copyright / tag */}
        <p className="mt-6 text-center text-xs text-slate-500">
          InvoiceHub &copy; {new Date().getFullYear()} &bull; Professional Invoicing Platform
        </p>
      </div>
    </div>
  );
}
