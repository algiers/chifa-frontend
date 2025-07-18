'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  Zap, 
  Database, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageMetadataProps {
  metadata?: {
    credits_used?: number;
    processing_time?: number;
    model_used?: string;
    streaming?: boolean;
    response_length?: number;
    sql_query?: string;
    sql_results?: any;
    [key: string]: any;
  };
  className?: string;
}

export function MessageMetadata({ metadata, className }: MessageMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }
  
  const {
    credits_used,
    processing_time,
    model_used,
    streaming,
    response_length,
    sql_query,
    sql_results,
    ...otherMetadata
  } = metadata;
  
  const hasBasicMetadata = credits_used || processing_time || model_used;
  const hasAdvancedMetadata = Object.keys(otherMetadata).length > 0;
  
  if (!hasBasicMetadata && !hasAdvancedMetadata) {
    return null;
  }
  
  return (
    <Card className={cn("mt-2 border-muted/50", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {credits_used && (
              <Badge variant="outline" className="text-xs">
                <CreditCard className="w-3 h-3 mr-1" />
                {credits_used} crédit{credits_used > 1 ? 's' : ''}
              </Badge>
            )}
            
            {processing_time && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {processing_time}ms
              </Badge>
            )}
            
            {model_used && (
              <Badge variant="outline" className="text-xs">
                <Cpu className="w-3 h-3 mr-1" />
                {model_used}
              </Badge>
            )}
            
            {streaming && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Streaming
              </Badge>
            )}
            
            {sql_query && (
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                SQL
              </Badge>
            )}
            
            {response_length && (
              <Badge variant="outline" className="text-xs">
                {response_length} caractères
              </Badge>
            )}
          </div>
          
          {hasAdvancedMetadata && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        
        {isExpanded && hasAdvancedMetadata && (
          <div className="mt-3 pt-3 border-t border-muted/50">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-medium mb-2">Métadonnées avancées:</div>
              {Object.entries(otherMetadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}