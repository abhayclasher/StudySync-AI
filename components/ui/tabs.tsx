import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

type Tab = {
  title: string;
  value: string;
  content?: string | React.ReactNode | any;
  icon?: React.ReactNode;
};

export const Tabs = ({
  tabs: propTabs,
  activeTabValue,
  onTabChange,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: {
  tabs: Tab[];
  activeTabValue?: string;
  onTabChange?: (tab: Tab) => void;
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<Tab>(propTabs[0]);

  // Use controlled state if activeTabValue is provided, otherwise use internal state
  const activeTab = activeTabValue ? propTabs.find(tab => tab.value === activeTabValue) || propTabs[0] : internalActiveTab;

  // Update active tab when propTabs change
  useEffect(() => {
    if (propTabs.length > 0) {
      const firstTab = propTabs[0];
      if (activeTabValue && !propTabs.some(tab => tab.value === activeTabValue)) {
        // If activeTabValue is not in the new tabs, reset to first tab
        if (onTabChange) {
          onTabChange(firstTab);
        } else {
          setInternalActiveTab(firstTab);
        }
      } else if (!activeTabValue && internalActiveTab && !propTabs.some(tab => tab.value === internalActiveTab.value)) {
        // If internal active tab is not in the new tabs, reset to first tab
        setInternalActiveTab(firstTab);
      }
    }
  }, [propTabs, activeTabValue, onTabChange]);

  const handleTabClick = (tab: Tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap gap-2 border-b border-white/10 pb-1",
          containerClassName
        )}
      >
        {propTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center gap-2",
              tabClassName,
              activeTab.value === tab.value
                ? cn(
                    "bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30",
                    activeTabClassName
                  )
                : "bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-70/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20"
            )}
          >
            {tab.icon}
            {tab.title}
          </button>
        ))}
      </div>
      
      <TabContent
        tabs={propTabs}
        activeTab={activeTab}
        className={cn("mt-6", contentClassName)}
      />
    </>
  );
};

export const TabContent = ({
  className,
  tabs,
  activeTab,
}: {
  className?: string;
  tabs: Tab[];
  activeTab: Tab;
}) => {
 return (
    <motion.div
      key={activeTab.value}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn("w-full", className)}
    >
      {tabs.find(tab => tab.value === activeTab.value)?.content}
    </motion.div>
  );
};