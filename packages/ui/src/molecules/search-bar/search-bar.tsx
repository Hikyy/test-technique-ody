import { Search } from "lucide-react";
import * as React from "react";
import { Input, type InputProps } from "../../atoms/input/input";
import { cn } from "../../lib/cn";

export interface SearchScopeOption<T extends string = string> {
  key: T;
  label: string;
}

export type SearchBarProps<T extends string = string> = Omit<InputProps, "type"> & {
  scopes?: readonly SearchScopeOption<T>[];
  scope?: T;
  onScopeChange?: (scope: T) => void;
};

function SearchBarInner<T extends string = string>(
  { className, placeholder = "Rechercher…", scopes, scope, onScopeChange, ...props }: SearchBarProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const showScope = scopes && scope && onScopeChange;
  const activeScope = scopes?.find((s) => s.key === scope);

  const handleScopeToggle = () => {
    if (!scopes || !scope || !onScopeChange) return;

    const idx = scopes.findIndex((s) => s.key === scope);
    const next = scopes[(idx + 1) % scopes.length];

    if (next) onScopeChange(next.key);
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        className={cn("pl-9", showScope ? "pr-[112px]" : undefined)}
        {...props}
      />
      {showScope && activeScope ? (
        <button
          type="button"
          onClick={handleScopeToggle}
          aria-label={`Filtre actif : ${activeScope.label}. Cliquer pour changer.`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 items-center rounded-[8px] bg-accent-soft px-2.5 text-[11px] font-medium uppercase tracking-wider text-accent transition-opacity hover:opacity-80"
        >
          {activeScope.label}
        </button>
      ) : null}
    </div>
  );
}

export const SearchBar = React.forwardRef(SearchBarInner) as <T extends string = string>(
  props: SearchBarProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => React.ReactElement;
