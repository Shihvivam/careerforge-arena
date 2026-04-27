import { useState } from "react";
import Button from "../common/Button";
import Container from "../common/Container";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Leaderboard", href: "#leaderboard" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050a14]/80 backdrop-blur-xl">
      <Container>
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_24px_rgba(34,211,238,0.7)] transition-all duration-300">
              <span className="text-black font-black text-sm tracking-tight">CF</span>
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              Career<span className="text-cyan-400">Forge</span>{" "}
              <span className="text-gray-500 font-semibold text-sm">Arena</span>
            </span>
          </a>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-200 tracking-wide"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
              Sign In
            </a>
            <Button size="sm">Play Free</Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`w-5 h-0.5 bg-gray-400 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-5 h-0.5 bg-gray-400 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-gray-400 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </nav>
      </Container>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#050a14]/95 backdrop-blur-xl">
          <Container className="py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 py-1"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" className="w-fit mt-2">
              Play Free
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
};

export default Navbar;