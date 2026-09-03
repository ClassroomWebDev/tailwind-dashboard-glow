import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BD_DISTRICTS } from "@/lib/profile-meta";
import { cn } from "@/lib/utils";

export function DistrictSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || <span className="text-muted-foreground">Search your district…</span>}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search 64 districts…" />
          <CommandList>
            <CommandEmpty>No district found.</CommandEmpty>
            <CommandGroup>
              {BD_DISTRICTS.map((d) => (
                <CommandItem
                  key={d}
                  value={d}
                  onSelect={() => {
                    onChange(d);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value === d ? "opacity-100" : "opacity-0")} />
                  {d}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
