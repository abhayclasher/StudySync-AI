import React, { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

const BentoGrid = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
        // Base styles
        "bg-[#050505] border border-white/10", 
        // Hover effects
        "hover:shadow-xl transition-all duration-300",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 transition-opacity duration-300 group-hover:opacity-80 opacity-60">
        {background}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />

      <div className="relative z-10 flex flex-col gap-3 p-6 h-full justify-end">
        <div className="w-fit p-3 rounded-lg bg-primary/10 border border-primary/20 backdrop-blur-sm mb-2 group-hover:scale-105 transition-transform duration-300">
           <Icon className="h-6 w-6 text-primary" />
        </div>
        
        <div>
            <h3 className="text-xl font-bold text-white mb-1">
            {name}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            {description}
            </p>
        </div>

        <div className="pt-2">
             <button className="text-xs font-bold text-white flex items-center bg-white/10 hover:bg-white/20 border border-white/5 px-4 py-2 rounded-full transition-all w-fit">
                {cta}
                <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[.02]" />
    </div>
  );
};

export { BentoGrid, BentoCard };