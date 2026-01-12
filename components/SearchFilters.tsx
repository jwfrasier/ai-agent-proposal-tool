'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { setAsideTypes } from '@/lib/sam-api';
import type { SearchParams } from '@/types';

interface SearchFiltersProps {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
}

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [naicsCode, setNaicsCode] = useState('');
  const [setAside, setSetAside] = useState('');
  const [postedFrom, setPostedFrom] = useState('');
  const [postedTo, setPostedTo] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    const params: SearchParams = {
      keyword: keyword || undefined,
      naicsCode: naicsCode || undefined,
      typeOfSetAside: setAside || undefined,
      postedFrom: postedFrom || undefined,
      postedTo: postedTo || undefined,
      responseDeadlineFrom: deadlineFrom || undefined,
      responseDeadlineTo: deadlineTo || undefined,
    };
    onSearch(params);
  };

  const handleReset = () => {
    setKeyword('');
    setNaicsCode('');
    setSetAside('');
    setPostedFrom('');
    setPostedTo('');
    setDeadlineFrom('');
    setDeadlineTo('');
  };

  const formatDateForApi = (dateStr: string): string => {
    if (!dateStr) return '';
    // SAM.gov expects MM/DD/YYYY format
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Main Search Row */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="keyword" className="sr-only">
                Keyword Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Search by keyword, title, or description..."
                  className="pl-10"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
              </div>
            </div>
            <div className="w-40">
              <Label htmlFor="naics" className="sr-only">
                NAICS Code
              </Label>
              <Input
                id="naics"
                value={naicsCode}
                onChange={e => setNaicsCode(e.target.value)}
                placeholder="NAICS Code"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            <div className="w-64">
              <Label htmlFor="setAside" className="sr-only">
                Set-Aside Type
              </Label>
              <Select value={setAside} onValueChange={setSetAside}>
                <SelectTrigger>
                  <SelectValue placeholder="Set-Aside Type" />
                </SelectTrigger>
                <SelectContent>
                  {setAsideTypes.map(type => (
                    <SelectItem key={type.value} value={type.value || 'none'}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSearch} disabled={loading} size="sm">
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Posted From</Label>
                <Input
                  type="date"
                  value={postedFrom}
                  onChange={e => setPostedFrom(formatDateForApi(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Posted To</Label>
                <Input
                  type="date"
                  value={postedTo}
                  onChange={e => setPostedTo(formatDateForApi(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline From</Label>
                <Input
                  type="date"
                  value={deadlineFrom}
                  onChange={e => setDeadlineFrom(formatDateForApi(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline To</Label>
                <Input
                  type="date"
                  value={deadlineTo}
                  onChange={e => setDeadlineTo(formatDateForApi(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
