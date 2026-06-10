"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, SERVER_BASE_URL } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Save, Upload, Layout, Settings2, Crop, Scissors, Image as ImageIcon, 
  PenTool, Layers, MoveUp, MoveDown, Download, ZoomIn, ZoomOut, 
  Palette, Check, X, ClipboardPaste, CheckCircle, AlertCircle, 
  Type, Square, Circle, Minus, PlusCircle, Trash2, AlignLeft, 
  AlignCenter, AlignRight, Bold, Italic 
} from "lucide-react";
import dynamic from "next/dynamic";
import { CanvasNode } from "@/components/KonvaEditor";
import { v4 as uuidv4 } from "uuid";
import { CERTIFICATE_TEMPLATES, ThemeColors } from "@/lib/certificate-templates";
import { motion, AnimatePresence } from "framer-motion";

const KonvaEditor = dynamic(() => import("@/components/KonvaEditor").then((mod) => mod.KonvaEditor), {
  ssr: false,
});

function CertificateBuilderContent() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [templateName, setTemplateName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
  
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

  // Mobile layout state
  const [isMobile, setIsMobile] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"canvas" | "theme" | "tools" | "templates">("canvas");

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load templates from API
  useEffect(() => {
    if (!token) return;
    const fetchTemplates = async () => {
      try {
        const data = await api<{ templates: any[] }>("/certificates/templates", { token });
        setUserTemplates(data.templates);
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    };
    fetchTemplates();
  }, [token]);

  // Pre-load template if templateIdParam is present
  useEffect(() => {
    if (templateIdParam && userTemplates.length > 0) {
      const template = userTemplates.find(t => t.id === templateIdParam);
      if (template) {
        setTemplateName(template.name);
        if (template.fileUrl) {
          setBackgroundUrl(`${SERVER_BASE_URL}${template.fileUrl}`);
        }
        if (template.fields && template.fields.type === "canvas_builder") {
          if (template.fields.themeColors) {
            setThemeColors(template.fields.themeColors);
          }
          if (template.fields.nodes) {
            setNodes(template.fields.nodes);
          }
        } else {
          // If raw template background image, load default nodes
          setNodes([
            { id: `t-name-${uuidv4()}`, type: "text", x: 100, y: 240, text: "[Recipient Name]", fontSize: 36, fontFamily: "serif", fontStyle: "italic", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName", rotation: 0, scaleX: 1, scaleY: 1 },
            { id: `t-title-${uuidv4()}`, type: "text", x: 100, y: 320, text: "For successfully participating in [Event Title]", fontSize: 16, fontFamily: "sans-serif", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "eventTitle", rotation: 0, scaleX: 1, scaleY: 1 },
            { id: `t-date-${uuidv4()}`, type: "text", x: 250, y: 370, text: "[Event Date]", fontSize: 14, fontFamily: "sans-serif", fill: "#555555", align: "center", width: 300, isPlaceholder: true, placeholderType: "eventDate", rotation: 0, scaleX: 1, scaleY: 1 },
            { id: `t-code-${uuidv4()}`, type: "text", x: 250, y: 470, text: "CK-XXXX-XXXX", fontSize: 12, fontFamily: "mono", fill: "#888888", align: "center", width: 300, isPlaceholder: true, placeholderType: "uniqueCode", rotation: 0, scaleX: 1, scaleY: 1 }
          ]);
        }
        showToast(`Editing custom template: ${template.name}`, "info");
      }
    }
  }, [templateIdParam, userTemplates, showToast]);

  // Auto-zoom to fit screen width on mobile and track isMobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        const padding = 32;
        const availableWidth = window.innerWidth - padding;
        if (availableWidth < 800) {
          setZoom(Math.max(0.35, Math.min(1, availableWidth / 800)));
        } else {
          setZoom(1);
        }
      } else {
        setZoom(1);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    setBackgroundUrl(""); // clear custom uploaded background image
    
    // Preserve custom nodes
    const customNodes = nodes.filter(n => n.isLogo || n.isSignature || n.id.startsWith("custom-") || n.id.startsWith("text-") || n.id.startsWith("shape-"));
    setNodes([...template.nodes, ...customNodes]);
    setSelectedId(null);
    showToast(`Switched to template: ${template.name}`, "success");
  };

  const handleUserTemplateSwitch = (template: any) => {
    setTemplateName(template.name);
    if (template.fileUrl) {
      setBackgroundUrl(`${SERVER_BASE_URL}${template.fileUrl}`);
    }
    
    if (template.fields && template.fields.type === "canvas_builder") {
      if (template.fields.themeColors) setThemeColors(template.fields.themeColors);
      if (template.fields.nodes) setNodes(template.fields.nodes);
    } else {
      // Default nodes for raw uploaded template image background
      setNodes([
        { id: `t-name-${uuidv4()}`, type: "text", x: 100, y: 240, text: "[Recipient Name]", fontSize: 36, fontFamily: "serif", fontStyle: "italic", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName", rotation: 0, scaleX: 1, scaleY: 1 },
        { id: `t-title-${uuidv4()}`, type: "text", x: 100, y: 320, text: "For successfully participating in [Event Title]", fontSize: 16, fontFamily: "sans-serif", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "eventTitle", rotation: 0, scaleX: 1, scaleY: 1 },
        { id: `t-date-${uuidv4()}`, type: "text", x: 250, y: 370, text: "[Event Date]", fontSize: 14, fontFamily: "sans-serif", fill: "#555555", align: "center", width: 300, isPlaceholder: true, placeholderType: "eventDate", rotation: 0, scaleX: 1, scaleY: 1 },
        { id: `t-code-${uuidv4()}`, type: "text", x: 250, y: 470, text: "CK-XXXX-XXXX", fontSize: 12, fontFamily: "mono", fill: "#888888", align: "center", width: 300, isPlaceholder: true, placeholderType: "uniqueCode", rotation: 0, scaleX: 1, scaleY: 1 }
      ]);
    }
    setSelectedId(null);
    showToast(`Loaded background template: ${template.name}`, "success");
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
        showToast("Cut element to clipboard", "info");
      }
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const newNode = { ...clipboard, id: uuidv4(), x: clipboard.x + 20, y: clipboard.y + 20 };
      setNodes([...nodes, newNode]);
      setSelectedId(newNode.id);
      showToast("Pasted element", "success");
    }
  };

  // Add generic text element
  const addTextNode = (placeholderType?: string) => {
    let defaultText = "Double click to edit";
    let isPlaceholder = false;
    if (placeholderType === "recipientName") {
      defaultText = "[Recipient Name]";
      isPlaceholder = true;
    } else if (placeholderType === "eventTitle") {
      defaultText = "[Event Title]";
      isPlaceholder = true;
    } else if (placeholderType === "eventDate") {
      defaultText = "[Event Date]";
      isPlaceholder = true;
    } else if (placeholderType === "uniqueCode") {
      defaultText = "CK-XXXX-XXXX";
      isPlaceholder = true;
    }

    const newNode: CanvasNode = {
      id: `text-${uuidv4()}`,
      type: "text",
      x: 250,
      y: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      text: defaultText,
      fontSize: 24,
      fontFamily: "sans-serif",
      fill: themeColors.text || "#333333",
      align: "center",
      width: 300,
      isPlaceholder,
      placeholderType
    };
    setNodes([...nodes, newNode]);
    setSelectedId(newNode.id);
    showToast(`Added text element`, "success");
  };

  // Add custom shape
  const addShapeNode = (shapeType: "rect" | "circle" | "line") => {
    const id = `shape-${uuidv4()}`;
    let newNode: CanvasNode;
    if (shapeType === "rect") {
      newNode = {
        id,
        type: "shape",
        x: 300, y: 200,
        width: 150, height: 100,
        fill: themeColors.primary || "#B8860B",
        stroke: themeColors.accent || "#DAA520",
        strokeWidth: 2,
        radius: 0,
        rotation: 0, scaleX: 1, scaleY: 1
      };
    } else if (shapeType === "circle") {
      newNode = {
        id,
        type: "shape",
        x: 350, y: 200,
        width: 100, height: 100,
        fill: themeColors.primary || "#B8860B",
        stroke: themeColors.accent || "#DAA520",
        strokeWidth: 2,
        radius: 50,
        rotation: 0, scaleX: 1, scaleY: 1
      };
    } else {
      newNode = {
        id,
        type: "shape",
        x: 250, y: 250,
        width: 300, height: 4,
        fill: themeColors.accent || "#DAA520",
        rotation: 0, scaleX: 1, scaleY: 1
      };
    }
    setNodes([...nodes, newNode]);
    setSelectedId(newNode.id);
    showToast(`Added ${shapeType} shape`, "success");
  };

  const updateSelectedNode = (attrs: Partial<CanvasNode>) => {
    if (!selectedId) return;
    setNodes(nodes.map(n => n.id === selectedId ? { ...n, ...attrs } : n));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    showToast("Deleted element", "info");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newNode: CanvasNode = {
          id: `custom-logo-${uuidv4()}`, type: "image", x: 350, y: 50, rotation: 0, scaleX: 1, scaleY: 1,
          width: 100, height: 100, src: ev.target?.result as string, isLogo: true
        };
        setNodes([...nodes, newNode]);
        setSelectedId(newNode.id);
        showToast("Uploaded organization logo", "success");
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
        showToast("Uploaded signature and labels", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropApply = (cropData: any) => {
    if (selectedId) {
      setNodes(nodes.map(n => n.id === selectedId ? { ...n, crop: cropData } : n));
    }
  };

  const moveLayer = (direction: 'up' | 'down' | 'front' | 'back') => {
    if (!selectedId) return;
    const index = nodes.findIndex(n => n.id === selectedId);
    if (index === -1) return;
    
    const newNodes = [...nodes];
    const item = newNodes[index];
    
    if (direction === 'up' && index < nodes.length - 1) {
      [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    } else if (direction === 'down' && index > 0) {
      [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
    } else if (direction === 'front') {
      newNodes.splice(index, 1);
      newNodes.push(item);
    } else if (direction === 'back') {
      newNodes.splice(index, 1);
      newNodes.unshift(item);
    }
    setNodes(newNodes);
  };

  const handleExport = async () => {
    // Generate PNG mockup of the certificate canvas and download it
    const stage = document.querySelector("#certificate-stage") as any;
    if (stage) {
      // Find the konva stage instance and convert to dataURL
      const canvasEl = stage.querySelector("canvas");
      if (canvasEl) {
        const link = document.createElement("a");
        link.download = `${templateName || "certificate_design"}.png`;
        link.href = canvasEl.toDataURL("image/png");
        link.click();
        showToast("Design exported to PNG", "success");
      }
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) return showToast("Template name is required", "error");
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", templateName);
      
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 560;
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        formData.append("template", new File([blob], "design_preview.png", { type: "image/png" }));
      }
      
      const fieldsConfig = {
        type: "canvas_builder",
        themeColors,
        templateId: activeTemplate.id,
        nodes: nodes
      };
      
      formData.append("fields", JSON.stringify(fieldsConfig));
      
      if (templateIdParam) {
        await apiUpload(`/certificates/templates/${templateIdParam}`, formData, token || undefined, "PUT");
        showToast("Template updated successfully!", "success");
      } else {
        await apiUpload("/certificates/templates", formData, token || undefined, "POST");
        showToast("Template deployed successfully!", "success");
      }
      
      setTimeout(() => {
        router.push("/dashboard/certificates");
      }, 1000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save template", "error");
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

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col text-white bg-zinc-950 p-2 rounded-2xl overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/50 bg-black/40 rounded-t-xl shrink-0 overflow-y-auto max-h-[30vh] md:max-h-none">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-2 shrink-0">
            <Layout className="w-5 h-5 text-red-500" /> Certificate Studio
          </h1>
          <div className="hidden sm:block h-6 w-px bg-zinc-800" />
          <input 
            className="bg-zinc-900/50 border border-zinc-800 focus:border-red-500 focus:outline-none rounded-lg text-sm text-slate-300 placeholder-slate-600 px-3 py-1.5 w-full sm:w-64" 
            placeholder="Template Name (e.g. Cybersecurity Excellence)..." 
            value={templateName} 
            onChange={(e) => setTemplateName(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select 
            className="ck-input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-800 w-full sm:w-48" 
            value={selectedEventId} 
            onChange={(e) => handleEventSelect(e.target.value)}
          >
            <option value="">Select Event (Preview)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <button onClick={handleExport} className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Save PNG
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {templateIdParam ? "Update Template" : "Deploy Template"}
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex lg:hidden border-b border-zinc-800/50 bg-black/40 shrink-0">
        {[
          { id: "canvas", label: "Canvas" },
          { id: "theme", label: "Design/Templates" },
          { id: "tools", label: "Elements/Props" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSidebarTab(t.id as any)}
            className={`flex-1 py-3 text-[10px] sm:text-xs font-mono font-bold uppercase border-b-2 transition-all ${
              activeSidebarTab === t.id 
                ? "border-red-500 text-red-500 bg-red-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT SIDEBAR: Tools, Shapes, and Colors */}
        <div className={`${
          activeSidebarTab === "theme" || activeSidebarTab === "tools" ? "flex" : "hidden"
        } lg:flex w-full lg:w-80 border-r border-zinc-800/50 bg-black/30 overflow-y-auto p-4 flex-col space-y-5 shrink-0 custom-scrollbar`}>
          
          {/* Add Elements Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-red-400" /> Add Elements
            </h3>
            
            {/* Quick Text Element Creators */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => addTextNode()}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Type className="w-3.5 h-3.5 text-blue-400" /> + Add Custom Text
              </button>
              
              <button 
                onClick={() => addTextNode("recipientName")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> + Recipient Name
              </button>

              <button 
                onClick={() => addTextNode("eventTitle")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-400" /> + Event Title
              </button>

              <button 
                onClick={() => addTextNode("eventDate")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> + Event Date
              </button>
              
              <button 
                onClick={() => addTextNode("uniqueCode")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex items-center gap-1.5 col-span-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" /> + Certificate ID (Unique Code)
              </button>
            </div>

            {/* Quick Shape Element Creators */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button 
                onClick={() => addShapeNode("rect")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex flex-col items-center gap-1"
              >
                <Square className="w-4 h-4 text-amber-500" /> Rect
              </button>
              <button 
                onClick={() => addShapeNode("circle")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex flex-col items-center gap-1"
              >
                <Circle className="w-4 h-4 text-emerald-500" /> Circle
              </button>
              <button 
                onClick={() => addShapeNode("line")}
                className="p-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors flex flex-col items-center gap-1"
              >
                <Minus className="w-4 h-4 text-rose-500" /> Line
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          {/* Canvas Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-400" /> Studio Actions
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setIsCropping(!isCropping)}
                className={`p-2 rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 transition-colors border ${isCropping ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-slate-300'}`}
              >
                <Crop className="w-3.5 h-3.5" /> Crop
              </button>
              <button onClick={handleCut} disabled={!selectedId} className="p-2 rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors disabled:opacity-30">
                <Scissors className="w-3.5 h-3.5" /> Cut
              </button>
              <button onClick={handlePaste} disabled={!clipboard} className="p-2 rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition-colors disabled:opacity-30">
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste
              </button>
            </div>
          </div>

          {/* Selected Element Customizer */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 border-t border-zinc-800/80"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-pink-400" /> Property Editor
                  </h3>
                  <button 
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="p-1 rounded bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                    title="Delete Element"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Text Specific Settings */}
                {selectedNode.type === "text" && (
                  <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Text Content</label>
                      <textarea 
                        className="ck-input text-xs w-full mt-1.5 bg-black/40 border-zinc-800 focus:border-red-500 text-slate-200"
                        rows={2}
                        value={selectedNode.text || ""}
                        onChange={(e) => updateSelectedNode({ text: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Font Size</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="range" min="10" max="100" step="1" 
                            className="w-full accent-red-500"
                            value={selectedNode.fontSize || 16}
                            onChange={(e) => updateSelectedNode({ fontSize: parseInt(e.target.value) || 16 })}
                          />
                          <span className="text-xs font-mono w-6 text-right">{selectedNode.fontSize}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Tracking</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="range" min="-3" max="25" step="1" 
                            className="w-full accent-red-500"
                            value={selectedNode.tracking || 0}
                            onChange={(e) => updateSelectedNode({ tracking: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-xs font-mono w-6 text-right">{selectedNode.tracking}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Font Family</label>
                        <select 
                          className="ck-input text-xs mt-1 w-full bg-black/50 border-zinc-800"
                          value={selectedNode.fontFamily || "sans-serif"}
                          onChange={(e) => updateSelectedNode({ fontFamily: e.target.value })}
                        >
                          <option value="sans-serif">Sans-Serif (Inter)</option>
                          <option value="serif">Serif (Playfair)</option>
                          <option value="mono">Monospace (Share Tech)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Placeholder Type</label>
                        <select 
                          className="ck-input text-xs mt-1 w-full bg-black/50 border-zinc-800"
                          value={selectedNode.isPlaceholder ? (selectedNode.placeholderType || "recipientName") : "none"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "none") {
                              updateSelectedNode({ isPlaceholder: false, placeholderType: undefined });
                            } else {
                              updateSelectedNode({ isPlaceholder: true, placeholderType: val });
                            }
                          }}
                        >
                          <option value="none">Normal Text</option>
                          <option value="recipientName">Recipient Name</option>
                          <option value="eventTitle">Event Title</option>
                          <option value="eventDate">Event Date</option>
                          <option value="uniqueCode">Certificate ID</option>
                        </select>
                      </div>
                    </div>

                    {/* Formatting Styles */}
                    <div className="flex items-center gap-2">
                      <div className="flex bg-black/30 border border-zinc-800 rounded-lg p-0.5">
                        <button 
                          onClick={() => {
                            const isBold = selectedNode.fontStyle?.includes("bold");
                            const isItalic = selectedNode.fontStyle?.includes("italic");
                            let style = "normal";
                            if (isBold && isItalic) style = "italic";
                            else if (isBold) style = "normal";
                            else if (isItalic) style = "bold italic";
                            else style = "bold";
                            updateSelectedNode({ fontStyle: style });
                          }}
                          className={`p-1.5 rounded hover:bg-zinc-800/80 transition-colors ${selectedNode.fontStyle?.includes("bold") ? "text-red-500 bg-zinc-800" : "text-slate-400"}`}
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            const isBold = selectedNode.fontStyle?.includes("bold");
                            const isItalic = selectedNode.fontStyle?.includes("italic");
                            let style = "normal";
                            if (isBold && isItalic) style = "bold";
                            else if (isItalic) style = "normal";
                            else if (isBold) style = "bold italic";
                            else style = "italic";
                            updateSelectedNode({ fontStyle: style });
                          }}
                          className={`p-1.5 rounded hover:bg-zinc-800/80 transition-colors ${selectedNode.fontStyle?.includes("italic") ? "text-red-500 bg-zinc-800" : "text-slate-400"}`}
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex bg-black/30 border border-zinc-800 rounded-lg p-0.5 ml-auto">
                        {(["left", "center", "right"] as const).map(align => (
                          <button 
                            key={align}
                            onClick={() => updateSelectedNode({ align })}
                            className={`p-1.5 rounded hover:bg-zinc-800/80 transition-colors ${selectedNode.align === align ? "text-red-500 bg-zinc-800" : "text-slate-400"}`}
                          >
                            {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                            {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                            {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Text Color</label>
                      <div className="flex items-center gap-2 mt-1.5 bg-black/30 p-1.5 rounded-lg border border-zinc-800">
                        <input 
                          type="color" 
                          value={selectedNode.fill || "#000000"} 
                          onChange={(e) => updateSelectedNode({ fill: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-xs text-slate-300 font-mono">{selectedNode.fill}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shape Specific Settings */}
                {selectedNode.type === "shape" && (
                  <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Fill Color</label>
                        <div className="flex items-center gap-2 mt-1 bg-black/30 p-1 rounded-lg border border-zinc-850">
                          <input 
                            type="color" 
                            value={selectedNode.fill || "#B8860B"} 
                            onChange={(e) => updateSelectedNode({ fill: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span className="text-[10px] text-slate-300 font-mono truncate">{selectedNode.fill}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Stroke/Border</label>
                        <div className="flex items-center gap-2 mt-1 bg-black/30 p-1 rounded-lg border border-zinc-850">
                          <input 
                            type="color" 
                            value={selectedNode.stroke || "#DAA520"} 
                            onChange={(e) => updateSelectedNode({ stroke: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span className="text-[10px] text-slate-300 font-mono truncate">{selectedNode.stroke || "None"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Stroke Width</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="range" min="0" max="15" step="1" 
                            className="w-full accent-red-500"
                            value={selectedNode.strokeWidth || 0}
                            onChange={(e) => updateSelectedNode({ strokeWidth: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-xs font-mono w-4 text-right">{selectedNode.strokeWidth || 0}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Corner Radius</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="range" min="0" max="100" step="1" 
                            className="w-full accent-red-500"
                            value={selectedNode.radius || 0}
                            onChange={(e) => updateSelectedNode({ radius: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-xs font-mono w-4 text-right">{selectedNode.radius || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Layer Ordering Controls */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/80 rounded-lg border border-zinc-800">
                  <button onClick={() => moveLayer('back')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors" title="Send to Back">To Back</button>
                  <button onClick={() => moveLayer('down')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors" title="Move Backward">Backwd</button>
                  <button onClick={() => moveLayer('up')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors" title="Move Forward">Forwd</button>
                  <button onClick={() => moveLayer('front')} className="py-1 text-[9px] font-mono hover:text-white text-slate-400 bg-black/20 hover:bg-black/40 rounded transition-colors" title="Bring to Front">To Front</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-px bg-zinc-800/50" />

          {/* Org Logo and Signature */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" /> Organization Logo
              </h3>
              <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
              <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs transition-colors font-mono">
                + UPLOAD_LOGO
              </button>
              {selectedNode?.isLogo && (
                <div className="flex gap-1">
                  <button onClick={() => placeLogo('top-left')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white">Top L</button>
                  <button onClick={() => placeLogo('top-center')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white">Center</button>
                  <button onClick={() => placeLogo('top-right')} className="flex-1 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-slate-400 hover:text-white">Top R</button>
                </div>
              )}
            </div>

            <div className="w-full h-px bg-zinc-800/50" />

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-400" /> Faculty Signature
              </h3>
              <input 
                className="ck-input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-800 w-full" 
                placeholder="Faculty Name (e.g. Dr. Anjali)" 
                value={facultyName} onChange={e => setFacultyName(e.target.value)} 
              />
              <input 
                className="ck-input text-xs py-1.5 px-3 bg-zinc-900 border-zinc-800 w-full" 
                placeholder="Faculty Designation (e.g. Dean)" 
                value={facultyTitle} onChange={e => setFacultyTitle(e.target.value)} 
              />
              <input type="file" accept="image/png" className="hidden" ref={signatureInputRef} onChange={handleSignatureUpload} />
              <button onClick={() => signatureInputRef.current?.click()} className="w-full py-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 rounded-lg text-xs transition-colors font-mono">
                + UPLOAD_SIGNATURE_PNG
              </button>
            </div>
          </div>

        </div>

        {/* CENTER CANVAS */}
        <div className={`${
          activeSidebarTab === "canvas" ? "flex" : "hidden lg:flex"
        } flex-1 bg-zinc-950/80 relative flex flex-col`}>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
            <KonvaEditor 
              nodes={nodes} 
              setNodes={setNodes} 
              eventTitle={getEventTitle()} 
              eventDate={getEventDate()} 
              backgroundColor={themeColors.background}
              themeColor={themeColors.primary}
              backgroundUrl={backgroundUrl || undefined}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              isCropping={isCropping}
              onCropApply={handleCropApply}
              scale={zoom}
            />
          </div>

          {/* BOTTOM BAR: Zoom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-zinc-800/50 px-4 py-2 rounded-full z-10">
            <button onClick={() => setZoom(z => Math.max(0.35, z - 0.1))} className="p-1 hover:text-white text-slate-400"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-mono w-12 text-center text-slate-300">{Math.round(zoom * 100)}%</span>
            <input type="range" min="0.35" max="2" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-20 sm:w-24 accent-white" />
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:text-white text-slate-400"><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Preset Templates, Theme Colors, & Uploaded Vault templates */}
        <div className={`${
          activeSidebarTab === "theme" ? "flex" : "hidden"
        } lg:flex w-full lg:w-72 border-l border-zinc-800/50 bg-black/30 overflow-y-auto p-4 flex-col space-y-6 shrink-0 custom-scrollbar`}>
          
          {/* Preset Templates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layout className="w-4 h-4 text-pink-400" /> Preset Layouts
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {CERTIFICATE_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => handleTemplateSwitch(t.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all ${activeTemplate.id === t.id && !backgroundUrl ? 'bg-pink-500/20 border border-pink-500/50 text-pink-100' : 'bg-zinc-900 border border-zinc-800 text-slate-400 hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center justify-between">
                    {t.name}
                    {activeTemplate.id === t.id && !backgroundUrl && <Check className="w-3.5 h-3.5 text-pink-400" />}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.primary }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.background }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: t.theme.accent }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          {/* User templates / uploaded backgrounds */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" /> Uploaded Templates
            </h3>
            {userTemplates.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4 bg-zinc-900/20 rounded-xl border border-zinc-800/40">No uploaded templates found.</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {userTemplates.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => handleUserTemplateSwitch(t)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all ${backgroundUrl.includes(t.fileUrl) ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-100' : 'bg-zinc-900 border border-zinc-800 text-slate-400 hover:bg-zinc-800'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate flex-1">{t.name}</span>
                      {backgroundUrl.includes(t.fileUrl) && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>
                    {t.fileUrl && (
                      <div className="mt-2 h-14 w-full rounded bg-black border border-zinc-800 overflow-hidden relative">
                        <img src={`${SERVER_BASE_URL}${t.fileUrl}`} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-zinc-800/50" />

          {/* Theme Colors Editor */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" /> Theme Colors
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'primary', label: 'Primary' },
                { key: 'background', label: 'Background' },
                { key: 'text', label: 'Text' },
                { key: 'accent', label: 'Accent' }
              ].map(c => (
                <div key={c.key} className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-mono">{c.label}</label>
                  <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                    <input 
                      type="color" 
                      value={themeColors[c.key as keyof ThemeColors] || "#ffffff"} 
                      onChange={(e) => handleColorChange(c.key as keyof ThemeColors, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[10px] text-slate-300 font-mono truncate">{themeColors[c.key as keyof ThemeColors]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 p-4 rounded-xl border shadow-2xl ${
              toast.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
                : toast.type === "error" 
                ? "bg-red-950/90 border-red-500/50 text-red-200" 
                : "bg-zinc-900/90 border-zinc-700/50 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-mono tracking-tight">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 p-0.5 rounded bg-black/30">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CertificateBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950 flex items-center justify-center text-white">Loading Studio...</div>}>
      <CertificateBuilderContent />
    </Suspense>
  );
}
