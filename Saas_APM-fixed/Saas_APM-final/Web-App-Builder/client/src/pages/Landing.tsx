import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BrainCircuit, ChevronRight, BarChart2, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-md fixed w-full z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              PM-AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </a>
            <a href="/api/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl text-center relative">
          
          {/* Background decorative blobs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10" />

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-8 animate-in">
            Your Autonomous <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-purple-600">
              Product Manager
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in delay-100">
            Stop guessing what to build next. PM-AI analyzes user behavior and feedback in real-time to generate high-impact product strategies.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in delay-200">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105">
                Start for Free <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="/api/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary">
                View Demo
              </Button>
            </a>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in delay-300">
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-black p-4 md:p-8">
              <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-[32px] border border-border bg-background p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Product health</p>
                      <h2 className="text-2xl font-semibold mt-2">Customer motion</h2>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 rounded-full bg-muted w-3/4" />
                    <div className="h-3 rounded-full bg-muted w-1/2" />
                    <div className="grid grid-cols-3 gap-3 pt-6">
                      <div className="rounded-3xl bg-primary/10 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Retention</p>
                        <p className="mt-3 text-3xl font-bold">+18%</p>
                      </div>
                      <div className="rounded-3xl bg-accent/10 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Revenue</p>
                        <p className="mt-3 text-3xl font-bold">$34k</p>
                      </div>
                      <div className="rounded-3xl bg-emerald-100 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sentiment</p>
                        <p className="mt-3 text-3xl font-bold">+12%</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[32px] border border-border bg-background p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Live insights</p>
                    <h3 className="text-2xl font-semibold mt-3">Feature adoption</h3>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="h-2 rounded-full bg-muted/80 w-full" />
                    <div className="h-2 rounded-full bg-muted/80 w-5/6" />
                    <div className="h-2 rounded-full bg-muted/80 w-2/3" />
                    <div className="h-2 rounded-full bg-muted/80 w-3/4" />
                  </div>
                  <div className="mt-8 rounded-3xl bg-secondary/70 p-4">
                    <p className="text-sm text-muted-foreground">Latest recommendation</p>
                    <p className="mt-2 font-semibold">Reduce onboarding friction for new users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                <BarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Analytics</h3>
              <p className="text-muted-foreground">
                Track every user interaction as it happens. Visualized beautifully instantly.
              </p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Reasoning</h3>
              <p className="text-muted-foreground">
                Our AI doesn't just summarize; it reasons about retention and revenue impact.
              </p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Enterprise Ready</h3>
              <p className="text-muted-foreground">
                Secure, scalable, and built for teams. Role-based access control included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-auto">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2024 PM-AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
