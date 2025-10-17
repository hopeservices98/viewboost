'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Type pour les statistiques utilisateur (optionnel)
interface UserStats {
  affiliateLinks: number;
  commissions: number;
  referrals: number;
  campaigns: number;
}

// Props du composant ProfileBadge
interface ProfileBadgeProps {
  className?: string; // Classes CSS additionnelles pour personnalisation
}

/**
 * Composant ProfileBadge - Badge de profil utilisateur avec dropdown
 *
 * Fonctionnalités :
 * - Affiche la première lettre du nom d'utilisateur dans un cercle dégradé
 * - Dropdown avec informations utilisateur au clic
 * - Bouton de déconnexion
 * - Récupération dynamique des données via AuthProvider
 * - Responsive et réutilisable
 */
const ProfileBadge: React.FC<ProfileBadgeProps> = ({ className = '' }) => {
  // Hooks React pour la gestion d'état et navigation
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Récupération des données utilisateur depuis le contexte d'authentification
  const { user, logout } = useAuth();

  /**
   * Gestionnaire de clic sur le badge
   * Bascule l'état du dropdown
   */
  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  /**
   * Gestionnaire de déconnexion
   * Supprime le JWT et redirige vers la page de connexion
   */
  const handleLogout = () => {
    logout(); // Supprime le token du localStorage via AuthProvider
    setIsDropdownOpen(false); // Ferme le dropdown
    router.push('/auth/login'); // Redirection vers la page de connexion
  };

  /**
   * Fermeture du dropdown lors d'un clic à l'extérieur
   * Utilise useEffect pour ajouter/retirer l'écouteur d'événements
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  /**
   * Fonction utilitaire pour obtenir la première lettre du nom d'utilisateur
   * Retourne '?' si aucun utilisateur n'est connecté
   */
  const getInitial = (): string => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  /**
   * Fonction utilitaire pour formater le rôle en français
   */
  const formatRole = (role: string): string => {
    switch (role) {
      case 'CREATOR':
        return 'Créateur';
      case 'AFFILIATE':
        return 'Affilié';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return role;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Badge principal - Cercle avec dégradé et lettre */}
      <button
        onClick={handleBadgeClick}
        className="
          h-8 w-8 rounded-full
          bg-gradient-to-r from-blue-500 to-purple-500
          flex items-center justify-center
          text-xs font-bold text-white
          shadow-md hover:shadow-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          cursor-pointer
        "
        aria-label="Menu profil utilisateur"
        type="button"
      >
        {getInitial()}
      </button>

      {/* Dropdown menu - Apparaît au clic */}
      {isDropdownOpen && (
        <div className="
          absolute right-0 mt-2 w-64
          bg-white rounded-lg shadow-xl
          border border-gray-200
          z-50
          animate-in slide-in-from-top-2 duration-200
        ">
          {/* Contenu du dropdown */}
          <div className="p-4">
            {/* Informations utilisateur */}
            <div className="space-y-3">
              {/* Nom complet */}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.username || 'Utilisateur inconnu'}
                </p>
              </div>

              {/* Email */}
              <div>
                <p className="text-xs text-gray-500">
                  {user?.email || 'Email non disponible'}
                </p>
              </div>

              {/* Rôle */}
              <div>
                <span className="
                  inline-flex items-center px-2.5 py-0.5
                  rounded-full text-xs font-medium
                  bg-blue-100 text-blue-800
                ">
                  {formatRole(user?.role || 'UNKNOWN')}
                </span>
              </div>

              {/* Statistiques supplémentaires si disponibles */}
              {(user as any)?._count && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">{(user as any)._count.affiliateLinks}</span>
                      <span className="ml-1">liens</span>
                    </div>
                    <div>
                      <span className="font-medium">{(user as any)._count.commissions}</span>
                      <span className="ml-1">commissions</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de déconnexion */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="
                  w-full px-3 py-2
                  text-sm font-medium text-red-600
                  bg-red-50 hover:bg-red-100
                  rounded-md
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                "
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBadge;