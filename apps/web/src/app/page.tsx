import { CopyCommand } from '@/components/CopyCommand';
import { CrabMascot } from '@/components/CrabMascot';
import { Terminal } from '@/components/Terminal';
import { ModuleCard } from '@/components/ModuleCard';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ParallaxIcons } from '@/components/ParallaxIcons';
import { ScrollReveal } from '@/components/ScrollReveal';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* Global animated background */}
      <AnimatedBackground />

      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <nav className="max-w-6xl mx-auto flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl px-6 py-3 shadow-sm border border-white/50">
          <Link href="/" className="flex items-center gap-2 font-bold text-[#2C3E50]">
            <span className="text-2xl" role="img" aria-label="CRABB logo">🦀</span>
            <span>CRABB</span>
          </Link>
          <div className="flex items-center gap-6">
            <a
              href="#demo"
              className="text-sm font-medium text-[#34495E] hover:text-[#4ECDC4] transition-colors hidden sm:block"
            >
              Demo
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#34495E] hover:text-[#4ECDC4] transition-colors hidden sm:block"
            >
              How it works
            </a>
            <a
              href="https://github.com/getcrabb/crabb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#2C3E50] text-white rounded-xl text-sm font-medium hover:bg-[#34495E] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center px-4 pt-40 pb-20">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient blobs */}
          <div className="blob blob-coral w-[600px] h-[600px] -top-32 -right-32 animate-float-slow" />
          <div className="blob blob-ocean w-[500px] h-[500px] -bottom-48 -left-48 animate-float" />
          <div className="blob blob-sand w-[400px] h-[400px] top-1/3 right-1/3 animate-float-slow" style={{ animationDelay: '2s' }} />

          {/* Parallax floating icons - hidden on mobile to avoid distraction */}
          <div className="hidden md:block">
            <ParallaxIcons />
          </div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Mascot */}
          <div className="mb-8 mt-8 animate-pop-in">
            <CrabMascot size="large" />
          </div>

          {/* Main headline */}
          <h1 className="mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <span className="block text-lg md:text-xl text-[#34495E] font-semibold mb-3">
              Is your AI agent
            </span>
            <span
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight"
              style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #E85555 50%, #4ECDC4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              leaking secrets?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#34495E] mb-10 max-w-2xl mx-auto leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <strong className="text-[#2C3E50]">CRABB</strong> scans your OpenClaw installation
            and gives you a simple <strong className="text-[#2C3E50]">0-100 score</strong> with
            clear steps to fix issues. No security expertise needed.
          </p>

          {/* CTA */}
          <div className="mb-12 opacity-0 animate-slide-up" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            <CopyCommand command="npx getcrabb" />
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 opacity-0 animate-slide-up" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
            <TrustBadge icon="🔒" text="100% offline" />
            <TrustBadge icon="⚡" text="Under 10 seconds" />
            <TrustBadge icon="📖" text="Open source" />
          </div>

          {/* Scroll indicator - inside content container for proper alignment */}
          <div className="mt-12 flex flex-col items-center gap-2 animate-bounce-soft">
            <span className="text-sm text-[#34495E]/60 font-medium">See how it works</span>
            <div className="w-6 h-10 rounded-full border-2 border-[#4ECDC4]/50 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-[#4ECDC4] rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Demo Section */}
      <section id="demo" className="relative py-16 px-4 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              badge="Live Demo"
              badgeColor="#4ECDC4"
              title="See CRABB in action"
              subtitle="Watch a real scan find security issues. Your results are private — nothing leaves your machine."
            />
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Terminal />
          </ScrollReveal>
        </div>
      </section>

      {/* Modules Section */}
      <section className="relative py-16 px-4 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              badge="What We Check"
              badgeColor="#FF6B6B"
              title="4 security modules, one score"
              subtitle="CRABB checks the most important security areas of your OpenClaw setup."
            />
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal delay={0.1} direction="up">
              <ModuleCard
                icon="🔑"
                title="Credentials"
                points={40}
                description="Finds exposed API keys, tokens, and secrets in your config files and logs."
                color="#EF4444"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.2} direction="up">
              <ModuleCard
                icon="⚡"
                title="Skills"
                points={30}
                description="Scans skills for dangerous patterns like remote code execution or data theft."
                color="#F59E0B"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.3} direction="up">
              <ModuleCard
                icon="🛡️"
                title="Permissions"
                points={20}
                description="Checks if your sandbox mode, DM policies, and allowlists are configured safely."
                color="#3B82F6"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.4} direction="up">
              <ModuleCard
                icon="🌐"
                title="Network"
                points={10}
                description="Verifies your gateway isn't exposed and authentication is properly set up."
                color="#10B981"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-16 px-4 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              badge="Simple Process"
              badgeColor="#4ECDC4"
              title="Three steps to peace of mind"
            />
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal delay={0.1} direction="left">
              <Step
                number={1}
                title="Run the scan"
                description="Just run npx getcrabb in your terminal. It automatically finds your OpenClaw installation and checks everything locally."
                icon="▶️"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.2} direction="right">
              <Step
                number={2}
                title="Get your score"
                description="You'll see a score from 0-100 with a letter grade (A-F). Higher is better! We'll show you exactly what needs fixing."
                icon="📊"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.3} direction="left">
              <Step
                number={3}
                title="Fix or share"
                description="Run --fix to apply recommended fixes with before/after comparison. Or use --share to get a link you can post. Only aggregate data is sent — never your actual secrets."
                icon="🔧"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Grades preview */}
      <section className="relative py-16 px-4 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              badge="Scoring"
              badgeColor="#FFE66D"
              title="Understand your grade"
              subtitle="Your score translates to a letter grade that tells you how secure your setup is."
            />
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="scale">
            <div className="flex flex-wrap justify-center gap-4">
              <GradeBadge grade="A" label="Excellent" color="#10B981" emoji="🎉" />
              <GradeBadge grade="B" label="Good" color="#3B82F6" emoji="👍" />
              <GradeBadge grade="C" label="Needs work" color="#F59E0B" emoji="🤔" />
              <GradeBadge grade="D" label="Poor" color="#F97316" emoji="⚠️" />
              <GradeBadge grade="F" label="Critical" color="#EF4444" emoji="🚨" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <SectionHeader
              badge="FAQ"
              badgeColor="#FF6B6B"
              title="Common questions"
            />
          </ScrollReveal>

          <div className="space-y-4">
            <ScrollReveal delay={0.1}>
              <FAQ question="Is this safe to run?">
                Yes! CRABB runs 100% locally on your machine. It never sends any data unless you explicitly
                use the <code className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#E85555]">--share</code> flag, and even then
                it only sends your score and counts — never actual secrets or file paths.
              </FAQ>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <FAQ question="What's OpenClaw?">
                <a href="https://openclaw.ai" className="text-[#4ECDC4] hover:underline font-semibold">OpenClaw</a> is
                an open-source AI agent framework with 100k+ GitHub stars. It gives your AI assistant
                access to your files, shell, and messaging apps — which is powerful but needs proper security.
              </FAQ>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <FAQ question="Is CRABB open source?">
                Yes! CRABB is MIT licensed and fully open source. Check out the code on{' '}
                <a href="https://github.com/getcrabb/crabb" className="text-[#4ECDC4] hover:underline font-semibold">GitHub</a>.
              </FAQ>
            </ScrollReveal>
            <ScrollReveal delay={0.25}>
              <FAQ question="How is this different from OpenClaw's built-in audit?">
                CRABB works in <strong>hybrid mode</strong> — it wraps OpenClaw's{' '}
                <code className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#E85555]">security audit</code> command
                and adds deeper credential/skills scanning. You get a unified 0-100 score, shareable score cards,
                and a guided <code className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#E85555]">--fix</code> flow
                that shows before/after comparison. Works even without OpenClaw CLI installed.
              </FAQ>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <FAQ question="What does --fix do?">
                The <code className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#E85555]">--fix</code> flag runs a guided
                remediation flow: it scans your setup, shows found issues, asks for confirmation, applies fixes via
                OpenClaw CLI, then rescans to show you a before/after delta. Use{' '}
                <code className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[#E85555]">--yes</code> to skip confirmation
                in CI/automation.
              </FAQ>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob blob-coral w-[400px] h-[400px] top-0 left-1/4 opacity-50" />
            <div className="blob blob-ocean w-[350px] h-[350px] bottom-0 right-1/4 opacity-50" />
          </div>

          <ScrollReveal direction="scale">
            <div className="relative card p-12 md:p-16 shadow-xl">
              <div className="mb-8">
                <CrabMascot size="medium" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#2C3E50] mb-4">
                Ready to check your security?
              </h2>
              <p className="text-lg text-[#34495E] mb-8">
                One command. No signup. No data sent.
              </p>
              <CopyCommand command="npx getcrabb" />

              <div className="mt-8 pt-8 border-t border-[#E2E8F0] flex justify-center gap-4 flex-wrap">
                <span className="flex items-center gap-2 px-4 py-2 bg-[#4ECDC4]/10 rounded-full text-[#4ECDC4] font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Private
                </span>
                <span className="flex items-center gap-2 px-4 py-2 bg-[#FFE66D]/20 rounded-full text-[#D4A000] font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Fast
                </span>
                <span className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 rounded-full text-[#10B981] font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4 12 14.01l-3-3" />
                  </svg>
                  Free
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#E2E8F0] bg-white/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-[#34495E]">
            <span className="text-2xl">🦀</span>
            <span className="text-sm">
              CRABB does not replace professional security audit
            </span>
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <Link href="/privacy" className="text-[#34495E] hover:text-[#FF6B6B] transition-colors">
              Privacy
            </Link>
            <a
              href="https://github.com/getcrabb/crabb"
              className="text-[#34495E] hover:text-[#FF6B6B] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TrustBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold text-[#2C3E50]">{text}</span>
    </div>
  );
}

function SectionHeader({
  badge,
  badgeColor,
  title,
  subtitle,
}: {
  badge: string;
  badgeColor: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-12">
      <span
        className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-4"
        style={{ background: `${badgeColor}20`, color: badgeColor }}
      >
        {badge}
      </span>
      <h2 className="text-3xl md:text-4xl font-black text-[#2C3E50] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[#34495E] max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex gap-5 items-start card p-6 hover:shadow-lg transition-all">
      <div className="step-number flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-xl font-bold text-[#2C3E50] mb-2 flex items-center gap-2">
          {title}
          <span className="text-lg">{icon}</span>
        </h3>
        <p className="text-[#34495E] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function GradeBadge({
  grade,
  label,
  color,
  emoji,
}: {
  grade: string;
  label: string;
  color: string;
  emoji: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-transform hover:scale-105"
      style={{ background: `${color}15` }}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="text-2xl font-black" style={{ color }}>
          {grade}
        </div>
        <div className="text-xs text-[#64748B] font-medium">{label}</div>
      </div>
    </div>
  );
}

function FAQ({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group card overflow-hidden">
      <summary className="p-5 cursor-pointer font-bold text-[#2C3E50] flex justify-between items-center list-none hover:bg-[#F8FAFC] transition-colors">
        {question}
        <span
          className="w-8 h-8 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center text-[#4ECDC4] transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-5 text-[#34495E] leading-relaxed">
        {children}
      </div>
    </details>
  );
}
