import React, { ReactNode } from "react";

interface FeatureCardProps {
    icon: ReactNode;

    title: string;

    description: string;
}
  
const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
}) => {
    return (
        <div className="bg-secondary backdrop-blur-lg border border-adaptive rounded-xl p-8 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl shadow-sky-400-20">
        <div className="mb-6">{icon}</div>

        <h3 className="text-2xl font-bold mb-4 color-primary">{title}</h3>

        <p className="color-secondary leading-relaxed">{description}</p>
        </div>
    );
};

export default FeatureCard;