import { v4 as uuidv4 } from "uuid";
import { CanvasNode } from "@/components/KonvaEditor";

export interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  accent: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  theme: ThemeColors;
  nodes: CanvasNode[];
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: "gold-cream",
    name: "Classic Gold & Cream",
    theme: {
      primary: "#B8860B", // Dark Goldenrod
      background: "#FFFAF0", // Floral White
      text: "#333333",
      accent: "#DAA520", // Goldenrod
    },
    nodes: [
      { id: "t1-border", type: "shape", x: 20, y: 20, width: 760, height: 520, rotation: 0, scaleX: 1, scaleY: 1, stroke: "#B8860B", strokeWidth: 4 },
      { id: "t1-border2", type: "shape", x: 26, y: 26, width: 748, height: 508, rotation: 0, scaleX: 1, scaleY: 1, stroke: "#DAA520", strokeWidth: 1 },
      { id: "t1-title", type: "text", x: 400, y: 80, rotation: 0, scaleX: 1, scaleY: 1, text: "CERTIFICATE", fontSize: 48, fontFamily: "serif", fill: "#B8860B", align: "center", width: 400 },
      { id: "t1-subtitle", type: "text", x: 400, y: 140, rotation: 0, scaleX: 1, scaleY: 1, text: "OF EXCELLENCE", fontSize: 18, fontFamily: "sans-serif", fill: "#333333", align: "center", width: 300, tracking: 4 },
      { id: "t1-presented", type: "text", x: 400, y: 220, rotation: 0, scaleX: 1, scaleY: 1, text: "This is proudly presented to", fontSize: 14, fontFamily: "sans-serif", fill: "#555555", align: "center", width: 300 },
      { id: "t1-name", type: "text", x: 400, y: 260, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 42, fontFamily: "serif", fontStyle: "italic", fill: "#333333", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t1-line", type: "shape", x: 200, y: 310, rotation: 0, scaleX: 1, scaleY: 1, width: 400, height: 2, fill: "#DAA520" },
      { id: "t1-desc", type: "text", x: 400, y: 340, rotation: 0, scaleX: 1, scaleY: 1, text: "For outstanding participation in [Event Title] held on [Event Date].", fontSize: 16, fontFamily: "sans-serif", fill: "#333333", align: "center", width: 600, isPlaceholder: true },
    ]
  },
  {
    id: "navy-silver",
    name: "Modern Navy & Silver",
    theme: {
      primary: "#1A237E", // Navy
      background: "#FFFFFF", 
      text: "#111111",
      accent: "#B0BEC5", // Silver/Grey
    },
    nodes: [
      { id: "t2-topbar", type: "shape", x: 0, y: 0, width: 800, height: 40, rotation: 0, scaleX: 1, scaleY: 1, fill: "#1A237E" },
      { id: "t2-bottombar", type: "shape", x: 0, y: 520, width: 800, height: 40, rotation: 0, scaleX: 1, scaleY: 1, fill: "#1A237E" },
      { id: "t2-title", type: "text", x: 400, y: 100, rotation: 0, scaleX: 1, scaleY: 1, text: "CERTIFICATE OF ACHIEVEMENT", fontSize: 36, fontFamily: "sans-serif", fontStyle: "bold", fill: "#1A237E", align: "center", width: 600 },
      { id: "t2-presented", type: "text", x: 400, y: 180, rotation: 0, scaleX: 1, scaleY: 1, text: "PRESENTED TO", fontSize: 12, fontFamily: "sans-serif", fill: "#B0BEC5", align: "center", width: 300 },
      { id: "t2-name", type: "text", x: 400, y: 220, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 40, fontFamily: "serif", fill: "#111111", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t2-desc", type: "text", x: 400, y: 300, rotation: 0, scaleX: 1, scaleY: 1, text: "In recognition of successful completion of [Event Title] on [Event Date].", fontSize: 14, fontFamily: "sans-serif", fill: "#111111", align: "center", width: 500, isPlaceholder: true },
    ]
  },
  {
    id: "maroon-gold",
    name: "Maroon & Gold Ornate",
    theme: {
      primary: "#800000", // Maroon
      background: "#FDF5E6", // Old Lace
      text: "#000000",
      accent: "#FFD700", // Gold
    },
    nodes: [
      { id: "t3-border", type: "shape", x: 30, y: 30, width: 740, height: 500, rotation: 0, scaleX: 1, scaleY: 1, stroke: "#800000", strokeWidth: 8 },
      { id: "t3-title", type: "text", x: 400, y: 80, rotation: 0, scaleX: 1, scaleY: 1, text: "AWARD OF MERIT", fontSize: 42, fontFamily: "serif", fontStyle: "bold", fill: "#800000", align: "center", width: 500 },
      { id: "t3-name", type: "text", x: 400, y: 200, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 48, fontFamily: "serif", fontStyle: "italic", fill: "#000000", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t3-line", type: "shape", x: 150, y: 270, rotation: 0, scaleX: 1, scaleY: 1, width: 500, height: 3, fill: "#FFD700" },
      { id: "t3-desc", type: "text", x: 400, y: 310, rotation: 0, scaleX: 1, scaleY: 1, text: "For outstanding performance during [Event Title]", fontSize: 18, fontFamily: "sans-serif", fill: "#000000", align: "center", width: 600 },
      { id: "t3-date", type: "text", x: 400, y: 360, rotation: 0, scaleX: 1, scaleY: 1, text: "Date: [Event Date]", fontSize: 14, fontFamily: "sans-serif", fill: "#000000", align: "center", width: 300, isPlaceholder: true },
    ]
  },
  {
    id: "teal-white",
    name: "Teal Minimalist",
    theme: {
      primary: "#008080", // Teal
      background: "#FAFAFA",
      text: "#333333",
      accent: "#40E0D0", // Turquoise
    },
    nodes: [
      { id: "t4-side", type: "shape", x: 0, y: 0, width: 100, height: 560, rotation: 0, scaleX: 1, scaleY: 1, fill: "#008080" },
      { id: "t4-title", type: "text", x: 450, y: 90, rotation: 0, scaleX: 1, scaleY: 1, text: "CERTIFICATE", fontSize: 50, fontFamily: "sans-serif", fontStyle: "bold", fill: "#333333", align: "left", width: 300 },
      { id: "t4-subtitle", type: "text", x: 450, y: 150, rotation: 0, scaleX: 1, scaleY: 1, text: "OF COMPLETION", fontSize: 20, fontFamily: "sans-serif", fill: "#008080", align: "left", width: 300 },
      { id: "t4-presented", type: "text", x: 450, y: 230, rotation: 0, scaleX: 1, scaleY: 1, text: "Presented to", fontSize: 14, fontFamily: "sans-serif", fill: "#555555", align: "left", width: 200 },
      { id: "t4-name", type: "text", x: 450, y: 260, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 36, fontFamily: "serif", fill: "#333333", align: "left", width: 500, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t4-desc", type: "text", x: 450, y: 340, rotation: 0, scaleX: 1, scaleY: 1, text: "For successfully completing [Event Title] on [Event Date].", fontSize: 14, fontFamily: "sans-serif", fill: "#333333", align: "left", width: 400, isPlaceholder: true },
    ]
  },
  {
    id: "dark-neon",
    name: "Dark Neon Tech",
    theme: {
      primary: "#0D0D0D",
      background: "#121212",
      text: "#FFFFFF",
      accent: "#00FF41", // Matrix Green
    },
    nodes: [
      { id: "t5-border", type: "shape", x: 15, y: 15, width: 770, height: 530, rotation: 0, scaleX: 1, scaleY: 1, stroke: "#00FF41", strokeWidth: 2 },
      { id: "t5-title", type: "text", x: 400, y: 100, rotation: 0, scaleX: 1, scaleY: 1, text: "CERTIFICATE", fontSize: 44, fontFamily: "mono", fontStyle: "bold", fill: "#FFFFFF", align: "center", width: 500 },
      { id: "t5-name", type: "text", x: 400, y: 220, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 38, fontFamily: "sans-serif", fontStyle: "bold", fill: "#00FF41", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t5-desc", type: "text", x: 400, y: 320, rotation: 0, scaleX: 1, scaleY: 1, text: "System participation confirmed for [Event Title] at [Event Date].", fontSize: 14, fontFamily: "mono", fill: "#AAAAAA", align: "center", width: 600, isPlaceholder: true },
    ]
  },
  {
    id: "pastel",
    name: "Soft Pastel Gradient",
    theme: {
      primary: "#FFB7B2", // Pastel Pink
      background: "#FFDAC1", // Pastel Orange/Peach
      text: "#2C3E50",
      accent: "#E2F0CB", // Pastel Green
    },
    nodes: [
      { id: "t6-circle1", type: "shape", x: 0, y: 0, width: 200, height: 200, rotation: 0, scaleX: 1, scaleY: 1, fill: "#FFB7B2", radius: 100 },
      { id: "t6-circle2", type: "shape", x: 800, y: 560, width: 300, height: 300, rotation: 0, scaleX: 1, scaleY: 1, fill: "#E2F0CB", radius: 150 },
      { id: "t6-title", type: "text", x: 400, y: 120, rotation: 0, scaleX: 1, scaleY: 1, text: "Certificate of Appreciation", fontSize: 40, fontFamily: "serif", fill: "#2C3E50", align: "center", width: 600 },
      { id: "t6-name", type: "text", x: 400, y: 240, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 45, fontFamily: "serif", fontStyle: "italic", fill: "#2C3E50", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t6-desc", type: "text", x: 400, y: 340, rotation: 0, scaleX: 1, scaleY: 1, text: "Gratefully presented for participation in [Event Title] on [Event Date].", fontSize: 16, fontFamily: "sans-serif", fill: "#2C3E50", align: "center", width: 500, isPlaceholder: true },
    ]
  },
  {
    id: "monochrome",
    name: "Sleek Monochrome",
    theme: {
      primary: "#000000",
      background: "#FFFFFF",
      text: "#000000",
      accent: "#888888",
    },
    nodes: [
      { id: "t7-top", type: "shape", x: 40, y: 40, width: 720, height: 10, rotation: 0, scaleX: 1, scaleY: 1, fill: "#000000" },
      { id: "t7-bottom", type: "shape", x: 40, y: 510, width: 720, height: 10, rotation: 0, scaleX: 1, scaleY: 1, fill: "#000000" },
      { id: "t7-title", type: "text", x: 400, y: 90, rotation: 0, scaleX: 1, scaleY: 1, text: "CERTIFICATE", fontSize: 48, fontFamily: "sans-serif", fontStyle: "bold", fill: "#000000", align: "center", width: 400, tracking: 10 },
      { id: "t7-name", type: "text", x: 400, y: 240, rotation: 0, scaleX: 1, scaleY: 1, text: "[Recipient Name]", fontSize: 36, fontFamily: "sans-serif", fill: "#000000", align: "center", width: 600, isPlaceholder: true, placeholderType: "recipientName" },
      { id: "t7-desc", type: "text", x: 400, y: 320, rotation: 0, scaleX: 1, scaleY: 1, text: "This certifies the participation in [Event Title] as of [Event Date].", fontSize: 14, fontFamily: "sans-serif", fill: "#888888", align: "center", width: 500, isPlaceholder: true },
    ]
  }
];
