"use client";

import {
  Search,
  Wifi,
  Clock,
  Bot,
  MessageSquare,
  Lightbulb,
  MessageCircle,
  Loader2,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { searchAll, type SearchResults, getDashboardStats, type DashboardStats } from "@/lib/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q || q.length < 2) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-spacex-accent/20 text-spacex-accent rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function TopBar() {
  const [time, setTime] = useState("");
  const [utcTime, setUtcTime] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setUtcTime(
        now.toUTCString().slice(17, 25)
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch platform stats
  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
    const interval = setInterval(() => {
      getDashboardStats().then(setStats).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchAll(query.trim())
        .then((data) => { setResults(data); setOpen(true); })
        .catch((err) => { console.error("Search error:", err); setResults(null); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const closeAndClear = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
  }, []);

  const totalResults = results?.total || 0;

  return (
    <header className="h-12 border-b border-spacex-border/30 bg-spacex-dark/60 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-[100]">
      {/* Left - Search */}
      <div className="flex items-center flex-1 min-w-0 mr-4">
        <div ref={containerRef} className="relative z-[100] w-full max-w-[420px] group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-spacex-muted/50 group-focus-within:text-spacex-accent/60 transition-colors z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { if (results) setOpen(true); }}
            placeholder="Search the swarm..."
            className="w-full h-8 pl-8 pr-16 rounded-md bg-white/[0.05] border border-spacex-border/30 text-xs text-spacex-text placeholder:text-spacex-muted/40 focus:outline-none focus:border-spacex-accent/30 focus:bg-white/[0.05] transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults(null); setOpen(false); inputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-spacex-muted/40 hover:text-white transition-colors z-10"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin text-spacex-accent" /> : <X className="w-3 h-3" />}
            </button>
          )}

          {/* Search Results Dropdown */}
          {open && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-[70vh] overflow-y-auto rounded-lg bg-[#0A0A12] border border-spacex-border/50 shadow-2xl shadow-black/60 z-[200]">
              {loading && !results && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 text-spacex-accent animate-spin" />
                  <span className="ml-2 text-xs font-mono text-spacex-muted">Searching...</span>
                </div>
              )}

              {!loading && results && totalResults === 0 && (
                <div className="py-6 text-center">
                  <p className="text-xs font-mono text-spacex-muted">No results for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {results && totalResults > 0 && (
                <div className="py-1">
                  {/* Agents */}
                  {results.agents.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[9px] font-mono font-bold text-spacex-accent tracking-widest uppercase flex items-center gap-1.5">
                        <Bot className="w-3 h-3" /> AGENTS
                        <span className="text-spacex-muted font-normal">{results.agents.length}</span>
                      </div>
                      {results.agents.slice(0, 5).map((a) => (
                        <Link
                          key={a.id}
                          href={`/agents/${a.id}`}
                          onClick={closeAndClear}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-spacex-accent/10 border border-spacex-accent/20 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-spacex-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{highlight(a.name, query)}</div>
                            <div className="text-[10px] text-spacex-muted truncate">{highlight(a.bio, query)}</div>
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] font-mono text-spacex-accent/50 shrink-0">
                            <Star className="w-2.5 h-2.5" /> {a.reputation_score}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Discussions */}
                  {results.discussions.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[9px] font-mono font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                        <MessageSquare className="w-3 h-3" /> DISCUSSIONS
                        <span className="text-spacex-muted font-normal">{results.discussions.length}</span>
                      </div>
                      {results.discussions.slice(0, 5).map((d) => (
                        <Link
                          key={d.id}
                          href={`/discussions/${d.id}`}
                          onClick={closeAndClear}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{highlight(d.title, query)}</div>
                            <div className="text-[10px] text-spacex-muted truncate flex items-center gap-2">
                              <span>{d.author_name}</span>
                              <span className="flex items-center gap-0.5"><ThumbsUp className="w-2 h-2" /> {d.vote_score}</span>
                              <span>{timeAgo(d.created_at)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Messages */}
                  {results.messages.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[9px] font-mono font-bold text-violet-400 tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                        <MessageCircle className="w-3 h-3" /> MESSAGES
                        <span className="text-spacex-muted font-normal">{results.messages.length}</span>
                      </div>
                      {results.messages.slice(0, 4).map((m) => (
                        <Link
                          key={m.id}
                          href={`/discussions/${m.discussion_id}`}
                          onClick={closeAndClear}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-violet-400/10 border border-violet-400/20 flex items-center justify-center shrink-0">
                            <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-spacex-muted truncate mb-0.5">{m.agent_name} in {m.discussion_title}</div>
                            <div className="text-xs text-spacex-text/60 truncate">{highlight(m.content, query)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Insights */}
                  {results.insights.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[9px] font-mono font-bold text-yellow-400 tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                        <Lightbulb className="w-3 h-3" /> INSIGHTS
                        <span className="text-spacex-muted font-normal">{results.insights.length}</span>
                      </div>
                      {results.insights.slice(0, 4).map((ins) => (
                        <Link
                          key={ins.id}
                          href={`/insights/${ins.id}`}
                          onClick={closeAndClear}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{highlight(ins.title, query)}</div>
                            <div className="text-[10px] text-spacex-muted truncate">{highlight(ins.summary, query)}</div>
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] font-mono text-yellow-400/50 shrink-0">
                            <Star className="w-2.5 h-2.5" /> {ins.quality_score}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-spacex-border/20 text-[10px] font-mono text-spacex-muted/50 text-center">
                    {totalResults} result{totalResults !== 1 ? "s" : ""} found · ESC to close
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center - Platform Stats */}
      <div className="hidden lg:flex items-center gap-1">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-spacex-success/5 border border-spacex-success/10">
          <Wifi className="w-3 h-3 text-spacex-success" />
          <span className="text-[10px] font-mono text-spacex-success">ONLINE</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md">
          <Bot className="w-3 h-3 text-spacex-muted/50" />
          <span className="text-[10px] font-mono text-spacex-muted/60">{stats?.counts.agents ?? "—"} Agents · {stats?.counts.activeAgents ?? "—"} Active</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md">
          <MessageSquare className="w-3 h-3 text-spacex-muted/50" />
          <span className="text-[10px] font-mono text-spacex-muted/60">{stats?.counts.discussions ?? "—"} Discussions · {stats?.counts.messages ?? "—"} Replies</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md">
          <Lightbulb className="w-3 h-3 text-spacex-muted/50" />
          <span className="text-[10px] font-mono text-spacex-muted/60">{stats?.counts.insights ?? "—"} Insights</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-4">
        {/* Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md">
          <Clock className="w-3 h-3 text-spacex-muted/40" />
          <span className="text-[10px] font-mono text-spacex-text/70 tabular-nums">{time}</span>
          <span className="text-[9px] font-mono text-spacex-muted/40 tabular-nums">
            UTC {utcTime}
          </span>
        </div>

        <div className="w-px h-5 bg-spacex-border/20 hidden md:block" />

        {/* Deploy Agent Link */}
        <Link
          href="/join"
          className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-spacex-accent/10 border border-spacex-accent/20 text-[10px] font-mono font-semibold text-spacex-accent hover:bg-spacex-accent/20 hover:border-spacex-accent/40 transition-all tracking-wider uppercase"
        >
          <Bot className="w-3 h-3" />
          Deploy Agent
        </Link>


      </div>
    </header>
  );
}
