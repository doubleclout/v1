"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageSquare, Video, FileText, Mail, Linkedin, Github, FileEdit, Calendar, Sparkles, Send, Target, Building2, Rocket, Zap, Sliders } from "lucide-react";

const INTEGRATIONS = [
  { name: "Slack", icon: MessageSquare, color: "#4A154B", bg: "#f5e6f5" },
  { name: "Zoom", icon: Video, color: "#2D8CFF", bg: "#e8f0fe" },
  { name: "Google", icon: FileText, color: "#4285F4", bg: "#e8f0fe" },
  { name: "Gmail", icon: Mail, color: "#EA4335", bg: "#fce8e6" },
  { name: "LinkedIn", icon: Linkedin, color: "#0A66C2", bg: "#e3f2fd" },
  { name: "GitHub", icon: Github, color: "#24292f", bg: "#f6f8fa" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
};

export default function HomePage() {
  const [annual, setAnnual] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#fafaf9] relative overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-black/5 bg-[#fafaf9]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl w-full items-center justify-between px-4 sm:px-0">
          <Link href="/" className="flex items-center gap-2 font-display text-base sm:text-lg font-semibold text-zinc-900">
            <Image src="/dc_logo.svg" alt="Doubleclout" width={32} height={32} className="h-8 w-8" unoptimized />
            DoubleClout
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#how-it-works" className="hidden sm:inline font-display text-zinc-600 hover:text-zinc-900 transition-colors leading-relaxed pb-px">
              How it works
            </a>
            <a href="#pricing" className="hidden sm:inline font-display text-zinc-600 hover:text-zinc-900 transition-colors leading-relaxed pb-px">
              Pricing
            </a>
            <a href="#for-teams" className="hidden sm:inline font-display text-zinc-600 hover:text-zinc-900 transition-colors leading-relaxed pb-px">
              For Teams
            </a>
            <Link
              href="/login"
              className="rounded-full bg-[var(--accent)] px-3.5 sm:px-4 py-2 font-display font-medium text-white text-sm shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/25 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Get started
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 -mr-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-md">
            <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col gap-4">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 font-display text-zinc-600 hover:text-zinc-900 font-medium leading-relaxed pb-px">
                How it works
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 font-display text-zinc-600 hover:text-zinc-900 font-medium leading-relaxed pb-px">
                Pricing
              </a>
              <a href="#for-teams" onClick={() => setMobileMenuOpen(false)} className="py-2 font-display text-zinc-600 hover:text-zinc-900 font-medium leading-relaxed pb-px">
                For Teams
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-40 sm:pt-44 pb-16 sm:pb-20 md:pt-48 md:pb-28 z-[1] bg-[#fafaf9]">
        <div className="relative w-full">
          <div className="relative left-1/2 w-full max-w-4xl -translate-x-1/2 text-center px-2">
            <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.15] tracking-tight text-zinc-900"
          >
            <span className="whitespace-nowrap">Turn work into content.</span> <span className="text-[var(--accent)]">Seamlessly.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-zinc-600"
          >
            Connect Slack, Zoom, Google. Insights surface from calls and threads. Draft. Publish to LinkedIn.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white hover:opacity-90 active:scale-95 transition-all min-h-[48px]"
              >
                Get started free
              </Link>
            </motion.div>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-50 active:scale-95 transition-all min-h-[48px]"
            >
              See how it works
            </a>
          </motion.div>
          <div className="mt-10 w-full overflow-hidden">
            <div className="flex animate-marquee gap-4" style={{ width: "max-content" }}>
              {[...INTEGRATIONS, ...INTEGRATIONS].map(({ name, icon: Icon, color, bg }, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: bg }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700">{name}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent relative z-[1]" />


      {/* Problem */}
      <section className="relative px-4 sm:px-6 py-10 sm:py-12 md:py-16 overflow-hidden z-[1] bg-white">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            The problem
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold leading-tight text-zinc-900 md:text-4xl">
            Your best insights live in threads, calls, and docs.
            <br />
            <span className="text-zinc-500">They rarely make it to your content.</span>
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-6 max-w-2xl text-zinc-600">
            The gap between what you do and what you share keeps growing.
          </motion.p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Manual note-taking", desc: "Scattered notes. Missed context.", icon: FileText, color: "#f59e0b", bg: "#fef3c7" },
              { title: "Generic AI tools", desc: "Prompts. None specific to YOUR context.", icon: Sparkles, color: "#4f46e5", bg: "#e0e7ff" },
              { title: "Agency help", desc: "Briefing, back-and-forth, budget.", icon: Building2, color: "#e11d48", bg: "#ffe4e6" },
              { title: "Push through", desc: "What most teams do. Missed insights.", icon: Zap, color: "#64748b", bg: "#f1f5f9" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...stagger}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-zinc-300 transition-all"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: item.bg }}>
                    <Icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <motion.div {...stagger} transition={{ delay: 0.2 }} whileHover={{ scale: 1.03, y: -4 }} className="rounded-xl bg-[var(--accent)] p-6 text-left text-white cursor-default">
              <motion.p initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="font-display text-4xl font-bold md:text-5xl">80%</motion.p>
              <p className="mt-2 text-sm text-white/90">teams lose insights in threads & calls</p>
            </motion.div>
            <motion.div {...stagger} transition={{ delay: 0.25 }} whileHover={{ scale: 1.03, y: -4 }} className="rounded-xl bg-zinc-800 p-6 text-left text-white cursor-default">
              <motion.p initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="font-display text-4xl font-bold md:text-5xl">5+ hrs</motion.p>
              <p className="mt-2 text-sm text-zinc-400">weekly on manual note-taking</p>
            </motion.div>
            <motion.div {...stagger} transition={{ delay: 0.3 }} whileHover={{ scale: 1.03, y: -4 }} className="rounded-xl bg-[var(--accent)] p-6 text-left text-white cursor-default">
              <motion.p initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="font-display text-4xl font-bold md:text-5xl">10x</motion.p>
              <p className="mt-2 text-sm text-white/80">faster insight to post</p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent relative z-[1]" />

      {/* How it works */}
      <section id="how-it-works" className="relative px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20 z-[1] bg-[#fafaf9]">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            How it works
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            Three steps to your next post
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 max-w-xl text-zinc-600">
            Connect tools. Insights surface. Draft & publish in under 3 min.
          </motion.p>
          <div className="mt-16 grid gap-8 md:grid-cols-3 md:items-stretch">
            {[
              {
                num: "01",
                title: "Connect sources",
                desc: "Link Slack, Zoom, Google, Gmail, repos. One-time setup, ~2 min.",
                icons: INTEGRATIONS,
              },
              {
                num: "02",
                title: "Insights surface",
                desc: "AI detects patterns. Confidence-scored. Sensitivity-flagged.",
                infographic: (
                  <div className="mt-6 space-y-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[var(--accent)] shrink-0" />
                        <p className="text-xs font-medium text-zinc-800 truncate">Why your best customers never complain</p>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500">Customer sync · 2d ago</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[var(--accent)] shrink-0" />
                        <p className="text-xs font-medium text-zinc-800 truncate">Hidden cost of quick decisions</p>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500">3 Slack threads · 1d ago</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-[var(--accent)]/5 p-2">
                      <span className="text-[10px] font-medium text-[var(--accent)]">+2 more insights</span>
                    </div>
                  </div>
                ),
              },
              {
                num: "03",
                title: "Draft & publish",
                desc: "Drafts in your voice. Edit, approve, publish to LinkedIn.",
                infographic: (
                  <div className="mt-6 space-y-2">
                    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-left">
                      <p className="text-[10px] text-zinc-500 mb-1">Draft preview</p>
                      <p className="text-xs text-zinc-700 line-clamp-3">Your best customers will never complain. That&apos;s not loyalty, that&apos;s silence. Proactively check in...</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Voice match</span>
                      <span className="text-[10px] font-medium text-emerald-600">✓ Your style</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg border border-zinc-200 py-2 flex items-center justify-center gap-1">
                        <FileEdit className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-[10px] font-medium text-zinc-600">Refine</span>
                      </div>
                      <div className="flex-1 rounded-lg bg-[var(--accent)] py-2 flex items-center justify-center gap-1">
                        <Send className="h-3.5 w-3.5 text-white" />
                        <span className="text-[10px] font-semibold text-white">Publish</span>
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((step, stepIndex) => (
              <motion.div
                key={step.num}
                {...stagger}
                transition={{ delay: 0.15 + stepIndex * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300 min-h-[300px] sm:min-h-[340px]"
              >
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] font-mono text-sm font-bold group-hover:scale-105 transition-transform duration-300">
                    {step.num}
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-zinc-900">{step.title}</h3>
                  <p className="mt-3 text-zinc-600">{step.desc}</p>
                  {step.icons && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {step.icons.map(({ name, icon: Icon, color, bg }) => (
                        <div
                          key={name}
                          className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 transition-all duration-200 group-hover:border-zinc-200 group-hover:bg-white"
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: bg }}
                          >
                            <Icon className="h-4 w-4" style={{ color }} />
                          </div>
                          <span className="w-full text-left text-xs font-medium text-zinc-600">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.infographic}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights surface when they matter */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] bg-white">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            Real-time triggers
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            Insights surface when they matter
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 max-w-2xl text-zinc-600">
            Detects moments: calls, threads, docs, code. Surfaces insights so you never miss.
          </motion.p>

          {/* Infographic: 4-trigger flow */}
          <div className="mt-16 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-200 to-transparent -translate-y-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {[
                {
                  icon: Video,
                  iconBg: "#e8f0fe",
                  iconColor: "#2D8CFF",
                  trigger: "Call ends",
                  action: "Insight extracted",
                  example: "Product sync → 3 key takeaways",
                  stat: "~2 min",
                },
                {
                  icon: MessageSquare,
                  iconBg: "#f5e6f5",
                  iconColor: "#4A154B",
                  trigger: "Thread deepens",
                  action: "Pattern detected",
                  example: "5 messages → consolidated view",
                  stat: "Real-time",
                },
                {
                  icon: FileText,
                  iconBg: "#e8f0fe",
                  iconColor: "#4285F4",
                  trigger: "Doc updated",
                  action: "Change captured",
                  example: "New metrics → draft prompt",
                  stat: "Instant",
                },
                {
                  icon: Calendar,
                  iconBg: "#ccfbf1",
                  iconColor: "#0d9488",
                  trigger: "Weekly wrap",
                  action: "Digest ready",
                  example: "7 insights → pick & draft",
                  stat: "Friday",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                <motion.div
                  key={item.trigger}
                  {...stagger}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex flex-col items-start text-left"
                >
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} className="relative z-10 w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-[var(--accent)]/30 transition-all">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl"
                      style={{ backgroundColor: item.iconBg }}
                    >
                      <Icon className="h-7 w-7" style={{ color: item.iconColor }} />
                    </div>
                    <p className="mt-4 font-semibold text-zinc-900">{item.trigger}</p>
                    <p className="mt-1 text-sm font-medium text-[var(--accent)]">{item.action}</p>
                    <p className="mt-3 text-xs text-zinc-500 leading-relaxed">{item.example}</p>
                    <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {item.stat}
                    </span>
                  </motion.div>
                  {i < 3 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-2 w-4 h-4 -translate-y-1/2 translate-x-1/2 items-center justify-center z-20">
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                    </div>
                  )}
                </motion.div>
              );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* For teams */}
      <section id="for-teams" className="relative px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] border-t border-zinc-200 bg-[#fafaf9] scroll-mt-20">
        <div className="relative mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <motion.span {...fadeUp} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
              <Linkedin className="h-3.5 w-3.5" />
              For teams
            </motion.span>
            <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-6 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
              Build clout from what you already do
            </motion.h2>
            <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 text-lg text-zinc-600">
              Inbound growth has always felt inconsistent and forced. We remove the friction.
            </motion.p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8 md:items-stretch">
            {/* What teams get - cards with icons */}
            <motion.div {...stagger} transition={{ delay: 0.15 }} className="flex flex-col space-y-4">
              <h3 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm">✓</span>
                What teams get
              </h3>
              {[
                { icon: Zap, color: "#f59e0b", bg: "#fef3c7", title: "Background sync", text: "Runs in background. Pulls insights from Slack, calls, docs." },
                { icon: Sliders, color: "#4f46e5", bg: "#e0e7ff", title: "Tone control", text: "Set tone. Educational, Inbound, Tactical. Curates for your audience." },
                { icon: Sparkles, color: "#4f46e5", bg: "#e0e7ff", title: "Smart insights", text: "Insights surface when they matter. One click to draft & publish." },
                { icon: Send, color: "#0d9488", bg: "#ccfbf1", title: "Consistency", text: "Consistency without the grind. Sounds like you." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    {...stagger}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-[var(--accent)]/20 transition-all"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: item.bg }}>
                      <Icon className="h-6 w-6" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{item.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Who it's for - role cards with icons */}
            <motion.div {...stagger} transition={{ delay: 0.2 }} className="flex flex-col space-y-4">
              <h3 className="font-display text-xl font-bold text-zinc-900 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm">✓</span>
                Who it&apos;s for
              </h3>
              {[
                { role: "Sales & GTM", benefit: "Deal insights → thought leadership. Inbound without cold outreach.", icon: Target, color: "#dc2626", bg: "#fee2e2" },
                { role: "Growth & Product teams", benefit: "Content from real experiments. No guessing.", icon: Zap, color: "#ea580c", bg: "#ffedd5" },
                { role: "Agencies", benefit: "Scale client content. One workspace per client.", icon: Building2, color: "#2563eb", bg: "#dbeafe" },
                { role: "Founders & operators", benefit: "Best ideas live in threads & calls. Surface them.", icon: Rocket, color: "#4f46e5", bg: "#e0e7ff" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    {...stagger}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex gap-4 rounded-xl border-l-4 bg-white p-5 shadow-sm hover:shadow-lg transition-all"
                    style={{ borderLeftColor: item.color }}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: item.bg }}>
                      <Icon className="h-6 w-6" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{item.role}</p>
                      <p className="mt-1 text-sm text-zinc-600">{item.benefit}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

        </div>
      </section>

      {/* Why Doubleclout */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] bg-white">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            Why DoubleClout
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            Built for the moments insights actually happen
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 max-w-xl text-zinc-600">
            Captures in real time. Slack, calls, docs, codebase.
          </motion.p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Always available", desc: "Lives in Slack. One click.", icon: MessageSquare, color: "#4A154B", bg: "#f5e6f5" },
              { title: "Precision targeting", desc: "Insights matched to your sources.", icon: Target, color: "#4f46e5", bg: "#e0e7ff" },
              { title: "Under 3 minutes", desc: "Drafts between meetings.", icon: Zap, color: "#4f46e5", bg: "#e0e7ff" },
              { title: "One-click publish", desc: "Draft, approve, publish to LinkedIn.", icon: Send, color: "#0A66C2", bg: "#e3f2fd" },
              { title: "Code & repos", desc: "Connect repos. Ship insights.", icon: Github, color: "#24292f", bg: "#f6f8fa" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  {...stagger}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-[var(--accent)]/20 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: f.bg }}>
                    <Icon className="h-6 w-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product mockup - Dashboard preview */}
      <section className="relative border-t border-zinc-200 px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] bg-[#fafaf9]">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            Your dashboard
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            From Slack to LinkedIn in minutes
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 max-w-xl text-zinc-600">
            Slack, calls, docs, repos → drafts → publish. No context switching.
          </motion.p>
          <motion.div
            {...stagger}
            transition={{ delay: 0.1 }}
            className="mt-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-200/50"
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-white border border-zinc-200 py-2 text-left text-sm text-zinc-500 px-3">
                dashboard.doubleclout.com
              </div>
            </div>
            <div className="flex flex-col md:flex-row min-h-[400px]">
              <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50/30 p-4 overflow-y-auto max-h-[280px] md:max-h-[420px]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Insights</p>
                  <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">4 new</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { title: "Why your best customers never complain", source: "Customer success sync", time: "Yesterday", tags: ["Customer Success", "Product"] },
                    { title: "The hidden cost of quick decisions", source: "3 Slack threads", time: "1d ago", tags: ["Leadership"] },
                    { title: "Every take-home should include AI", source: "Hiring discussion", time: "2d ago", tags: ["Hiring", "AI"] },
                    { title: "What we learned shipping the new API", source: "Repos · PR merged", time: "3d ago", tags: ["Engineering", "Dev"] },
                  ].map((insight, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                      <p className="font-medium text-zinc-900 text-sm">{insight.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{insight.source} · {insight.time}</p>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {insight.tags.map((tag) => (
                          <span key={tag} className="rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-xs text-[var(--accent)] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Draft</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Ready</span>
                </div>
                <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-sm font-medium text-zinc-900">Why your best customers never complain</p>
                  <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                    Your best customers will never complain. That&apos;s not loyalty, that&apos;s silence. We learned this from a customer success sync: the teams that file the fewest tickets often have the deepest issues. They just don&apos;t tell you.
                  </p>
                  <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                    The fix? Don&apos;t wait for tickets. Proactively check in. Your quietest customers might be your most at-risk.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                    Refine
                  </button>
                  <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
                    Publish to LinkedIn
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Open your dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative border-t border-zinc-200 px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] scroll-mt-20 bg-white">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            Pricing
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            Simple pricing
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 text-zinc-600 max-w-xl">
            Start free. Upgrade when you need more.
          </motion.p>

          {/* Monthly / Annual toggle - pill style */}
          <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="mt-12 flex flex-col items-start gap-4">
            <p className="text-sm font-medium text-zinc-500">Billing</p>
            <div className="inline-flex rounded-full border-2 border-zinc-200 bg-zinc-100/50 p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  !annual ? "bg-white text-zinc-900 shadow-md" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  annual ? "bg-[var(--accent)] text-white shadow-md" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Annual
                <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-[var(--accent)]">Save 20%</span>
              </button>
            </div>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                period: "",
                desc: "Try it out",
                features: ["1 Slack workspace", "2 sources (Slack + Zoom or Google)", "10 insights/month", "Basic tone", "Dashboard"],
                cta: "Get started free",
                href: "/login",
                highlighted: false,
              },
              {
                name: "Pro",
                price: annual ? "$23" : "$29",
                period: "/mo",
                desc: "For individuals",
                features: ["Unlimited insights", "All sources (Slack, Zoom, Google, Gmail, repos)", "Tone filters: Educational, Inbound, Tactical", "Publish to LinkedIn", "Voice match", "Sensitivity controls"],
                cta: "Start Pro trial",
                href: "/login",
                highlighted: true,
              },
              {
                name: "Business",
                price: "Custom",
                period: "",
                desc: "For teams",
                features: ["Everything in Pro", "Team workspace", "Role-based access", "Code repos & dev tools", "Priority support", "Custom integrations"],
                cta: "Contact sales",
                href: "/login",
                highlighted: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`rounded-2xl border p-5 sm:p-6 flex flex-col transition-shadow duration-300 hover:shadow-xl ${
                  plan.highlighted ? "border-[var(--accent)] bg-white shadow-lg shadow-[var(--accent)]/10 md:scale-[1.02]" : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <h3 className="font-display text-xl font-bold text-zinc-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">{plan.price}</span>
                  {plan.period && <span className="text-zinc-500">{plan.period}</span>}
                </div>
                <p className="mt-1 text-sm text-zinc-500">{plan.desc}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                className={`mt-6 block w-full rounded-lg py-3 text-center font-semibold transition-all duration-200 ${
                  plan.highlighted ? "bg-[var(--accent)] text-white hover:opacity-90 hover:scale-[1.02]" : "border border-zinc-300 text-zinc-900 hover:bg-zinc-50"
                }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Enterprise */}
      <section className="relative border-t border-zinc-200 px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] bg-zinc-100">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            For Enterprise
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-2 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            Invest in your team&apos;s execution
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 text-zinc-600 max-w-2xl">
            Lost insights cost companies in missed opportunities. DoubleClout captures them from Slack, calls, docs, and repos, before they&apos;re gone.
          </motion.p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { value: "80%", label: "of insights lost in threads & calls", sub: "Without DoubleClout" },
              { value: "10x", label: "faster to publish", sub: "With DoubleClout" },
              { value: "2 min", label: "to connect your sources", sub: "One-time setup" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                {...stagger}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="rounded-xl border border-zinc-200 bg-white p-6 hover:border-[var(--accent)]/30 transition-colors"
              >
                <p className="font-display text-3xl font-bold text-[var(--accent)]">{stat.value}</p>
                <p className="mt-1.5 text-sm text-zinc-600">{stat.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Contact for Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-zinc-200 px-4 sm:px-6 py-12 sm:py-16 md:py-24 overflow-hidden z-[1] bg-[#fafaf9]">
        <div className="relative mx-auto max-w-5xl">
          <motion.span {...fadeUp} className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            Get started
          </motion.span>
          <motion.h2 {...fadeUp} transition={{ delay: 0.05 }} className="mt-4 font-display text-3xl font-bold text-zinc-900 md:text-4xl">
            Start surfacing insights today
          </motion.h2>
          <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="mt-4 text-zinc-600">
            Connect tools. Get insights. Publish to LinkedIn.
          </motion.p>
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 sm:px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 min-h-[48px]"
            >
              Get started free
            </Link>
            <a href="#how-it-works" className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full border-t border-zinc-200 py-8 z-[1] bg-white">
        <div className="mx-auto flex max-w-5xl w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-4 sm:px-0">
          <div className="flex flex-col gap-1">
            <Link href="/" className="flex items-center gap-2 font-display font-semibold text-zinc-900">
              <Image src="/dc_logo.svg" alt="Doubleclout" width={24} height={24} className="h-6 w-6" unoptimized />
              DoubleClout
            </Link>          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-display text-sm text-zinc-600 leading-relaxed">
            <a href="#how-it-works" className="hover:text-[var(--accent)] transition-colors pb-px">How it works</a>
            <a href="#pricing" className="hover:text-[var(--accent)] transition-colors pb-px">Pricing</a>
            <a href="#for-teams" className="hover:text-[var(--accent)] transition-colors pb-px">For Teams</a>
            <Link href="/login" className="hover:text-[var(--accent)] transition-colors pb-px">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
