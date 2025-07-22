'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  totalPharmacies: number;
  activePharmacies: number;
  pendingPharmacies: number;
  suspendedPharmacies: number;
  totalUsers: number;
  totalConversations: number;
  recentActivity: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPharmacies: 0,
    activePharmacies: 0,
    pendingPharmacies: 0,
    suspendedPharmacies: 0,
    totalUsers: 0,
    totalConversations: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Non authentifié');
      }

      // Récupérer les statistiques des pharmacies
      const pharmaciesResponse = await fetch('/api/admin/pharmacies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (pharmaciesResponse.ok) {
        const pharmacies = await pharmaciesResponse.json();
        const totalPharmacies = pharmacies.length;
        const activePharmacies = pharmacies.filter((p: any) => p.pharmacy_status === 'active').length;
        const pendingPharmacies = pharmacies.filter((p: any) => p.pharmacy_status === 'pending').length;
        const suspendedPharmacies = pharmacies.filter((p: any) => p.pharmacy_status === 'suspended').length;

        setStats(prev => ({
          ...prev,
          totalPharmacies,
          activePharmacies,
          pendingPharmacies,
          suspendedPharmacies
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    description?: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }: {
    title: string;
    description: string;
    icon: any;
    color: string;
    onClick: () => void;
  }) => (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement du tableau de bord...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600">Vue d'ensemble de la plateforme Chifa.ai</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Pharmacies"
            value={stats.totalPharmacies}
            icon={Building2}
            color="bg-blue-500"
          />
          <StatCard
            title="Pharmacies Actives"
            value={stats.activePharmacies}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="En Attente"
            value={stats.pendingPharmacies}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Suspendues"
            value={stats.suspendedPharmacies}
            icon={AlertCircle}
            color="bg-red-500"
          />
        </div>

        {/* Actions Rapides */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <p className="text-gray-600 mb-6">Accès rapide aux fonctionnalités d'administration principales</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Gérer les Pharmacies"
              description="Approuver, suspendre ou rejeter"
              icon={Building2}
              color="bg-blue-500"
              onClick={() => window.location.href = '/admin/pharmacies'}
            />
            <QuickActionCard
              title="Gérer les Utilisateurs"
              description="Voir et gérer les comptes"
              icon={Users}
              color="bg-green-500"
              onClick={() => window.location.href = '/admin/users'}
            />
            <QuickActionCard
              title="Analyses"
              description="Statistiques détaillées"
              icon={TrendingUp}
              color="bg-purple-500"
              onClick={() => window.location.href = '/admin/analytics'}
            />
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Activité Récente</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune activité récente à afficher</p>
              <p className="text-sm">Les activités apparaîtront ici une fois que les utilisateurs commenceront à utiliser la plateforme</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}