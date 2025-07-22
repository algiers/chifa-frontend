"use client";

import React, { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import PharmacyCredentialsModal from '@/components/admin/PharmacyCredentialsModal';
import TestLoginButton from '@/components/admin/TestLoginButton';
import AdminLayout from '@/components/admin/AdminLayout';

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

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // États pour la création de pharmacie
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // État pour le modal des informations de connexion
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newPharmacyCredentials, setNewPharmacyCredentials] = useState<any>(null);
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

  // Fonction pour réinitialiser le formulaire avec un nouveau mot de passe
  const resetFormWithNewPassword = () => {
    setFormData({
      email: '',
      password: generateSecurePassword(),
      full_name: '',
      pharmacy_name: '',
      pharmacy_address: '',
      code_ps: '',
      phone_number: '',
      virtual_key: '',
    });
  };
  
  // Générer un mot de passe sécurisé au chargement du formulaire
  useEffect(() => {
    if (showCreateForm) {
      setFormData(prev => ({
        ...prev,
        password: generateSecurePassword()
      }));
    }
  }, [showCreateForm]);

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

  // Fonction pour générer un mot de passe sécurisé conforme aux exigences Supabase
  const generateSecurePassword = (): string => {
    // Supabase exige : au moins 6 caractères, avec majuscules, minuscules, chiffres et caractères spéciaux
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Garantir au moins un caractère de chaque type
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Compléter avec des caractères aléatoires pour atteindre 12 caractères
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mélanger les caractères pour éviter un pattern prévisible
    return password.split('').sort(() => Math.random() - 0.5).join('');
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
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/admin/pharmacies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des pharmacies');
      }

      const data = await response.json();
      setPharmacies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      
      console.log('[AdminPharmacies] Creation result:', result);
      
      // Afficher le message de succès
      toast.success(result.message);
      
      // Afficher le modal avec les informations de connexion
      if (result.temp_password && result.pharmacy) {
        console.log('[AdminPharmacies] Displaying credentials modal:', result.temp_password);
        
        setNewPharmacyCredentials({
          pharmacy_name: result.pharmacy.pharmacy_name,
          email: result.pharmacy.email,
          temp_password: result.temp_password,
          code_ps: result.pharmacy.code_ps
        });
        setShowCredentialsModal(true);
      } else {
        console.warn('[AdminPharmacies] No temp_password in result:', result);
        toast.error('Attention: Aucun mot de passe temporaire généré. Vérifiez la création.');
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

  const handleEditPharmacy = async (pharmacy: Pharmacy) => {
    // Récupérer la pharmacie avec sa clé virtuelle via l'API
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Non authentifié');
      }

      // Récupérer les données complètes de la pharmacie avec la clé virtuelle
      const response = await fetch(`/api/admin/pharmacies?id=${pharmacy.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const pharmacyData = await response.json();

      setEditData({
        id: pharmacy.id,
        full_name: pharmacyData.full_name || '',
        pharmacy_name: pharmacyData.pharmacy_name || '',
        pharmacy_address: pharmacyData.pharmacy_address || '',
        code_ps: pharmacyData.code_ps || '',
        phone_number: pharmacyData.phone_number || '',
        email: pharmacyData.email || '',
        virtual_key: pharmacyData.virtual_key || '',
      });
      setShowEditForm(true);
    } catch (err) {
      toast.error('Erreur lors de la récupération des données');
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
        <div className="text-gray-500">Chargement des pharmacies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-600">Erreur : {error}</div>
        <button 
          onClick={fetchPharmacies}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Pharmacies</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="text-sm text-gray-500">
              {pharmacies.length} pharmacie(s) au total
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-yellow-50"
                      placeholder="Mot de passe sécurisé"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, password: generateSecurePassword()})}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Générer
                    </button>
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(formData.password);
                          toast.success('Mot de passe copié !');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Copier
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Le mot de passe doit contenir au moins 6 caractères avec majuscules, minuscules, chiffres et symboles
                  </p>
                  {formData.password && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <strong>⚠️ Important :</strong> Notez ce mot de passe pour le communiquer à la pharmacie.
                          Il pourra être changé après la première connexion.
                        </div>
                        {formData.email && formData.password && (
                          <TestLoginButton email={formData.email} password={formData.password} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, pharmacy_name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, virtual_key: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, virtual_key: generateVirtualKey(formData.code_ps)})}
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
                  onChange={(e) => setFormData({...formData, pharmacy_address: e.target.value})}
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
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
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
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
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
                    onChange={(e) => setEditData({...editData, code_ps: e.target.value})}
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
                    onChange={(e) => setEditData({...editData, pharmacy_name: e.target.value})}
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
                    onChange={(e) => setEditData({...editData, phone_number: e.target.value})}
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
                    onChange={(e) => setEditData({...editData, virtual_key: e.target.value})}
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
                  onChange={(e) => setEditData({...editData, pharmacy_address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
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
            </form>
          </div>
        </div>
      )}

      {/* Version desktop du tableau */}
      <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-stable">
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

      {/* Version mobile du tableau - cartes */}
      <div className="lg:hidden space-y-4">
        {pharmacies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-500">Aucune pharmacie trouvée</div>
          </div>
        ) : (
          pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* En-tête de la carte */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">
                    {pharmacy.pharmacy_name || 'Non renseigné'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {pharmacy.full_name || 'Non renseigné'}
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pharmacy.pharmacy_status)}`}>
                    {getStatusText(pharmacy.pharmacy_status)}
                  </span>
                  {pharmacy.is_admin && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              
              {/* Contenu de la carte */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div className="text-sm text-gray-900">{pharmacy.email}</div>
                </div>
                
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-500">Code PS</div>
                  <div className="text-sm text-gray-900">{pharmacy.code_ps || 'Non renseigné'}</div>
                </div>
                
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-500">Téléphone</div>
                  <div className="text-sm text-gray-900">{pharmacy.phone_number || 'Non renseigné'}</div>
                </div>
                
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-500">Date d'inscription</div>
                  <div className="text-sm text-gray-900">
                    {new Date(pharmacy.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              {!pharmacy.is_admin && (
                <div className="px-4 py-3 bg-gray-50 flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => handleEditPharmacy(pharmacy)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                  >
                    Modifier
                  </button>
                  
                  {pharmacy.pharmacy_status !== 'active' && (
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                      disabled={actionLoading === pharmacy.id + 'active'}
                      onClick={() => handleStatusChange(pharmacy.id, 'active')}
                    >
                      {actionLoading === pharmacy.id + 'active' ? '...' : 'Activer'}
                    </button>
                  )}
                  
                  {pharmacy.pharmacy_status !== 'suspended' && (
                    <button
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600"
                      disabled={actionLoading === pharmacy.id + 'suspended'}
                      onClick={() => handleStatusChange(pharmacy.id, 'suspended')}
                    >
                      {actionLoading === pharmacy.id + 'suspended' ? '...' : 'Suspendre'}
                    </button>
                  )}
                  
                  {pharmacy.pharmacy_status !== 'rejected' && (
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                      disabled={actionLoading === pharmacy.id + 'rejected'}
                      onClick={() => handleStatusChange(pharmacy.id, 'rejected')}
                    >
                      {actionLoading === pharmacy.id + 'rejected' ? '...' : 'Rejeter'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Modal des informations de connexion */}
      {showCredentialsModal && newPharmacyCredentials && (
        <PharmacyCredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => setShowCredentialsModal(false)}
          pharmacyData={newPharmacyCredentials}
        />
      )}
      </div>
    </AdminLayout>
  );
} 