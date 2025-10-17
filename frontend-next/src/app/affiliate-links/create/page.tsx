'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { campaignsAPI, affiliateLinksAPI } from '@/lib/api';
import { ArrowLeft, Link as LinkIcon, Copy, CheckCircle, QrCode } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  youtubeUrl: string;
  costPerView: number;
  status: string;
}

interface AffiliateLink {
  id: string;
  token: string;
  affiliateUrl: string;
}

export default function CreateAffiliateLinkPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<AffiliateLink | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Redirection si non authentifié
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadCampaigns();
  }, [isAuthenticated, router]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignsAPI.getAll();
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedCampaign) return;

    try {
      setCreating(true);
      const response = await affiliateLinksAPI.createForCampaign(selectedCampaign);

      const affiliateLinkData = response.data.affiliateLink;
      setCreatedLink({
        ...affiliateLinkData,
        affiliateUrl: `${window.location.origin}/r/${affiliateLinkData.token}`
      });
    } catch (error) {
      console.error('Erreur création lien:', error);
      alert('Erreur lors de la création du lien affilié');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
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
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Créer un lien affilié
                </h1>
                <p className="text-xs text-gray-500">Générez votre lien de partage</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!createdLink ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Créez votre lien d'affiliation
              </h2>
              <p className="text-lg text-gray-600">
                Sélectionnez une campagne et générez automatiquement votre lien de partage personnalisé
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📺 Sélectionnez votre campagne YouTube
                </label>
                <div className="space-y-3">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Aucune campagne disponible</p>
                      <button
                        onClick={() => router.push('/campaigns/create')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        Créer une campagne
                      </button>
                    </div>
                  ) : (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedCampaign === campaign.id
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                            <p className="text-sm text-gray-600 truncate">{campaign.youtubeUrl}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-green-600 font-medium">
                                ${campaign.costPerView}/vue
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                campaign.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                          </div>
                          {selectedCampaign === campaign.id && (
                            <CheckCircle className="h-6 w-6 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedCampaign && (
                <div className="text-center">
                  <button
                    onClick={handleCreateLink}
                    disabled={creating}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Génération en cours...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LinkIcon className="mr-3 h-6 w-6" />
                        🎯 Générer mon lien affilié
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="text-center mb-8">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Lien affilié créé avec succès !
              </h2>
              <p className="text-lg text-gray-600">
                Partagez ce lien pour commencer à gagner des commissions
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔗 Votre lien d'affiliation
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={createdLink.affiliateUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => copyToClipboard(createdLink.affiliateUrl)}
                    className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {copied ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <QrCode className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Code QR</h3>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">QR Code à implémenter</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Statistiques</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Clics</span>
                      <span className="font-semibold text-gray-900">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vues</span>
                      <span className="font-semibold text-gray-900">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Commissions</span>
                      <span className="font-semibold text-green-600">$0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  📊 Voir mon dashboard
                </button>
                <button
                  onClick={() => setCreatedLink(null)}
                  className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  ➕ Créer un autre lien
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}