import { useEffect, useState } from 'react';

const FloatingElements: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    
    useEffect(() => {
      const handleVisibilityChange = () => {
        setIsVisible(!document.hidden);
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, []);
    
    // Don't render the elements if the page is not visible
    if (!isVisible) {
      return null;
    }
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full bg-gradient-to-br from-sky-400 to-indigo-400 w-[300px] h-[300px] top-[20%] left-0 filter blur-[40px] opacity-30 z-1 animate-float1"></div>
  
        <div className="absolute rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 w-[400px] h-[400px] top-[50%] right-0 filter blur-[40px] opacity-30 z-1 animate-float2"></div>
  
        <div className="absolute rounded-full bg-gradient-to-br from-purple-400 to-sky-400 w-[250px] h-[250px] bottom-[10%] left-[10%] filter blur-[40px] opacity-30 z-1 animate-float3"></div>
      </div>
    );
};

export default FloatingElements;