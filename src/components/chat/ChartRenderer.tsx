'use client';

import React from 'react';

interface ChartRendererProps {
  data: any[] | null;
  // Plus de props seront ajoutées ici pour configurer le type de graphique, les colonnes, etc.
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Pas de données suffisantes pour afficher un graphique.
      </div>
    );
  }

  // Logique de rendu de graphique (ex: avec Chart.js, Recharts, etc.)
  // Pour l'instant, un simple placeholder :
  return (
    <div className="my-4 p-4 border border-dashed border-border rounded-lg bg-muted">
      <h5 className="text-md font-semibold text-foreground mb-2">Visualisation de Données (Graphique)</h5>
      <p className="text-sm text-muted-foreground">
        Le composant ChartRenderer affichera ici un graphique basé sur les résultats SQL.
      </p>
      <pre className="mt-2 text-xs bg-card p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(data.slice(0, 5), null, 2)} 
        {data.length > 5 ? "\n..." : ""}
      </pre>
      <p className="text-xs text-muted-foreground mt-2">
        (Ceci est un placeholder. Une bibliothèque de graphiques sera intégrée ici.)
      </p>
    </div>
  );
};

export default ChartRenderer;
