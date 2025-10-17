'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { campaignsAPI } from '@/lib/api';
import { ArrowLeft, Video, DollarSign, Target, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateCampaignPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    costPerView: 0.01,
    maxViews: 1000
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirection si pas authentifié ou pas créateur
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  if (user?.role !== 'CREATOR') {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await campaignsAPI.create(formData);
      setSuccess(true);

      // Redirection après succès
      setTimeout(() => {
        router.push('/campaigns');
      }, 2000);

    } catch (error: unknown) {
      console.error('Erreur création campagne:', error);
      const err = error as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Erreur lors de la création de la campagne');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'costPerView' || name === 'maxViews' ? parseFloat(value) || 0 : value
    });
  };

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = extractVideoId(formData.youtubeUrl);
  const estimatedCost = formData.costPerView * formData.maxViews;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campagne créée !</h2>
          <p className="text-gray-600 mb-4">Votre campagne YouTube a été créée avec succès.</p>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">💰 100 Ar crédités pour votre première vue !</p>
          </div>
        </div>
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
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour au dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Mode: <span className="font-semibold text-green-600">Créateur</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            🎬 Créer une campagne YouTube
          </h1>
          <p className="text-gray-600 text-lg">
            Lancez votre campagne d&apos;affiliation et générez des vues organiques avec l&apos;aide de nos affiliés.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la campagne *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Ex: Ma nouvelle vidéo gaming"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Décrivez votre vidéo pour aider les affiliés..."
                  />
                </div>

                <div>
                  <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    URL YouTube *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Video className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="youtubeUrl"
                      name="youtubeUrl"
                      type="url"
                      required
                      value={formData.youtubeUrl}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  {videoId && (
                    <p className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      ID vidéo détecté: {videoId}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="costPerView" className="block text-sm font-medium text-gray-700 mb-2">
                      Coût par vue ($)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="costPerView"
                        name="costPerView"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1.00"
                        required
                        value={formData.costPerView}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="maxViews" className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif de vues *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Target className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="maxViews"
                        name="maxViews"
                        type="number"
                        min="100"
                        max="10000"
                        required
                        value={formData.maxViews}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !videoId}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création de la campagne...
                    </div>
                  ) : (
                    '🚀 Créer ma campagne'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Résumé et aperçu */}
          <div className="space-y-6">
            {/* Résumé des coûts */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Résumé des coûts</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coût par vue:</span>
                  <span className="font-semibold">${formData.costPerView.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Objectif de vues:</span>
                  <span className="font-semibold">{formData.maxViews.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Coût total estimé:</span>
                    <span className="font-bold text-blue-600">${estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu YouTube */}
            {videoId && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎥 Aperçu de la vidéo</h3>
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Cette vidéo sera présentée aux affiliés pour qu&apos;ils la partagent.
                </p>
              </div>
            )}

            {/* Informations importantes */}
            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ Informations importantes</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Les vues sont validées automatiquement après 30 secondes</li>
                <li>• 100 Ar sont crédités pour votre première vue</li>
                <li>• Les commissions sont payées automatiquement</li>
                <li>• La campagne s&apos;arrête automatiquement à l&apos;objectif atteint</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}