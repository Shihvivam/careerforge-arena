import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

const steps = [
  {
    step: "01",
    icon: "🎯",
    title: "Pick Your Challenge",
    description:
      "Browse 1,200+ challenges sorted by difficulty, tech stack, and career path. Every challenge is a mini-boss fight.",
    detail: "Algo · System Design · Frontend · Backend · DevOps",
  },
  {
    step: "02",
    icon: "⚡",
    title: "Code & Earn XP",
    description:
      "Solve it in the browser IDE. Submit and watch your XP bar fill up. Faster solutions earn combo multipliers.",
    detail: "XP × Streak Multiplier × Speed Bonus",
  },
  {
    step: "03",
    icon: "🏆",
    title: "Get Job Ready",
    description:
      "Your career readiness score updates in real-time. Share your profile with top companies looking to hire.",
    detail: "Resume · Portfolio · Interview Sim · Offers",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-700/5 blur-3xl pointer-events-none" />

      <Container>
        <SectionTitle
          tag="How It Works"
          title={
            <>
              Three steps to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                career victory
              </span>
            </>
          }
          subtitle="No tutorials. No fluff. Just play, earn, and get hired."
          className="mb-20"
        />

        <div className="relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-16 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map(({ step, icon, title, description, detail }, index) => (
              <div key={step} className="relative flex flex-col gap-6">
                {/* Step Number + Icon Row */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-600/20 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-[0_0_24px_rgba(34,211,238,0.15)]">
                      {icon}
                    </div>
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#050a14] border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-[10px] font-black tracking-wider">
                      {step}
                    </span>
                  </div>

                  {/* Connector arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex-1 h-px bg-gradient-to-r from-cyan-400/30 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-white text-xl font-bold tracking-tight">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                  <div className="mt-2 px-4 py-2 bg-white/3 border border-white/5 rounded-lg">
                    <p className="text-cyan-400/70 text-xs font-mono tracking-wide">{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XP Mockup Bar */}
        <div className="mt-16 p-6 rounded-2xl bg-[#0a1628] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-black font-black text-lg">
              42
            </div>
            <div>
              <p className="text-white font-bold text-sm">Your Level Progress</p>
              <p className="text-gray-500 text-xs">3,420 / 5,000 XP to Level 43</p>
            </div>
          </div>
          <div className="flex-1 max-w-sm w-full">
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                style={{ width: "68%" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">🔥</span>
            <span className="text-white font-black text-xl">21</span>
            <span className="text-gray-500 text-sm">day streak</span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HowItWorks;