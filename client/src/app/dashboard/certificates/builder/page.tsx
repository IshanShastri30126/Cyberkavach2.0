"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Save, Upload, Layout, Settings2, Crop, Scissors, Image as ImageIcon, PenTool, Layers, MoveUp, MoveDown, Download, ZoomIn, ZoomOut, Palette, Check, X, ClipboardPaste } from "lucide-react";
import dynamic from "next/dynamic";
import { CanvasNode } from "@/components/KonvaEditor";
import { v4 as uuidv4 } from "uuid";
import { CERTIFICATE_TEMPLATES, ThemeColors } from "@/lib/certificate-templates";

const KonvaEditor = dynamic(() => import("@/components/KonvaEditor").then((mod) => mod.KonvaEditor), {
  ssr: false,
});

export default function CertificateBuilderPage() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [templateName, setTemplateName] = useState("");
  
  // Theme and Template State
  const [activeTemplate, setActiveTemplate] = useState(CERTIFICATE_TEMPLATES[0]);
  const [themeColors, setThemeColors] = useState<ThemeColors>(CERTIFICATE_TEMPLATES[0].theme);
  
  // Nodes state
  const [nodes, setNodes] = useState<CanvasNode[]>(activeTemplate.nodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [clipboard, setClipboard] = useState<CanvasNode | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  
  const [facultyName, setFacultyName] = useState("Dr. Anjali Mehta");
  const [facultyTitle, setFacultyTitle] = useState("Head of Department");

  useEffect(() => {
    if (!token) return;
    const fetchEvents = async () => {
      try {
        const data = await api<{ events: any[] }>("/events/all", { token });
        setEvents(data.events);
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    };
    fetchEvents();
  }, [token]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = events.find(e => e.id === eventId);
    setSelectedEvent(ev || null);
  };

  const handleTemplateSwitch = (templateId: string) => {
    const template = CERTIFICATE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setActiveTemplate(template);
    setThemeColors(template.theme);
    
    // Preserve custom nodes (logos, signatures)
    const customNodes = nodes.filter(n => n.isLogo || n.isSignature || n.id.startsWith("custom-"));
    setNodes([...template.nodes, ...customNodes]);
    setSelectedId(null);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setThemeColors(prev => ({ ...prev, [key]: value }));
  };

  // Tool Handlers
  const handleCut = () => {
    if (selectedId) {
      const node = nodes.find(n => n.id === selectedId);
      if (node) {
        setClipboard(node);
        setNodes(nodes.filter(n => n.id !== selectedId));
        setSelectedId(null);
      }
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const newNode = { ...clipboard, id: uuidv4(), x: clipboard.x + 20, y: clipboard.y + 20 };
      setNodes([...nodes, newNode]);
      setSelectedId(newNode.id);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newNode: CanvasNode = {
          id: `custom-logo-${uuidv4()}`, type: "image", x: 600, y: 50, rotation: 0, scaleX: 1, scaleY: 1,
          width: 100, height: 100, src: ev.target?.result as string, isLogo: true
        };
        setNodes([...nodes, newNode]);
        setSelectedId(newNode.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const placeLogo = (position: 'top-left' | 'top-center' | 'top-right') => {
    if (!selectedId) return;
    setNodes(nodes.map(n => {
      if (n.id === selectedId) {
        let x = n.x;
        if (position === 'top-left') x = 50;
        if (position === 'top-center') x = 400 - (n.width || 100) / 2;
        if (position === 'top-right') x = 750 - (n.width || 100);
        return { ...n, x, y: 50 };
      }
      return n;
    }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const sigId = `custom-sig-${uuidv4()}`;
        const nameId = `custom-sig-name-${uuidv4()}`;
        const titleId = `custom-sig-title-${uuidv4()}`;
        
        const sigNode: CanvasNode = {
          id: sigId, type: "image", x: 600, y: 400, rotation: 0, scaleX: 1, scaleY: 1,
          width: 150, height: 80, src: ev.target?.result as string, isSignature: true
        };
        const nameNode: CanvasNode = {
          id: nameId, type: "text", x: 600, y: 490, rotation: 0, scaleX: 1, scaleY: 1,
          text: facultyName, fontSize: 16, fontFamily: "sans-serif", fill: themeColors.text, align: "center", width: 150, isSignature: true
        };
        const titleNode: CanvasNode = {
          id: titleId, type: "text", x: 600, y: 510, rotation: 0, scaleX: 1, scaleY: 1,
          text: facultyTitle, fontSize: 12, fontFamily: "sans-serif", fill: themeColors.text, align: "center", width: 150, isSignature: true
        };
        setNodes([...nodes, sigNode, nameNode, titleNode]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropApply = (cropData: any) => {
    if (selectedId) {
      setNodes(nodes.map(n => n.id === selectedId ? { ...n, crop: cropData } : n));
    }
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    const index = nodes.findIndex(n => n.id === selectedId);
    if (index === -1) return;
    
    if (direction === 'up' && index < nodes.length - 1) {
      const newNodes = [...nodes];
      [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
      setNodes(newNodes);
    } else if (direction === 'down' && index > 0) {
      const newNodes = [...nodes];
      [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
      setNodes(newNodes);
    }
  };

  const handleExport = async () => {
    // Basic export via saving nodes config
    handleSave();
  };

  const handleSave = async () => {
    if (!templateName.trim()) return alert("Template name is required");
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", templateName);
      
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        formData.append("template", new File([blob], "gradient_placeholder.png", { type: "image/png" }));
      }
      
      const fieldsConfig = {
        type: "canvas_builder",
        themeColors,
        templateId: activeTemplate.id,
        nodes: nodes
      };
      
      formData.append("fields", JSON.stringify(fieldsConfig));
      
      await apiUpload("/certificates/templates", formData, token || undefined);
      alert("Template saved successfully!");
      router.push("/dashboard/certificates");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const getEventTitle = () => selectedEvent ? selectedEvent.title : "[Event Title]";
  const getEventDate = () => {
    if (!selectedEvent) return "[Event Date]";
    return new Date(selectedEvent.startDate).toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col text-white bg-zinc-950 p-2 rounded-2xl overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-black/40 rounded-t-xl shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Layout className="w-5 h-5 text-red-500" /> Certificate Studio
          </h1>
          <div className="h-6 w-px bg-zinc-800" />
          <input 
            className="bg-transparent border-none text-sm text-slate-300 placeholder-slate-600 focus:ring-0 w-64" 
            placeholder="Untitled Template..." 
            value={templateName} 
            onChange={(e) => setTemplateName(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="ck-input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-800 w-48" 
            value={selectedEventId} 
            onChange={(e) => handleEventSelect(e.target.value)}
          >
            <option value="">Select Event (Preview)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <button onClick={handleExport} disabled={saving} className="bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PNG
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Deploy Template
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: Tools & Colors */}
        <div className="w-72 border-r border-zinc-800/50 bg-black/30 overflow-y-auto p-4 space-y-6 shrink-0 custom-scrollbar">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" /> Theme Colors
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'primary', label: 'Primary' },
                { key: 'background', label: 'Background' },
                { key: 'text', label: 'Text Color' },
                { key: 'accent', label: 'Accent Color' }
              ].map(c => (
                <div key={c.key} className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase">{c.label}</label>
                  <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                    <input 
                      type="color" 
                      value={themeColors[c.key as keyof ThemeColors]} 
                      onChange={(e) => handleColorChange(c.key as keyof ThemeColors, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs text-slate-300 font-mono">{themeColors[c.key as keyof ThemeColors]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" /> Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setIsCropping(!isCropping)}
                className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 transition-colors border ${isCropping ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-slate-300'}`}
              >
                <Crop className="w-4 h-4" /> {isCropping ? 'Done Cropping' : 'Crop'}
              </button>
              <button onClick={handleCut} className="p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors">
                <Scissors className="w-4 h-4" /> Cut
              </button>
              <button onClick={handlePaste} disabled={!clipboard} className="p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors disabled:opacity-50">
                <ClipboardPaste className="w-4 h-4" /> Paste
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" /> Organization Logo
            </h3>
            <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
            <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs transition-colors">
              + Upload Logo
            </button>
            <div className="flex gap-1">
              <button onClick={() => placeLogo('top-left')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white">Top L</button>
              <button onClick={() => placeLogo('top-center')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white">Center</button>
              <button onClick={() => placeLogo('top-right')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white">Top R</button>
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-400" /> Auto-Themed Signature
            </h3>
            <input 
              className="ck-input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-800 w-full" 
              placeholder="Faculty Name" 
              value={facultyName} onChange={e => setFacultyName(e.target.value)} 
            />
            <input 
              className="ck-input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-800 w-full" 
              placeholder="Designation" 
              value={facultyTitle} onChange={e => setFacultyTitle(e.target.value)} 
            />
            <input type="file" accept="image/png" className="hidden" ref={signatureInputRef} onChange={handleSignatureUpload} />
            <button onClick={() => signatureInputRef.current?.click()} className="w-full py-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 rounded-lg text-xs transition-colors">
              + Upload Signature (PNG)
            </button>
          </div>

          {selectedId && (
            <>
              <div className="w-full h-px bg-zinc-800/50" />
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-pink-400" /> Selected Element
                </h3>
                {(() => {
                  const node = nodes.find(n => n.id === selectedId);
                  if (!node) return null;
                  return (
                    <div className="space-y-2">
                      {(node.type === 'text' || node.isSignature) && (
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase">{node.isSignature ? 'Signature Color' : 'Text Color'}</label>
                          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 mt-1">
                            <input 
                              type="color" 
                              value={node.fill || themeColors.primary} 
                              onChange={(e) => setNodes(nodes.map(n => n.id === selectedId ? { ...n, fill: e.target.value } : n))}
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <span className="text-xs text-slate-300 font-mono">{node.fill || themeColors.primary}</span>
                          </div>
                        </div>
                      )}
                      {node.type === 'shape' && (
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase">Shape Fill Color</label>
                          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 mt-1">
                            <input 
                              type="color" 
                              value={node.fill || '#000000'} 
                              onChange={(e) => setNodes(nodes.map(n => n.id === selectedId ? { ...n, fill: e.target.value } : n))}
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <span className="text-xs text-slate-300 font-mono">{node.fill || '#000000'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

        </div>

        {/* CENTER CANVAS */}
        <div className="flex-1 bg-zinc-950/80 relative flex flex-col">
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <KonvaEditor 
              nodes={nodes} 
              setNodes={setNodes} 
              eventTitle={getEventTitle()} 
              eventDate={getEventDate()} 
              backgroundColor={themeColors.background}
              themeColor={themeColors.primary}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              isCropping={isCropping}
              onCropApply={handleCropApply}
              scale={zoom}
            />
          </div>

          {/* BOTTOM BAR: Zoom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-zinc-800/50 px-4 py-2 rounded-full">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 hover:text-white text-slate-400"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-mono w-12 text-center text-slate-300">{Math.round(zoom * 100)}%</span>
            <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-24 accent-white" />
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:text-white text-slate-400"><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Templates & Layers */}
        <div className="w-64 border-l border-zinc-800/50 bg-black/30 overflow-y-auto p-4 space-y-6 shrink-0 custom-scrollbar">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layout className="w-4 h-4 text-pink-400" /> Templates
            </h3>
            <div className="space-y-2">
              {CERTIFICATE_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => handleTemplateSwitch(t.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all ${activeTemplate.id === t.id ? 'bg-pink-500/20 border border-pink-500/50 text-pink-100' : 'bg-zinc-900 border border-zinc-800 text-slate-400 hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center justify-between">
                    {t.name}
                    {activeTemplate.id === t.id && <Check className="w-3.5 h-3.5 text-pink-400" />}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.primary }} />
                    <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.background }} />
                    <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.accent }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Layers
            </h3>
            <div className="flex gap-2">
              <button onClick={() => moveLayer('up')} className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <MoveUp className="w-3.5 h-3.5" /> Forward
              </button>
              <button onClick={() => moveLayer('down')} className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <MoveDown className="w-3.5 h-3.5" /> Backward
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
