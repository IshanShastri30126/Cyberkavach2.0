import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Rect, Group } from "react-konva";
import useImage from "use-image";
import { v4 as uuidv4 } from "uuid";
import Konva from "konva";

export type NodeType = "text" | "image" | "shape";

export interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string;
  align?: "left" | "center" | "right";
  tracking?: number; 
  
  src?: string;
  crop?: { x: number; y: number; width: number; height: number };
  isSignature?: boolean;
  isLogo?: boolean;
  
  stroke?: string;
  strokeWidth?: number;
  radius?: number; 
  
  isPlaceholder?: boolean;
  placeholderType?: "eventTitle" | "eventDate" | "recipientName" | "uniqueCode" | string;
}

interface URLImageProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: CanvasNode) => void;
  themeColor: string;
  isCropping: boolean;
  onCropEnd: (crop: {x:number, y:number, width:number, height:number}) => void;
}

const URLImage = ({ node, isSelected, onSelect, onChange, themeColor, isCropping, onCropEnd }: URLImageProps) => {
  const [img] = useImage(node.src || "", "anonymous");
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const cropRef = useRef<any>(null);
  const cropTrRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && !isCropping) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
    if (isSelected && isCropping && cropTrRef.current && cropRef.current) {
      cropTrRef.current.nodes([cropRef.current]);
      cropTrRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isCropping]);

  // Apply filters if signature
  useEffect(() => {
    if (img && shapeRef.current && node.isSignature) {
      shapeRef.current.cache();
      // Konva RGB filter requires r, g, b values from 0 to 255.
      // We extract RGB from themeColor (hex).
      let hex = themeColor.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      
      // Apply RGB filter which adds to the pixel colors.
      // Black pixels (0,0,0) become the theme color.
      // Transparent pixels remain transparent.
      shapeRef.current.filters([Konva.Filters.RGB]);
      shapeRef.current.red(r);
      shapeRef.current.green(g);
      shapeRef.current.blue(b); 
    } else if (img && shapeRef.current) {
      shapeRef.current.filters([]);
      shapeRef.current.clearCache();
    }
  }, [img, node.isSignature, themeColor]);

  // Temporary state for cropping UI
  const [tempCrop, setTempCrop] = useState(node.crop || { x: 0, y: 0, width: node.width || 100, height: node.height || 100 });

  useEffect(() => {
    if (isSelected && isCropping) {
      onCropEnd(tempCrop);
    }
  }, [tempCrop, onCropEnd, isSelected, isCropping]);

  return (
    <React.Fragment>
      <Group
        x={node.x}
        y={node.y}
        rotation={node.rotation}
        draggable={!isCropping}
        onDragEnd={(e) => {
          onChange({
            ...node,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
      >
        <KonvaImage
          image={img}
          onClick={onSelect}
          onTap={onSelect}
          ref={shapeRef}
          width={node.width}
          height={node.height}
          crop={node.crop}
          onTransformEnd={(e) => {
            if (isCropping) return;
            const nodeRef = shapeRef.current;
            const scaleX = nodeRef.scaleX();
            const scaleY = nodeRef.scaleY();
            nodeRef.scaleX(1);
            nodeRef.scaleY(1);
            onChange({
              ...node,
              width: Math.max(5, nodeRef.width() * scaleX),
              height: Math.max(5, nodeRef.height() * scaleY),
            });
          }}
        />
        
        {/* Cropping overlay */}
        {isSelected && isCropping && (
          <Rect
            ref={cropRef}
            x={tempCrop.x}
            y={tempCrop.y}
            width={tempCrop.width}
            height={tempCrop.height}
            stroke="blue"
            strokeWidth={2}
            dash={[4, 4]}
            draggable
            onDragEnd={(e) => {
              setTempCrop({ ...tempCrop, x: e.target.x(), y: e.target.y() });
            }}
            onTransformEnd={(e) => {
              const nodeRef = cropRef.current;
              const scaleX = nodeRef.scaleX();
              const scaleY = nodeRef.scaleY();
              nodeRef.scaleX(1);
              nodeRef.scaleY(1);
              setTempCrop({
                x: nodeRef.x(),
                y: nodeRef.y(),
                width: Math.max(5, nodeRef.width() * scaleX),
                height: Math.max(5, nodeRef.height() * scaleY),
              });
            }}
          />
        )}
      </Group>

      {isSelected && !isCropping && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
      
      {isSelected && isCropping && (
        <Transformer
          ref={cropTrRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

interface EditableTextProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: CanvasNode) => void;
  eventTitle: string;
  eventDate: string;
  themeColor: string;
}

const EditableText = ({ node, isSelected, onSelect, onChange, eventTitle, eventDate, themeColor }: EditableTextProps) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  let displayText = node.text || "";
  if (node.isPlaceholder) {
    if (node.placeholderType === "eventTitle") displayText = eventTitle;
    if (node.placeholderType === "eventDate") displayText = eventDate;
    if (node.placeholderType === "recipientName") displayText = "[Recipient Name]";
    if (node.placeholderType === "uniqueCode") displayText = "CK-XXXX-XXXX";
  }

  return (
    <React.Fragment>
      <Text
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...node}
        text={displayText}
        letterSpacing={node.tracking || 0}
        fill={node.isSignature ? themeColor : node.fill} // Auto-theme text if it's signature-related
        draggable
        onDragEnd={(e) => {
          onChange({
            ...node,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const nodeRef = shapeRef.current;
          const scaleX = nodeRef.scaleX();
          nodeRef.scaleX(1);
          nodeRef.scaleY(1);
          onChange({
            ...node,
            x: nodeRef.x(),
            y: nodeRef.y(),
            rotation: nodeRef.rotation(),
            width: Math.max(5, nodeRef.width() * scaleX),
            scaleX: 1,
            scaleY: 1,
          });
        }}
        onDblClick={() => {
          const textNode = shapeRef.current;
          const stage = textNode.getStage();
          const container = stage.container();
          
          const textarea = document.createElement('textarea');
          container.appendChild(textarea);
          
          const textPosition = textNode.absolutePosition();
          const areaPosition = {
            x: stage.container().offsetLeft + textPosition.x,
            y: stage.container().offsetTop + textPosition.y,
          };
          
          textarea.value = node.text || "";
          textarea.style.position = 'absolute';
          textarea.style.top = areaPosition.y + 'px';
          textarea.style.left = areaPosition.x + 'px';
          textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
          textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px';
          textarea.style.fontSize = textNode.fontSize() + 'px';
          textarea.style.border = 'none';
          textarea.style.padding = '0px';
          textarea.style.margin = '0px';
          textarea.style.overflow = 'hidden';
          textarea.style.background = 'none';
          textarea.style.outline = 'none';
          textarea.style.resize = 'none';
          textarea.style.lineHeight = textNode.lineHeight();
          textarea.style.fontFamily = textNode.fontFamily();
          textarea.style.transformOrigin = 'left top';
          textarea.style.textAlign = textNode.align();
          textarea.style.color = textNode.fill();
          
          const rotation = textNode.rotation();
          let transform = '';
          if (rotation) {
            transform += 'rotateZ(' + rotation + 'deg)';
          }
          transform += 'translateY(-2px)';
          textarea.style.transform = transform;
          textarea.style.height = textarea.scrollHeight + 3 + 'px';
          
          textarea.focus();
          
          const removeTextarea = () => {
            if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
            onChange({ ...node, text: textarea.value });
            window.removeEventListener('click', handleOutsideClick);
          };
          
          const handleOutsideClick = (e: any) => {
            if (e.target !== textarea) {
              removeTextarea();
            }
          };
          
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              removeTextarea();
            }
            if (e.key === 'Escape') {
              removeTextarea();
            }
          });
          
          setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

interface ShapeNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: CanvasNode) => void;
}

const ShapeNode = ({ node, isSelected, onSelect, onChange }: ShapeNodeProps) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        x={node.x}
        y={node.y}
        width={node.width || 100}
        height={node.height || 100}
        fill={node.fill}
        stroke={node.stroke}
        strokeWidth={node.strokeWidth}
        cornerRadius={node.radius} // For circle-like shapes
        rotation={node.rotation}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...node,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const nodeRef = shapeRef.current;
          const scaleX = nodeRef.scaleX();
          const scaleY = nodeRef.scaleY();
          nodeRef.scaleX(1);
          nodeRef.scaleY(1);
          onChange({
            ...node,
            x: nodeRef.x(),
            y: nodeRef.y(),
            rotation: nodeRef.rotation(),
            width: Math.max(5, nodeRef.width() * scaleX),
            height: Math.max(5, nodeRef.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

interface KonvaEditorProps {
  nodes: CanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
  eventTitle: string;
  eventDate: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  themeColor?: string;
  
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  isCropping: boolean;
  onCropApply: (cropData: any) => void;
  scale?: number;
}

export const KonvaEditor = ({ 
  nodes, 
  setNodes, 
  eventTitle, 
  eventDate, 
  backgroundUrl, 
  backgroundColor = "#ffffff", 
  themeColor = "#000000",
  selectedId,
  setSelectedId,
  isCropping,
  onCropApply,
  scale = 1
}: KonvaEditorProps) => {
  const [copiedNode, setCopiedNode] = useState<CanvasNode | null>(null);
  const [tempCropData, setTempCropData] = useState<any>(null);

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs.id === "bg-rect" || e.target.attrs.id === "bg-img";
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Keyboard shortcuts (Cut, Copy, Paste, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setNodes((prev) => prev.filter((n) => n.id !== selectedId));
        setSelectedId(null);
      }
      
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedId) {
        const nodeToCopy = nodes.find(n => n.id === selectedId);
        if (nodeToCopy) setCopiedNode(nodeToCopy);
      }
      
      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x" && selectedId) {
        const nodeToCopy = nodes.find(n => n.id === selectedId);
        if (nodeToCopy) {
          setCopiedNode(nodeToCopy);
          setNodes((prev) => prev.filter((n) => n.id !== selectedId));
          setSelectedId(null);
        }
      }
      
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && copiedNode) {
        const newNode = { ...copiedNode, id: uuidv4(), x: copiedNode.x + 20, y: copiedNode.y + 20 };
        setNodes((prev) => [...prev, newNode]);
        setSelectedId(newNode.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, copiedNode, nodes, setNodes, setSelectedId]);

  useEffect(() => {
    if (isCropping && tempCropData) {
      onCropApply(tempCropData);
    }
  }, [tempCropData, isCropping, onCropApply]);

  const [bgImg] = useImage(backgroundUrl || "", "anonymous");

  return (
    <div className="relative w-full h-full flex justify-center items-center overflow-hidden" tabIndex={0}>
      <div style={{ width: 800 * scale, height: 560 * scale }} className="relative flex items-center justify-center overflow-hidden shrink-0">
        <div style={{ width: 800, height: 560, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }} className="shadow-2xl border border-zinc-800 bg-white">
          <Stage
            width={800}
            height={560}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            id="certificate-stage"
          >
            <Layer>
              <Rect id="bg-rect" width={800} height={560} fill={backgroundColor} />
              {bgImg && (
                <KonvaImage id="bg-img" image={bgImg} width={800} height={560} x={0} y={0} listening={false} />
              )}
              
              {nodes.map((node, i) => {
                const onChange = (newAttrs: CanvasNode) => {
                  const newNodes = nodes.slice();
                  newNodes[i] = newAttrs;
                  setNodes(newNodes);
                };
                const onSelect = () => setSelectedId(node.id);
                const isSelected = node.id === selectedId;

                if (node.type === "text") {
                  return (
                    <EditableText
                      key={node.id}
                      node={node}
                      isSelected={isSelected}
                      onSelect={onSelect}
                      onChange={onChange}
                      eventTitle={eventTitle}
                      eventDate={eventDate}
                      themeColor={themeColor}
                    />
                  );
                } else if (node.type === "image") {
                  return (
                    <URLImage
                      key={node.id}
                      node={node}
                      isSelected={isSelected}
                      onSelect={onSelect}
                      onChange={onChange}
                      themeColor={themeColor}
                      isCropping={isSelected && isCropping}
                      onCropEnd={(crop) => setTempCropData(crop)}
                    />
                  );
                } else if (node.type === "shape") {
                  return (
                    <ShapeNode
                      key={node.id}
                      node={node}
                      isSelected={isSelected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  );
                }
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};
