'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ComboboxOption {
  value: string;
  label: string;
  displayLabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCreate?: boolean;
  onCreateNew?: (newValue: string) => void;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  allowCreate = false,
  onCreateNew,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const selectedOption = options.find((option) => option.value === value);
  const triggerLabel = selectedOption
    ? selectedOption.displayLabel ?? selectedOption.label
    : value || placeholder;

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue === value ? '' : selectedValue);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreate = (name: string) => {
    if (name && onCreateNew) {
      onCreateNew(name);
      setSearchValue('');
      setOpen(false);
    }
  };

  const showCreateOption =
    allowCreate &&
    searchValue.trim() &&
    !filteredOptions.some(
      (opt) => opt.label.toLowerCase() === searchValue.trim().toLowerCase()
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground shadow-sm hover:bg-accent/40 transition-colors text-left',
            !selectedOption && !value && 'text-muted-foreground',
            className
          )}
        >
          {triggerLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 rounded-lg border bg-popover shadow-lg" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && !showCreateOption && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreateOption && (
              <div
                role="button"
                tabIndex={0}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-primary hover:bg-accent outline-none"
                onClick={() => handleCreate(searchValue.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate(searchValue.trim());
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create &quot;{searchValue.trim()}&quot;
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
