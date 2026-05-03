import { Link } from "react-router-dom";
import Button from "../common/Button";
import Container from "../common/Container";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <Container>
        <div className="relative rounded-3xl overflow-hidden border border-cyan-400/10 bg-[#0a1628]">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-600/10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34,211,238,1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center gap-8 px-8 py-20">
            {/* Badge */}
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-5 py-2">
              <span className="text-purple-400 text-xs font-black tracking-[0.2em] uppercase">
                Free to Start · No Credit Card
              </span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-4 max-w-3xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                Start your journey{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  today
                </span>
              </h2>
              <p className="text-gray-400 text-xl leading-relaxed">
                Join 50,000+ developers who are coding, competing, and landing their dream jobs — all in one arena.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/signup">
              <Button size="lg" className="shadow-[0_0_32px_rgba(34,211,238,0.25)]">
                Join Now 🚀
              </Button>
              </Link>
              <Button variant="ghost" size="lg">
                Explore Challenges
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 pt-8 border-t border-white/5 w-full max-w-xl">
              {[
                { value: "Free forever", label: "Core plan" },
                { value: "2 min", label: "To set up" },
                { value: "No lock-in", label: "Cancel anytime" },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-white font-black text-lg tracking-tight">{value}</span>
                  <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CTASection;