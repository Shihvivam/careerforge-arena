import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

const features = [
  {
    icon: "⚔️",
    label: "Gamified Learning",
    description:
      "Every coding challenge is a quest. Unlock achievements, badges, and rare items as you level up your technical skills.",
    accent: "cyan",
    tag: "CORE",
  },
  {
    icon: "📊",
    label: "Track Progress",
    description:
      "Real-time XP dashboards, skill trees, and heatmaps show exactly how far you've come and where to go next.",
    accent: "purple",
    tag: "ANALYTICS",
  },
  {
    icon: "💼",
    label: "Career Ready Skills",
    description:
      "Curated by FAANG engineers. Each challenge is mapped to real job requirements so your effort translates to interviews.",
    accent: "green",
    tag: "CAREER",
  },
  {
    icon: "🔥",
    label: "Daily Streak System",
    description:
      "Build momentum with daily streaks, combo multipliers, and streak shields. Consistency is your greatest weapon.",
    accent: "orange",
    tag: "STREAKS",
  },
];

const accentMap = {
  cyan: {
    border: "border-cyan-400/20",
    glow: "group-hover:border-cyan-400/50",
    tag: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    icon: "bg-cyan-400/10 group-hover:bg-cyan-400/20",
    shine: "from-cyan-400/10 to-transparent",
  },
  purple: {
    border: "border-purple-500/20",
    glow: "group-hover:border-purple-500/50",
    tag: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: "bg-purple-500/10 group-hover:bg-purple-500/20",
    shine: "from-purple-500/10 to-transparent",
  },
  green: {
    border: "border-emerald-500/20",
    glow: "group-hover:border-emerald-500/50",
    tag: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
    shine: "from-emerald-500/10 to-transparent",
  },
  orange: {
    border: "border-orange-500/20",
    glow: "group-hover:border-orange-500/50",
    tag: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: "bg-orange-500/10 group-hover:bg-orange-500/20",
    shine: "from-orange-500/10 to-transparent",
  },
};

const FeatureCard = ({ icon, label, description, accent, tag }) => {
  const a = accentMap[accent];

  return (
    <div
      className={`relative group flex flex-col gap-5 p-6 rounded-2xl bg-[#0a1628] border ${a.border} ${a.glow} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
    >
      {/* Shine overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${a.shine} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Tag */}
      <span
        className={`w-fit text-[10px] font-black tracking-[0.25em] px-3 py-1 rounded-full border ${a.tag}`}
      >
        {tag}
      </span>

      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${a.icon} transition-colors duration-300`}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h3 className="text-white text-lg font-bold tracking-tight">{label}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <Container>
        <SectionTitle
          tag="Features"
          title={
            <>
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                dominate the arena
              </span>
            </>
          }
          subtitle="CareerForge Arena combines addictive gameplay mechanics with serious career preparation tools."
          className="mb-16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <FeatureCard key={f.label} {...f} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection;