'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { payoutsAPI } from '@/lib/api';
import { ArrowLeft, DollarSign, CreditCard, Building, Bitcoin, CheckCircle, AlertCircle } from 'lucide-react';

interface PayoutMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  fields: string[];
}

export default function RequestPayoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    method: '',
    paypalEmail: '',
    bankDetails: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const payoutMethods: PayoutMethod[] = [
    {
      id: 'PAYPAL',
      name: 'PayPal',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Transfert rapide et sécurisé',
      fields: ['paypalEmail']
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Virement bancaire',
      icon: <Building className="h-6 w-6" />,
      description: 'Transfert bancaire traditionnel',
      fields: ['bankDetails']
    },
    {
      id: 'CRYPTO',
      name: 'Cryptomonnaie',
      icon: <Bitcoin className="h-6 w-6" />,
      description: 'Paiement en crypto (BTC, ETH)',
      fields: ['bankDetails']
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // In a real app, you'd get this from the user context or API
      setBalance(user?.balance || 0);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Montant invalide';
    } else if (amount > balance) {
      newErrors.amount = 'Montant supérieur au solde disponible';
    } else if (amount < 10) {
      newErrors.amount = 'Montant minimum: 10$';
    }

    if (!formData.method) {
      newErrors.method = 'Sélectionnez une méthode de paiement';
    }

    const selectedMethod = payoutMethods.find(m => m.id === formData.method);
    if (selectedMethod?.id === 'PAYPAL' && !formData.paypalEmail) {
      newErrors.paypalEmail = 'Email PayPal requis';
    }
    if (selectedMethod?.id === 'BANK_TRANSFER' && !formData.bankDetails) {
      newErrors.bankDetails = 'Informations bancaires requises';
    }
    if (selectedMethod?.id === 'CRYPTO' && !formData.bankDetails) {
      newErrors.bankDetails = 'Adresse crypto requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payoutData = {
        amount: parseFloat(formData.amount),
        method: formData.method as 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO',
        paypalEmail: formData.method === 'PAYPAL' ? formData.paypalEmail : undefined,
        bankDetails: formData.method !== 'PAYPAL' ? formData.bankDetails : undefined,
      };

      await payoutsAPI.requestPayout(payoutData);

      // Update local balance
      setBalance(prev => prev - parseFloat(formData.amount));

      alert('Demande de paiement envoyée avec succès !');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erreur demande paiement:', error);
      alert(error.response?.data?.error || 'Erreur lors de la demande de paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Retour au dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Demander un paiement
                </h1>
                <p className="text-xs text-gray-500">Retirez vos gains</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Overview */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Solde disponible</h2>
                <p className="text-green-100 text-lg">
                  Montant que vous pouvez retirer immédiatement
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
                <p className="text-green-100">Minimum: $10.00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Request Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              💰 Demander un paiement
            </h2>
            <p className="text-lg text-gray-600">
              Choisissez votre méthode de paiement préférée et retirez vos gains
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                💵 Montant à retirer
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="10.00"
                  min="10"
                  max={balance}
                  step="0.01"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
                <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.amount && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🏦 Méthode de paiement
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {payoutMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setFormData({ ...formData, method: method.id })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      formData.method === method.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="text-blue-600 mr-3">{method.icon}</div>
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                ))}
              </div>
              {errors.method && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.method}
                </p>
              )}
            </div>

            {/* Dynamic Fields Based on Method */}
            {formData.method === 'PAYPAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📧 Email PayPal
                </label>
                <input
                  type="email"
                  name="paypalEmail"
                  value={formData.paypalEmail}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
                {errors.paypalEmail && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.paypalEmail}
                  </p>
                )}
              </div>
            )}

            {(formData.method === 'BANK_TRANSFER' || formData.method === 'CRYPTO') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {formData.method === 'BANK_TRANSFER' ? '🏦 Informations bancaires' : '₿ Adresse crypto'}
                </label>
                <textarea
                  name="bankDetails"
                  value={formData.bankDetails}
                  onChange={handleChange}
                  placeholder={
                    formData.method === 'BANK_TRANSFER'
                      ? "IBAN: FR...\nTitulaire: Votre nom\nBanque: Nom de la banque"
                      : "Adresse BTC/ETH: 0x..."
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
                {errors.bankDetails && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.bankDetails}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting || balance < 10}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="mr-3 h-6 w-6" />
                    📤 Soumettre la demande de paiement
                  </div>
                )}
              </button>
            </div>

            {/* Info Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations importantes</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Le traitement peut prendre 1-3 jours ouvrés</li>
                    <li>• Frais de transaction selon la méthode choisie</li>
                    <li>• Montant minimum: 10$</li>
                    <li>• Vérifiez vos informations avant soumission</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}