import React from "react";

interface SidebarOverlayProps {
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  isMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  if (!isMobile || isCollapsed) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-overlay backdrop-blur-sm z-30 transition-all duration-300 ease-in-out"
      onClick={onToggleCollapse}
      aria-hidden="true"
    />
  );
};

export default SidebarOverlay;
