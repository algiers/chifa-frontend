'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SQLResultDisplayProps {
  query: string;
  results: any[];
  executionTime?: number;
  rowCount?: number;
}

export function SQLResultDisplay({ 
  query, 
  results, 
  executionTime, 
  rowCount 
}: SQLResultDisplayProps) {
  const [isQueryVisible, setIsQueryVisible] = useState(false);
  const [isResultsExpanded, setIsResultsExpanded] = useState(true);
  
  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
  };
  
  const handleExportResults = () => {
    const csv = convertToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chifa-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };
  
  const displayResults = results.slice(0, 10); // Show first 10 rows
  const hasMoreResults = results.length > 10;
  
  return (
    <div className="space-y-4 my-4">
      {/* SQL Query Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Requête SQL exécutée
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyQuery}
                className="h-8 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQueryVisible(!isQueryVisible)}
                className="h-8 px-2"
              >
                {isQueryVisible ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isQueryVisible && (
          <CardContent className="pt-0">
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
              <code className="language-sql">{query}</code>
            </pre>
          </CardContent>
        )}
      </Card>
      
      {/* Results Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Résultats
              <Badge variant="secondary" className="ml-2">
                {rowCount || results.length} ligne{(rowCount || results.length) > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {executionTime && (
                <Badge variant="outline" className="text-xs">
                  {executionTime}ms
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportResults}
                className="h-8 px-2"
                disabled={results.length === 0}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResultsExpanded(!isResultsExpanded)}
                className="h-8 px-2"
              >
                {isResultsExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isResultsExpanded && (
          <CardContent className="pt-0">
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun résultat trouvé
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(displayResults[0]).map((header) => (
                          <th
                            key={header}
                            className="text-left p-2 font-medium text-sm bg-muted/50"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((row, index) => (
                        <tr
                          key={index}
                          className={cn(
                            'border-b',
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/25'
                          )}
                        >
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="p-2 text-sm">
                              {value === null ? (
                                <span className="text-muted-foreground italic">null</span>
                              ) : typeof value === 'boolean' ? (
                                <Badge variant={value ? 'default' : 'secondary'}>
                                  {value.toString()}
                                </Badge>
                              ) : typeof value === 'number' ? (
                                <span className="font-mono">{value}</span>
                              ) : (
                                String(value)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {hasMoreResults && (
                  <div className="text-center py-2">
                    <Badge variant="outline">
                      Affichage de 10 sur {results.length} résultats
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}