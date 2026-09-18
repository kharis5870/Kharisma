// client/components/KotakCari.tsx

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Kotak pencarian berikon, sama dengan yang dipakai Daftar PPL dan Manajemen Honor. */
export default function KotakCari({ nilai, onUbah, placeholder, id, className }: {
  nilai: string;
  onUbah: (nilai: string) => void;
  placeholder: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        id={id}
        type="search"
        value={nilai}
        onChange={e => onUbah(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
