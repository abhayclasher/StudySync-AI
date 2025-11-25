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
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(propTabs[0]);

  // Update active tab when propTabs change
  useEffect(() => {
    if (propTabs.length > 0 && activeTab.value !== propTabs[0].value) {
      setActiveTab(propTabs[0]);
    }
  }, [propTabs]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
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
                : "bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-blue-700/20 hover:to-blue-800/20 hover:text-white border border-white/10 hover:border-white/20"
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