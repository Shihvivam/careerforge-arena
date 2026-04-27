import Button from "../common/Button";
import Container from "../common/Container";

const statItems = [
  { value: "50K+", label: "Active Players" },
  { value: "1,200+", label: "Challenges" },
  { value: "94%", label: "Job Placement" },
  { value: "4.9★", label: "Rating" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />

      <Container className="relative z-10 py-20">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex items-center gap-2 bg-cyan-400/5 border border-cyan-400/20 rounded-full px-5 py-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase">
              Season 3 Now Live — Compete & Earn XP
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
            Level Up Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400">
              Coding Like a Game
            </span>{" "}
            <span className="text-4xl md:text-5xl lg:text-6xl">🎮</span>
          </h1>

          {/* Sub */}
          <p className="text-gray-400 text-xl md:text-2xl leading-relaxed max-w-2xl">
            Solve challenges, earn XP, and get job-ready — one quest at a time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Button size="lg">Start Playing Free</Button>
            <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-200 group">
              <span className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 transition-colors duration-300">
                <span className="text-purple-400 text-sm ml-0.5">▶</span>
              </span>
              <span className="text-sm font-medium">Watch Demo</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mt-8 w-full border border-white/5">
            {statItems.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-1 py-6 px-4 bg-[#0a1628] hover:bg-[#0d1e38] transition-colors duration-200"
              >
                <span className="text-2xl font-black text-cyan-400 tracking-tight">
                  {value}
                </span>
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Trust */}
          <p className="text-gray-600 text-sm">
            Trusted by engineers at{" "}
            {["Google", "Stripe", "Vercel", "Linear", "Figma"].map((co, i) => (
              <span key={co}>
                <span className="text-gray-400 font-semibold">{co}</span>
                {i < 4 && <span className="mx-2 text-gray-700">·</span>}
              </span>
            ))}
          </p>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;