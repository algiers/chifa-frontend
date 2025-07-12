'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Building2, Users, CheckCircle, Clock, AlertCircle, ArrowLeft, Activity, BarChart3, Settings, RefreshCw } from 'lucide-react';

interface AdminStats {
  totalPharmacies: number;
  activePharmacies: number;
  pendingPharmacies: number;
  suspendedPharmacies: number;
  totalUsers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
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
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const data = await response.json();
      
      // Calculer les statistiques
      const totalPharmacies = data.length;
      const activePharmacies = data.filter((p: any) => p.pharmacy_status === 'active').length;
      const pendingPharmacies = data.filter((p: any) => p.pharmacy_status === 'pending').length;
      const suspendedPharmacies = data.filter((p: any) => p.pharmacy_status === 'suspended').length;
      const totalUsers = data.filter((p: any) => !p.is_admin).length;

      setStats({
        totalPharmacies,
        activePharmacies,
        pendingPharmacies,
        suspendedPharmacies,
        totalUsers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                  <a href="/admin">
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                </Button>
                <h1 className="text-xl font-semibold">Dashboard Admin</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des statistiques...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                  <a href="/admin">
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                </Button>
                <h1 className="text-xl font-semibold">Dashboard Admin</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-xl max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Erreur de chargement</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={fetchStats} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="/admin">
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Dashboard Admin
                </h1>
                <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme Chifa.ai</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild>
                <a href="/admin/settings">
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pharmacies</p>
                  <p className="text-3xl font-bold">{stats?.totalPharmacies}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pharmacies Actives</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.activePharmacies}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.pendingPharmacies}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Suspendues</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.suspendedPharmacies}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actions Rapides
            </CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités d'administration principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-start space-y-2 hover:bg-accent transition-colors"
                asChild
              >
                <a href="/admin/pharmacies">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Gérer les Pharmacies</p>
                      <p className="text-sm text-muted-foreground">Approuver, suspendre ou rejeter</p>
                    </div>
                  </div>
                </a>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-start space-y-2 hover:bg-accent transition-colors"
                asChild
              >
                <a href="/admin/users">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                      <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Gérer les Utilisateurs</p>
                      <p className="text-sm text-muted-foreground">Voir et gérer les comptes</p>
                    </div>
                  </div>
                </a>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-start space-y-2 hover:bg-accent transition-colors"
                asChild
              >
                <a href="/admin/analytics">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                      <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Analyses</p>
                      <p className="text-sm text-muted-foreground">Statistiques détaillées</p>
                    </div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 