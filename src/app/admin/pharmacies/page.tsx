"use client";

import React, { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Pharmacy {
  id: string;
  pharmacy_name: string;
  code_ps: string;
  email: string;
  pharmacy_status: 'pending' | 'active' | 'suspended' | 'rejected';
  created_at: string;
  is_admin: boolean;
  full_name?: string;
  phone_number?: string;
  pharmacy_address?: string;
}

interface PharmacyFormData {
  email: string;
  password: string;
  full_name: string;
  pharmacy_name: string;
  pharmacy_address: string;
  code_ps: string;
  phone_number: string;
  virtual_key: string;
}

interface EditPharmacyData {
  id: string;
  full_name: string;
  pharmacy_name: string;
  pharmacy_address: string;
  code_ps: string;
  phone_number: string;
  email: string;
  virtual_key: string;
}

// Helper pour générer un mot de passe temporaire sécurisé
function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // États pour la création de pharmacie
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState<PharmacyFormData>({
    email: '',
    password: '',
    full_name: '',
    pharmacy_name: '',
    pharmacy_address: '',
    code_ps: '',
    phone_number: '',
    virtual_key: '',
  });

  // États pour l'édition de pharmacie
  const [showEditForm, setShowEditForm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState<EditPharmacyData | null>(null);
  const [virtualKeys, setVirtualKeys] = useState<Record<string, string>>({});

  // Fonction pour générer une clé virtuelle
  const generateVirtualKey = (codePs: string): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `sk-${codePs}-${timestamp}-${randomSuffix}`;
  };

  // Fonction pour auto-générer la clé virtuelle basée sur le code PS
  const handleCodePsChange = (value: string) => {
    setFormData({
      ...formData,
      code_ps: value,
      virtual_key: value ? generateVirtualKey(value) : ''
    });
  };

  const fetchPharmacies = async () => {
    console.log('[AdminPharmacies] Starting fetchPharmacies...');
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      console.log('[AdminPharmacies] Getting session...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('[AdminPharmacies] No session found');
        throw new Error('Non authentifié');
      }

      console.log('[AdminPharmacies] Session found, making API call...');
      const response = await fetch('/api/admin/pharmacies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('[AdminPharmacies] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AdminPharmacies] API error:', errorText);
        throw new Error(`Erreur lors de la récupération des pharmacies: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[AdminPharmacies] API data received:', data);
      setPharmacies(data);
    } catch (err) {
      console.error('[AdminPharmacies] Error in fetchPharmacies:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPharmacies([]);
    } finally {
      console.log('[AdminPharmacies] fetchPharmacies completed');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[AdminPharmacies] useEffect triggered, calling fetchPharmacies');
    fetchPharmacies();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'active' | 'suspended' | 'rejected') => {
    setActionLoading(id + newStatus);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/admin/pharmacies', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          pharmacy_status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast.success(`Statut mis à jour vers "${newStatus}"`);
      await fetchPharmacies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/admin/pharmacies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const result = await response.json();
      toast.success(result.message);
      // Afficher le mot de passe temporaire s'il est retourné
      if (result.temp_password) {
        toast(
          <div>
            <div className="font-semibold mb-1">Mot de passe temporaire généré :</div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm select-all">{result.temp_password}</span>
              <button
                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  navigator.clipboard.writeText(result.temp_password);
                  toast.success('Mot de passe copié !');
                }}
              >
                Copier
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">Transmettez ce mot de passe à la pharmacie. Il pourra être changé après connexion.</div>
          </div>,
          { duration: 15000 }
        );
      }
      // Réinitialiser le formulaire
      setFormData({
        email: '',
        password: '',
        full_name: '',
        pharmacy_name: '',
        pharmacy_address: '',
        code_ps: '',
        phone_number: '',
        virtual_key: '',
      });
      setShowCreateForm(false);
      await fetchPharmacies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreateLoading(false);
    }
  };

  const [editInProgress, setEditInProgress] = useState(false);

  const handleEditPharmacy = async (pharmacy: Pharmacy) => {
    if (editInProgress) {
      console.log('[AdminPharmacies] Edit already in progress, ignoring...');
      return;
    }

    console.log('[AdminPharmacies] handleEditPharmacy called with pharmacy:', pharmacy);
    setEditInProgress(true);

    // Récupérer la pharmacie avec sa clé virtuelle via l'API
    try {
      const supabase = createSupabaseBrowserClient();
      console.log('[AdminPharmacies] Getting session for edit...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('[AdminPharmacies] No session for edit');
        throw new Error('Non authentifié');
      }

      console.log('[AdminPharmacies] Making API call to get pharmacy details for ID:', pharmacy.id);
      // Récupérer les données complètes de la pharmacie avec la clé virtuelle
      const response = await fetch(`/api/admin/pharmacies?id=${pharmacy.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('[AdminPharmacies] Edit API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AdminPharmacies] Edit API error:', errorText);
        throw new Error('Erreur lors de la récupération des données');
      }

      const pharmacyData = await response.json();
      console.log('[AdminPharmacies] Edit API data received:', pharmacyData);

      const editDataToSet = {
        id: pharmacy.id,
        full_name: pharmacyData.full_name || '',
        pharmacy_name: pharmacyData.pharmacy_name || '',
        pharmacy_address: pharmacyData.pharmacy_address || '',
        code_ps: pharmacyData.code_ps || '',
        phone_number: pharmacyData.phone_number || '',
        email: pharmacyData.email || '',
        virtual_key: pharmacyData.virtual_key || '',
      };

      console.log('[AdminPharmacies] Setting edit data:', editDataToSet);
      setEditData(editDataToSet);
      console.log('[AdminPharmacies] Setting showEditForm to true');
      setShowEditForm(true);
    } catch (err) {
      console.error('[AdminPharmacies] Error in handleEditPharmacy:', err);
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setEditInProgress(false);
    }
  };

  const handleUpdatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    setEditLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/admin/pharmacies', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const result = await response.json();
      toast.success(result.message);

      setShowEditForm(false);
      setEditData(null);
      await fetchPharmacies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setEditLoading(false);
    }
  };

  // Ajout de la fonction de réinitialisation du mot de passe
  const [resetLoading, setResetLoading] = useState(false);
  const handleResetPassword = async () => {
    if (!editData || resetLoading) return;
    setResetLoading(true);
    try {
      // Récupérer une session fraîche
      const supabase = createSupabaseBrowserClient();
      console.log(`[ADMIN] Getting fresh session for password reset...`);

      // Forcer le refresh de la session si nécessaire
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[ADMIN] Session error:', sessionError);
        throw new Error('Erreur de session');
      }

      if (!session) {
        console.error('[ADMIN] No session found');
        throw new Error('Non authentifié - veuillez vous reconnecter');
      }

      console.log(`[ADMIN] Session valid, resetting password for pharmacy ID: ${editData.id}`);
      console.log(`[ADMIN] Token length: ${session.access_token.length}`);

      const response = await fetch('/api/admin/pharmacies', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: editData.id, password: true }),
      });

      console.log(`[ADMIN] Password reset response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ADMIN] Password reset error:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la réinitialisation');
      }

      const result = await response.json();
      console.log('[ADMIN] Password reset result:', result);

      // Fermer la modal d'abord pour éviter les problèmes de z-index
      setShowEditForm(false);
      setEditData(null);

      if (result.temp_password) {
        // Attendre un peu que la modal se ferme avant d'afficher le toast
        setTimeout(() => {
          toast(
            <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4">
              <div className="font-semibold mb-2 text-green-800">✅ Nouveau mot de passe temporaire généré :</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono bg-gray-100 px-3 py-2 rounded text-sm select-all border">{result.temp_password}</span>
                <button
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(result.temp_password);
                    toast.success('Mot de passe copié dans le presse-papiers !');
                  }}
                >
                  📋 Copier
                </button>
              </div>
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <div><strong>📧 Email:</strong> {editData.email}</div>
                <div className="mt-1">💡 Transmettez ces identifiants à la pharmacie. Le mot de passe pourra être changé après connexion.</div>
              </div>
            </div>,
            {
              duration: 25000,
              position: 'top-center',
              style: {
                zIndex: 9999,
                maxWidth: '500px'
              }
            }
          );
        }, 300);
      } else {
        toast.success(result.message || 'Mot de passe réinitialisé avec succès');
      }
    } catch (err) {
      console.error('[ADMIN] Password reset error:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setResetLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'rejected': return 'Rejeté';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Chargement des pharmacies...</div>
          <div className="text-xs text-gray-400">
            Debug: Loading={loading.toString()}, Error={error || 'none'}, Pharmacies count={pharmacies.length}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-600">Erreur : {error}</div>
        <div className="mt-4 space-x-2">
          <button
            onClick={fetchPharmacies}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
          <button
            onClick={() => {
              console.log('=== DEBUG INFO ===');
              console.log('Current error:', error);
              console.log('Loading state:', loading);
              console.log('Pharmacies:', pharmacies);
              console.log('Window location:', window.location.href);
              console.log('=== END DEBUG ===');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Debug Info
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Pharmacies</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {pharmacies.length} pharmacie(s) au total
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ajouter Pharmacie
          </button>
        </div>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Créer une nouvelle pharmacie</h2>
            <form onSubmit={handleCreatePharmacy} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code PS *
                  </label>
                  <input
                    type="text"
                    value={formData.code_ps}
                    onChange={(e) => handleCodePsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la pharmacie *
                  </label>
                  <input
                    type="text"
                    value={formData.pharmacy_name}
                    onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clé virtuelle *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.virtual_key}
                    onChange={(e) => setFormData({ ...formData, virtual_key: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, virtual_key: generateVirtualKey(formData.code_ps) })}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    disabled={!formData.code_ps}
                  >
                    Générer
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La clé est générée automatiquement quand vous saisissez le Code PS, mais vous pouvez la modifier
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse de la pharmacie *
                </label>
                <textarea
                  value={formData.pharmacy_address}
                  onChange={(e) => setFormData({ ...formData, pharmacy_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLoading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire d'édition */}
      {showEditForm && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Modifier la pharmacie</h2>
            <form onSubmit={handleUpdatePharmacy} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code PS
                  </label>
                  <input
                    type="text"
                    value={editData.code_ps}
                    onChange={(e) => setEditData({ ...editData, code_ps: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la pharmacie
                  </label>
                  <input
                    type="text"
                    value={editData.pharmacy_name}
                    onChange={(e) => setEditData({ ...editData, pharmacy_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editData.phone_number}
                    onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clé virtuelle
                  </label>
                  <input
                    type="text"
                    value={editData.virtual_key}
                    onChange={(e) => setEditData({ ...editData, virtual_key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse de la pharmacie
                </label>
                <textarea
                  value={editData.pharmacy_address}
                  onChange={(e) => setEditData({ ...editData, pharmacy_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditData(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editLoading ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code PS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {pharmacy.pharmacy_name || 'Non renseigné'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pharmacy.full_name || 'Non renseigné'}
                    </div>
                    {pharmacy.is_admin && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pharmacy.email}</div>
                    <div className="text-sm text-gray-500">{pharmacy.phone_number || 'Non renseigné'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pharmacy.code_ps || 'Non renseigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pharmacy.pharmacy_status)}`}>
                      {getStatusText(pharmacy.pharmacy_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pharmacy.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!pharmacy.is_admin ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditPharmacy(pharmacy)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          Modifier
                        </button>

                        {/* Bouton Approuver visible si le statut n'est pas déjà 'active' */}
                        {pharmacy.pharmacy_status !== 'active' && (
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                            disabled={actionLoading === pharmacy.id + 'active'}
                            onClick={() => handleStatusChange(pharmacy.id, 'active')}
                          >
                            {actionLoading === pharmacy.id + 'active' ? 'Chargement...' : 'Approuver'}
                          </button>
                        )}

                        {/* Bouton Suspendre visible si le statut n'est pas déjà 'suspended' */}
                        {pharmacy.pharmacy_status !== 'suspended' && (
                          <button
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                            disabled={actionLoading === pharmacy.id + 'suspended'}
                            onClick={() => handleStatusChange(pharmacy.id, 'suspended')}
                          >
                            {actionLoading === pharmacy.id + 'suspended' ? 'Chargement...' : 'Suspendre'}
                          </button>
                        )}

                        {/* Bouton Rejeter visible si le statut n'est pas déjà 'rejected' */}
                        {pharmacy.pharmacy_status !== 'rejected' && (
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                            disabled={actionLoading === pharmacy.id + 'rejected'}
                            onClick={() => handleStatusChange(pharmacy.id, 'rejected')}
                          >
                            {actionLoading === pharmacy.id + 'rejected' ? 'Chargement...' : 'Rejeter'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Compte admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pharmacies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">Aucune pharmacie trouvée</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 