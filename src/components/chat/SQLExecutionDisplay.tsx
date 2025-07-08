'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import ChartRenderer from './ChartRenderer'; // Importer ChartRenderer

interface SQLExecutionDisplayProps {
  sqlResults: any[] | null;
}

type SortDirection = 'asc' | 'desc' | null;

const SQLExecutionDisplay: React.FC<SQLExecutionDisplayProps> = ({ sqlResults }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const headers = useMemo(() => {
    if (!sqlResults || sqlResults.length === 0) return [];
    return Array.isArray(sqlResults[0]) ? 
      sqlResults[0].map((_: any, index: number) => `Colonne ${index + 1}`) : 
      Object.keys(sqlResults[0]);
  }, [sqlResults]);

  const sortedResults = useMemo(() => {
    if (!sqlResults || !sortColumn || !sortDirection) {
      return sqlResults;
    }
    return [...sqlResults].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sqlResults, sortColumn, sortDirection]);

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };
  
  const getSortIcon = (columnName: string) => {
    if (sortColumn !== columnName || !sortDirection) {
      return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  if (!sqlResults || sqlResults.length === 0) {
    return <p className="text-sm text-gray-500 italic">Aucun résultat à afficher.</p>;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <h4 className="text-sm font-semibold mb-2 text-gray-700">Résultats de la requête :</h4>
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th 
                  key={header} 
                  scope="col" 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(header)}
                >
                  <div className="flex items-center">
                    {header}
                    {getSortIcon(header)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(sortedResults || sqlResults).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? undefined : 'bg-gray-50'}>
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sqlResults.length > 10 && !sortedResults && ( // Show pagination note only if not sorted or if pagination is implemented
        <p className="text-xs text-gray-500 mt-1">Affichage des 10 premiers résultats. (Fonctionnalité de pagination à venir)</p>
      )}
      {/* Intégration de ChartRenderer */}
      <ChartRenderer data={sqlResults} />
    </div>
  );
};

export default SQLExecutionDisplay;
