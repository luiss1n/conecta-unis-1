import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = "Buscar vagas em São Lourenço, Caxambu..." }: Props) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex w-full items-center gap-2 rounded-xl border bg-surface p-1.5 shadow-card focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
    >
      <label htmlFor="job-search" className="sr-only">Buscar vagas</label>
      <Search className="ml-2.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        id="job-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <Button type="button" variant="ghost" size="icon" aria-label="Limpar busca" onClick={() => onChange("")}>
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button type="submit" className="h-11 px-5">Buscar</Button>
    </form>
  );
}
