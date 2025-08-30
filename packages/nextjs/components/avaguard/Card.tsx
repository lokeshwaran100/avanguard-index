import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({ children, className = "", padding = "md" }) => {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const classes = `bg-white rounded-xl shadow-sm border ${paddingClasses[padding]} ${className}`;

  return <div className={classes}>{children}</div>;
};
