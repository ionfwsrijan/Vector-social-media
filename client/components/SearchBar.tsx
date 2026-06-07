import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
}

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  inputClassName = "",
  iconClassName = "h-5",
}: SearchBarProps) {
  return (
    <div className={`search-pill ${className}`}>
      <Search className={`${iconClassName} text-muted-foreground`} aria-hidden />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-full w-full bg-transparent outline-0 placeholder:text-muted-foreground ${inputClassName}`}
      />
    </div>
  );
}