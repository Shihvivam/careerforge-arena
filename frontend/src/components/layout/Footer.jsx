import Container from "../common/Container";

const footerLinks = {
  Product: ["Features", "Challenges", "Leaderboard", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Docs", "API", "Community", "Discord"],
  Legal: ["Privacy", "Terms", "Cookies", "Security"],
};

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#050a14] pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.4)]">
                <span className="text-black font-black text-sm">CF</span>
              </div>
              <span className="font-black text-white text-lg tracking-tight">
                Career<span className="text-cyan-400">Forge</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Level up your coding skills through gamified challenges and career-ready projects.
            </p>
            <div className="flex gap-3 mt-5">
              {["𝕏", "in", "gh"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-gray-500 hover:border-cyan-400/50 hover:text-cyan-400 transition-all duration-200 text-xs font-bold"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-white text-xs font-bold tracking-widest uppercase mb-4">
                {group}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-500 text-sm hover:text-cyan-400 transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            © 2025 CareerForge Arena. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-600 text-xs">All systems operational</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;