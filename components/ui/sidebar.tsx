
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href?: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // Open by default on larger screens
    }
    return false; // Default to closed for SSR
  });

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as any)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-3 py-4 hidden md:flex md:flex-col bg-[#080812] border-r border-white/5 w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "70px") : "300px",
        }}
        onMouseEnter={() => animate && setOpen(true)}
        onMouseLeave={() => {
          if (animate) {
            const mediaQuery = window.matchMedia('(min-width: 768px)');
            if (!mediaQuery.matches) {
              setOpen(false);
            }
          }
        }}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-[#080812] w-full border-b border-white/5 z-50 relative"
        )}
        {...props}
      >
        <div className="flex justify-start z-20 w-full items-center">
          <span className="font-bold text-white text-lg">StudySync AI</span>
          <div className="ml-auto">
            <Menu
              className="text-slate-200 h-6 w-6 cursor-pointer hover:text-white transition-colors"
              onClick={() => setOpen(!open)}
            />
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-[80%] max-w-[300px] inset-0 bg-[#080812] border-r border-white/10 p-6 z-[100] flex flex-col justify-between shadow-2xl",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-slate-200 p-2 bg-white/5 rounded-full"
                onClick={() => setOpen(!open)}
              >
                <X className="h-5 w-5" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & React.ComponentProps<"button">) => {
  const { open, animate, setOpen } = useSidebar();
  return (
    <button
      onClick={(e) => {
        if (link.onClick) {
          link.onClick();
        }
        setOpen(false);
      }}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2.5 px-2 w-full text-left rounded-md transition-colors hover:bg-white/5",
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-slate-400 group-hover/sidebar:text-white text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </button>
  );
};
