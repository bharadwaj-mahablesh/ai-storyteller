import React from 'react';

interface CardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, onClick, children }) => {
  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-blue-100 flex flex-col items-start min-h-[180px] w-full"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ outline: 'none' }}
    >
      <h2 className="text-2xl font-bold mb-2 text-blue-900">{title}</h2>
      {description && <p className="text-base text-blue-700 mb-2">{description}</p>}
      {children}
    </div>
  );
};

export default Card; 