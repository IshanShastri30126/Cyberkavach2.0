"use client";

import React, { useEffect, useState } from "react";
import { api, getFileUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Search, Tag, Users, Clock, MapPin, Shield } from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  slug: string;
  tags: string[];
  eventType: string;
  posterUrl?: string;
  creator: { name: string; role: string };
  _count: { registrations: number };
}

export default function PublicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const data = await api<{ events: Event[] }>(`/events${qs}`);
        setEvents(data.events);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchQuery]);

  const now = new Date();
  const filteredEvents = events.filter((ev) => {
    if (timeFilter === "upcoming") return new Date(ev.startDate) >= now;
    if (timeFilter === "past") return new Date(ev.endDate) < now;
    return true;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative pt-24 pb-12 overflow-hidden border-b border-red-950/40">
        <div className="absolute inset-0 bg-radial-gradient from-red-900/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
              <span className="text-sm font-bold text-red-400 font-mono tracking-widest uppercase">CyberKavach Operations</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 uppercase font-mono tracking-tighter">Public Events</h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              Discover and participate in upcoming cybersecurity workshops, hackathons, and community meetups.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="relative w-full md:max-w-md ck-input-icon-wrapper">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50" />
            <input 
              className="ck-input pl-10" 
              placeholder="Search by title, description..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-red-900/20 w-full md:w-auto overflow-x-auto">
            {(["upcoming", "past", "all"] as const).map((t) => (
              <button key={t} onClick={() => setTimeFilter(t)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition ${timeFilter === t ? "bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]" : "text-slate-400 hover:text-red-400"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/40 rounded-2xl border border-red-950/30">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-widest">No Events Found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, i) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/events/${event.slug}`} className="block h-full">
                  <div className="ck-card bg-black/40 border-red-950/30 hover:border-red-500/40 hover:bg-zinc-950/80 transition-all duration-300 h-full flex flex-col group overflow-hidden">
                    {/* Event Poster / Banner */}
                    <div className="h-48 relative overflow-hidden bg-zinc-900">
                      {event.posterUrl ? (
                        <img 
                          src={getFileUrl(event.posterUrl)} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-950 to-black">
                          <Shield className="w-16 h-16 text-red-900 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        {event.tags.slice(0, 2).map(t => (
                          <span key={t} className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono bg-red-600/80 text-white rounded shadow-sm backdrop-blur-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-xl font-bold font-mono tracking-tighter text-white mb-2 group-hover:text-red-400 transition-colors line-clamp-2">
                        {event.title}
                      </h2>
                      <div className="space-y-2 mb-4 flex-1">
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{new Date(event.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{new Date(event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </p>
                        {event.venue && (
                          <p className="text-xs text-slate-400 flex items-center gap-2 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-red-950/40 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {event._count.registrations} Enrolled
                        </span>
                        <span className="text-xs font-bold text-red-400 group-hover:text-red-300 flex items-center gap-1 font-mono uppercase tracking-wider transition-colors">
                          View Details &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
