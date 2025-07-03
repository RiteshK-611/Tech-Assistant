"use client";

import { useState } from 'react';
import { HelpCircle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { generateHelpText } from '@/app/actions';

interface HelpTooltipProps {
  stepDescription: string;
}

export function HelpTooltip({ stepDescription }: HelpTooltipProps) {
  const [helpText, setHelpText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHelpText = async () => {
    if (helpText || isLoading) return; 
    setIsLoading(true);
    setError('');
    try {
      const result = await generateHelpText({ stepDescription });
      setHelpText(result.helpText);
    } catch (e) {
      setError('Could not load help text.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover onOpenChange={(open) => { if (open) fetchHelpText() }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Get Help</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        {isLoading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading help...</span></div>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helpText && <p className="text-sm">{helpText}</p>}
      </PopoverContent>
    </Popover>
  );
}
