import React from "react";

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  children,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <label
      className={`text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-0.5 block ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-1 font-serif">*</span>}
    </label>
  );
};

export default FieldLabel;
