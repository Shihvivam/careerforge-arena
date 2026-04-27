const SectionTitle = ({
  tag = "",
  title,
  subtitle = "",
  align = "center",
  className = "",
}) => {
  const alignClass = {
    center: "text-center items-center",
    left: "text-left items-start",
    right: "text-right items-end",
  };

  return (
    <div className={`flex flex-col gap-4 ${alignClass[align]} ${className}`}>
      {tag && (
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-cyan-400 border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 rounded-full w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {tag}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;