const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer select-none relative overflow-hidden group";

  const variants = {
    primary:
      "bg-cyan-400 text-black border border-cyan-400 hover:bg-transparent hover:text-cyan-400 hover:shadow-[0_0_24px_rgba(34,211,238,0.5)]",
    outline:
      "bg-transparent text-cyan-400 border border-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_24px_rgba(34,211,238,0.5)]",
    ghost:
      "bg-transparent text-gray-300 border border-gray-700 hover:border-purple-500 hover:text-purple-400 hover:shadow-[0_0_16px_rgba(168,85,247,0.3)]",
  };

  const sizes = {
    sm: "px-5 py-2 text-xs rounded",
    md: "px-8 py-3 text-sm rounded",
    lg: "px-10 py-4 text-base rounded",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;