import { Cpu } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <div className="p-2 bg-primary/20 rounded-lg">
        <Cpu className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold font-headline tracking-tight">
        ShopFloor AI Assist
      </h1>
    </div>
  );
}
