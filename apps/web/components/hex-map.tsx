'use client';

import { memo, PointerEvent as ReactPointerEvent, WheelEvent, useEffect, useMemo, useRef } from 'react';
import { HexData } from '@/lib/types';

const hexSize = 34;
const rootThree = Math.sqrt(3);
const minimumZoom = 0.8;
const maximumZoom = 10;
const zoomStep = 1.25;
const canvasPadding = 22;

const terrainPalettes: Record<string, string[]> = {
  PLANICIE: ['#777d60', '#81866a', '#6f755a'],
  FLORESTA: ['#3d5743', '#466149', '#36503d'],
  FLORESTA_DENSA: ['#254236', '#2d493a', '#203b31'],
  COLINA: ['#77634b', '#806d53', '#6e5b46'],
  MONTANHA: ['#626268', '#6c6b71', '#595a60'],
  PANTANO: ['#43564f', '#4b5f56', '#3d504a'],
  REGIAO_ALAGADA: ['#3c5966', '#456572', '#36515e'],
  RUINAS: ['#675554', '#725d5b', '#5e4d4d'],
  CAMPO_DEVASTADO: ['#706559', '#796d60', '#675d52'],
  REGIAO_CONTAMINADA: ['#523f59', '#5d4865', '#49374f'],
  DESCONHECIDO: ['#050708'],
  NAO_PERCORRIDO: ['#353a3c', '#3b4042', '#303537']
};

interface Position {
  hex: HexData;
  x: number;
  y: number;
  color: string;
}

interface Geometry {
  positions: Position[];
  coordinateMap: Map<string, Position>;
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  candidateHexId: string | null;
  moved: boolean;
}

interface HexMapProps {
  hexes: HexData[];
  selectedHex: HexData | null;
  currentQ: number;
  currentR: number;
  playerView: boolean;
  onSelect: (hex: HexData) => void;
}

export const HexMap = memo(function HexMap({
  hexes,
  selectedHex,
  currentQ,
  currentR,
  playerView,
  onSelect
}: HexMapProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomTextRef = useRef<HTMLSpanElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const sizeRef = useRef<CanvasSize>({ width: 1, height: 1, dpr: 1 });
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 });
  const dragRef = useRef<DragState | null>(null);
  const drawRef = useRef<() => void>(() => undefined);
  const previousPartyPositionRef = useRef<string | null>(null);

  const geometry = useMemo<Geometry>(() => {
    const positions: Position[] = [];
    const coordinateMap = new Map<string, Position>();
    let minimumX = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;

    for (const hex of hexes) {
      const x = hexSize * rootThree * (hex.q + hex.r / 2);
      const y = hexSize * 1.5 * hex.r;
      const palette = terrainPalettes[hex.terrain] ?? ['#666b68'];
      const color = palette[Math.abs(hashCoordinate(hex.q, hex.r)) % palette.length];
      const position = { hex, x, y, color };
      positions.push(position);
      coordinateMap.set(`${hex.q},${hex.r}`, position);
      minimumX = Math.min(minimumX, x - hexSize * 1.1);
      maximumX = Math.max(maximumX, x + hexSize * 1.1);
      minimumY = Math.min(minimumY, y - hexSize * 1.1);
      maximumY = Math.max(maximumY, y + hexSize * 1.1);
    }

    if (positions.length === 0) {
      minimumX = -100;
      maximumX = 100;
      minimumY = -100;
      maximumY = 100;
    }

    return {
      positions,
      coordinateMap,
      minimumX,
      maximumX,
      minimumY,
      maximumY,
      width: maximumX - minimumX,
      height: maximumY - minimumY,
      centerX: (minimumX + maximumX) / 2,
      centerY: (minimumY + maximumY) / 2
    };
  }, [hexes]);

  function getBaseScale() {
    const { width, height } = sizeRef.current;
    const minimumPlayerWidth = hexSize * rootThree * 9;
    const minimumPlayerHeight = hexSize * 1.5 * 7;
    const fittingWidth = playerView ? Math.max(geometry.width, minimumPlayerWidth) : geometry.width;
    const fittingHeight = playerView ? Math.max(geometry.height, minimumPlayerHeight) : geometry.height;
    return Math.max(0.01, Math.min(
      Math.max(1, width - canvasPadding * 2) / fittingWidth,
      Math.max(1, height - canvasPadding * 2) / fittingHeight
    ));
  }

  function scheduleDraw() {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      drawRef.current();
    });
  }

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const { width, height, dpr } = sizeRef.current;
    const view = viewRef.current;
    const baseScale = getBaseScale();
    const scale = baseScale * view.zoom;
    const originX = width / 2 + view.panX - geometry.centerX * scale;
    const originY = height / 2 + view.panY - geometry.centerY * scale;
    const worldMargin = hexSize * 1.3;
    const worldMinimumX = (-originX) / scale - worldMargin;
    const worldMaximumX = (width - originX) / scale + worldMargin;
    const worldMinimumY = (-originY) / scale - worldMargin;
    const worldMaximumY = (height - originY) / scale + worldMargin;
    const screenRadius = hexSize * scale;
    const showSymbols = screenRadius >= 17 && geometry.positions.length <= 5000;
    const showCoordinates = screenRadius >= 29;
    const showLandmarks = screenRadius >= 8;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = '#0b0e10';
    context.fillRect(0, 0, width, height);

    const terrainPaths = new Map<string, Path2D>();
    const gridPath = new Path2D();
    const visible: Array<{ position: Position; screenX: number; screenY: number; radius: number; unknown: boolean }> = [];

    for (const position of geometry.positions) {
      if (
        position.x < worldMinimumX || position.x > worldMaximumX ||
        position.y < worldMinimumY || position.y > worldMaximumY
      ) continue;

      const screenX = originX + position.x * scale;
      const screenY = originY + position.y * scale;
      const unknown = position.hex.discoveryStatus === 'DESCONHECIDO';
      if (playerView && unknown) continue;
      const unvisitedPalette = terrainPalettes.NAO_PERCORRIDO;
      const color = unknown
        ? unvisitedPalette[Math.abs(hashCoordinate(position.hex.q, position.hex.r)) % unvisitedPalette.length]
        : position.color;
      const path = terrainPaths.get(color) ?? new Path2D();
      addHexToPath(path, screenX, screenY, screenRadius);
      terrainPaths.set(color, path);
      addHexToPath(gridPath, screenX, screenY, screenRadius);
      visible.push({ position, screenX, screenY, radius: screenRadius, unknown });
    }

    for (const [color, path] of terrainPaths) {
      context.fillStyle = color;
      context.fill(path);
    }

    context.strokeStyle = playerView ? '#20252a' : '#171a1d';
    context.lineWidth = screenRadius < 11 ? 0.65 : 1;
    context.stroke(gridPath);

    if (!playerView && screenRadius >= 7) {
      const traveledPath = new Path2D();
      const exploredPath = new Path2D();
      for (const item of visible) {
        if (item.unknown || item.position.hex.discoveryStatus === 'AVISTADO') continue;
        addHexToPath(
          item.position.hex.discoveryStatus === 'EXPLORADO' || item.position.hex.discoveryStatus === 'MAPEADO'
            ? exploredPath
            : traveledPath,
          item.screenX,
          item.screenY,
          item.radius * 0.92
        );
      }
      context.strokeStyle = 'rgba(173, 193, 184, 0.72)';
      context.lineWidth = Math.max(1, Math.min(2, screenRadius * 0.055));
      context.stroke(traveledPath);
      context.strokeStyle = 'rgba(242, 210, 140, 0.82)';
      context.lineWidth = Math.max(1.2, Math.min(2.4, screenRadius * 0.065));
      context.stroke(exploredPath);
    }

    if (showSymbols) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      for (const item of visible) {
        if (item.unknown) continue;
        drawTerrainSymbol(context, item.position.hex.terrain, item.screenX, item.screenY, Math.min(1.35, scale));
      }
    }

    if (showLandmarks) {
      context.fillStyle = '#f2d28c';
      for (const item of visible) {
        if (item.unknown) continue;
        if (!item.position.hex.publicName && !(!playerView && item.position.hex.state.hasLore)) continue;
        context.beginPath();
        context.arc(item.screenX, item.screenY, Math.max(2.2, Math.min(5, screenRadius * 0.13)), 0, Math.PI * 2);
        context.fill();
      }
    }

    if (showCoordinates) {
      context.fillStyle = 'rgba(239, 233, 219, 0.58)';
      context.font = `${Math.max(8, Math.min(11, screenRadius * 0.25))}px system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (const item of visible) {
        if (item.unknown) continue;
        context.fillText(`${item.position.hex.q},${item.position.hex.r}`, item.screenX, item.screenY + screenRadius * 0.68);
      }
    }

    const selectedPosition = selectedHex ? geometry.coordinateMap.get(`${selectedHex.q},${selectedHex.r}`) : undefined;
    if (selectedPosition && selectedPosition.x >= worldMinimumX && selectedPosition.x <= worldMaximumX && selectedPosition.y >= worldMinimumY && selectedPosition.y <= worldMaximumY) {
      drawHexOutline(context, originX + selectedPosition.x * scale, originY + selectedPosition.y * scale, screenRadius, '#f2d28c', 3);
    }

    const partyPosition = geometry.coordinateMap.get(`${currentQ},${currentR}`);
    if (partyPosition && partyPosition.x >= worldMinimumX && partyPosition.x <= worldMaximumX && partyPosition.y >= worldMinimumY && partyPosition.y <= worldMaximumY) {
      const screenX = originX + partyPosition.x * scale;
      const screenY = originY + partyPosition.y * scale;
      drawHexOutline(context, screenX, screenY, screenRadius * 0.9, '#8fd8ff', 2.5);
      drawPartyMarker(context, screenX, screenY, Math.max(7, Math.min(14, screenRadius * 0.34)));
    }

    if (statsRef.current) {
      statsRef.current.textContent = playerView
        ? `${geometry.positions.length.toLocaleString('pt-BR')} hexágonos conhecidos`
        : `${visible.length.toLocaleString('pt-BR')} de ${geometry.positions.length.toLocaleString('pt-BR')} desenhados`;
    }
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;

    const resize = () => {
      const rectangle = viewport.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rectangle.width));
      const height = Math.max(1, Math.floor(rectangle.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      scheduleDraw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    return () => observer.disconnect();
  }, [geometry.width, geometry.height]);

  useEffect(() => {
    scheduleDraw();
  }, [geometry, selectedHex?.id, currentQ, currentR, playerView]);

  useEffect(() => {
    const key = `${currentQ},${currentR}`;
    const previous = previousPartyPositionRef.current;
    previousPartyPositionRef.current = key;
    if (playerView && previous !== null && previous !== key) {
      centerHex(currentQ, currentR, 1);
    }
  }, [currentQ, currentR, playerView, geometry]);

  useEffect(() => () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  function clampZoom(value: number) {
    return Math.min(maximumZoom, Math.max(minimumZoom, value));
  }

  function updateZoomText() {
    if (zoomTextRef.current) zoomTextRef.current.textContent = `${Math.round(viewRef.current.zoom * 100)}%`;
  }

  function zoomAt(nextZoom: number, clientX?: number, clientY?: number) {
    const canvas = canvasRef.current;
    const current = viewRef.current;
    const clampedZoom = clampZoom(nextZoom);
    if (!canvas || clientX === undefined || clientY === undefined) {
      viewRef.current = { ...current, zoom: clampedZoom };
      updateZoomText();
      scheduleDraw();
      return;
    }

    const rectangle = canvas.getBoundingClientRect();
    const screenX = clientX - rectangle.left;
    const screenY = clientY - rectangle.top;
    const baseScale = getBaseScale();
    const currentScale = baseScale * current.zoom;
    const worldX = geometry.centerX + (screenX - sizeRef.current.width / 2 - current.panX) / currentScale;
    const worldY = geometry.centerY + (screenY - sizeRef.current.height / 2 - current.panY) / currentScale;
    const nextScale = baseScale * clampedZoom;

    viewRef.current = {
      zoom: clampedZoom,
      panX: screenX - sizeRef.current.width / 2 - (worldX - geometry.centerX) * nextScale,
      panY: screenY - sizeRef.current.height / 2 - (worldY - geometry.centerY) * nextScale
    };
    updateZoomText();
    scheduleDraw();
  }

  function handleWheel(event: WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0014);
    zoomAt(viewRef.current.zoom * factor, event.clientX, event.clientY);
  }

  function hitTest(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rectangle = canvas.getBoundingClientRect();
    const screenX = clientX - rectangle.left;
    const screenY = clientY - rectangle.top;
    const view = viewRef.current;
    const scale = getBaseScale() * view.zoom;
    const worldX = geometry.centerX + (screenX - sizeRef.current.width / 2 - view.panX) / scale;
    const worldY = geometry.centerY + (screenY - sizeRef.current.height / 2 - view.panY) / scale;
    const axial = pixelToAxial(worldX, worldY);
    return geometry.coordinateMap.get(`${axial.q},${axial.r}`) ?? null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    const candidate = hitTest(event.clientX, event.clientY);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      candidateHexId: candidate?.hex.id ?? null,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    viewportRef.current?.classList.add('dragging');
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.lastX;
    const deltaY = event.clientY - drag.lastY;
    const totalX = event.clientX - drag.startX;
    const totalY = event.clientY - drag.startY;
    if (Math.abs(totalX) > 4 || Math.abs(totalY) > 4) drag.moved = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    viewRef.current.panX += deltaX;
    viewRef.current.panY += deltaY;
    scheduleDraw();
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.moved && drag.candidateHexId) {
      const candidate = hitTest(event.clientX, event.clientY);
      if (candidate?.hex.id === drag.candidateHexId) onSelect(candidate.hex);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    viewportRef.current?.classList.remove('dragging');
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    viewportRef.current?.classList.remove('dragging');
  }

  function resetView() {
    viewRef.current = { zoom: 1, panX: 0, panY: 0 };
    updateZoomText();
    scheduleDraw();
  }

  function centerHex(q: number, r: number, minimumCenterZoom = 2.2) {
    const position = geometry.coordinateMap.get(`${q},${r}`);
    if (!position) return;
    const zoom = Math.max(minimumCenterZoom, viewRef.current.zoom);
    const scale = getBaseScale() * zoom;
    viewRef.current = {
      zoom,
      panX: -(position.x - geometry.centerX) * scale,
      panY: -(position.y - geometry.centerY) * scale
    };
    updateZoomText();
    scheduleDraw();
  }

  return (
    <div ref={viewportRef} className={`map-viewport canvas-map-viewport${playerView ? ' player-map' : ''}`}>
      <div className="map-zoom-controls" aria-label="Controles do mapa">
        <button type="button" onClick={() => zoomAt(viewRef.current.zoom * zoomStep)}>+</button>
        <span ref={zoomTextRef}>100%</span>
        <button type="button" onClick={() => zoomAt(viewRef.current.zoom / zoomStep)}>−</button>
        <button type="button" className="map-control-wide" onClick={resetView}>Enquadrar</button>
        <button type="button" className="map-control-wide" onClick={() => selectedHex && centerHex(selectedHex.q, selectedHex.r)} disabled={!selectedHex}>Selecionado</button>
        <button type="button" className="map-control-wide" onClick={() => centerHex(currentQ, currentR)}>Grupo</button>
      </div>

      <div ref={statsRef} className="map-render-stats">0 de {geometry.positions.length.toLocaleString('pt-BR')} desenhados</div>

      <canvas
        ref={canvasRef}
        className="hex-map-canvas"
        role="img"
        tabIndex={0}
        aria-label="Mapa hexagonal da campanha. Clique em um hexágono para selecioná-lo e arraste para navegar."
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
}, (previous, next) => (
  previous.hexes === next.hexes &&
  previous.selectedHex?.id === next.selectedHex?.id &&
  previous.currentQ === next.currentQ &&
  previous.currentR === next.currentR &&
  previous.playerView === next.playerView &&
  previous.onSelect === next.onSelect
));

function addHexToPath(path: Path2D, centerX: number, centerY: number, radius: number) {
  for (let index = 0; index < 6; index += 1) {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
}

function drawHexOutline(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, color: string, width: number) {
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}

function drawPartyMarker(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = 'rgba(8, 24, 32, 0.84)';
  context.fill();
  context.strokeStyle = '#8fd8ff';
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.moveTo(centerX, centerY - radius * 0.55);
  context.lineTo(centerX - radius * 0.42, centerY + radius * 0.38);
  context.lineTo(centerX + radius * 0.42, centerY + radius * 0.38);
  context.closePath();
  context.fillStyle = '#8fd8ff';
  context.fill();
}

function drawTerrainSymbol(context: CanvasRenderingContext2D, terrain: string, x: number, y: number, scale: number) {
  const unit = 7 * scale;
  context.strokeStyle = terrain === 'REGIAO_CONTAMINADA' ? 'rgba(238, 196, 242, 0.72)' : 'rgba(239, 233, 219, 0.58)';
  context.fillStyle = 'rgba(229, 232, 214, 0.28)';
  context.lineWidth = Math.max(0.75, scale * 0.85);

  if (terrain === 'FLORESTA' || terrain === 'FLORESTA_DENSA') {
    for (const offset of [-1.2, 0, 1.2]) {
      context.beginPath();
      context.moveTo(x + offset * unit, y - unit * 1.15);
      context.lineTo(x + offset * unit - unit * 0.72, y + unit * 0.55);
      context.lineTo(x + offset * unit + unit * 0.72, y + unit * 0.55);
      context.closePath();
      context.fill();
      context.stroke();
    }
    return;
  }

  context.beginPath();
  if (terrain === 'MONTANHA') {
    context.moveTo(x - unit * 2, y + unit);
    context.lineTo(x - unit * 0.6, y - unit * 1.45);
    context.lineTo(x + unit * 0.15, y - unit * 0.2);
    context.lineTo(x + unit * 0.75, y - unit * 1.1);
    context.lineTo(x + unit * 2, y + unit);
  } else if (terrain === 'COLINA') {
    context.moveTo(x - unit * 2, y + unit * 0.8);
    context.quadraticCurveTo(x - unit * 0.8, y - unit, x + unit * 0.25, y + unit * 0.8);
    context.quadraticCurveTo(x + unit, y - unit * 0.35, x + unit * 2, y + unit * 0.8);
  } else if (terrain === 'REGIAO_ALAGADA') {
    context.moveTo(x - unit * 2, y - unit * 0.4);
    context.bezierCurveTo(x - unit, y - unit, x - unit, y + unit * 0.3, x, y - unit * 0.4);
    context.bezierCurveTo(x + unit, y - unit, x + unit, y + unit * 0.3, x + unit * 2, y - unit * 0.4);
    context.moveTo(x - unit * 2, y + unit * 0.65);
    context.bezierCurveTo(x - unit, y, x - unit, y + unit * 1.2, x, y + unit * 0.65);
    context.bezierCurveTo(x + unit, y, x + unit, y + unit * 1.2, x + unit * 2, y + unit * 0.65);
  } else if (terrain === 'PANTANO') {
    context.moveTo(x - unit * 2, y + unit);
    context.lineTo(x + unit * 2, y + unit);
    context.moveTo(x - unit, y + unit);
    context.lineTo(x - unit * 0.9, y - unit * 1.2);
    context.moveTo(x + unit, y + unit);
    context.lineTo(x + unit * 1.1, y - unit * 1.1);
  } else if (terrain === 'RUINAS') {
    context.moveTo(x - unit * 1.6, y + unit);
    context.lineTo(x - unit * 1.6, y - unit * 0.8);
    context.lineTo(x - unit * 0.6, y - unit * 0.8);
    context.lineTo(x - unit * 0.6, y + unit);
    context.moveTo(x, y + unit);
    context.lineTo(x, y - unit * 1.25);
    context.lineTo(x + unit * 1.2, y - unit * 1.25);
    context.lineTo(x + unit * 1.2, y + unit);
    context.moveTo(x - unit * 2, y + unit);
    context.lineTo(x + unit * 2, y + unit);
  } else if (terrain === 'CAMPO_DEVASTADO') {
    context.moveTo(x, y + unit);
    context.lineTo(x, y - unit * 1.4);
    context.moveTo(x, y - unit * 0.3);
    context.lineTo(x - unit, y - unit * 1.15);
    context.moveTo(x, y + unit * 0.15);
    context.lineTo(x + unit, y - unit * 0.8);
    context.moveTo(x - unit * 2, y + unit);
    context.lineTo(x + unit * 2, y + unit);
  } else if (terrain === 'REGIAO_CONTAMINADA') {
    context.moveTo(x - unit * 1.8, y + unit);
    context.bezierCurveTo(x - unit * 0.4, y + unit * 0.2, x - unit, y - unit, x, y - unit * 0.4);
    context.bezierCurveTo(x + unit, y + unit * 0.2, x + unit * 0.3, y - unit * 1.25, x + unit * 1.8, y - unit);
  } else {
    context.moveTo(x - unit * 2, y + unit * 0.65);
    context.quadraticCurveTo(x - unit, y - unit * 0.25, x, y + unit * 0.65);
    context.quadraticCurveTo(x + unit, y - unit * 0.25, x + unit * 2, y + unit * 0.65);
  }
  context.stroke();
}

function pixelToAxial(x: number, y: number) {
  const q = (rootThree / 3 * x - 1 / 3 * y) / hexSize;
  const r = (2 / 3 * y) / hexSize;
  return roundAxial(q, r);
}

function roundAxial(q: number, r: number) {
  const cubeX = q;
  const cubeZ = r;
  const cubeY = -cubeX - cubeZ;
  let roundedX = Math.round(cubeX);
  const roundedY = Math.round(cubeY);
  let roundedZ = Math.round(cubeZ);
  const differenceX = Math.abs(roundedX - cubeX);
  const differenceY = Math.abs(roundedY - cubeY);
  const differenceZ = Math.abs(roundedZ - cubeZ);

  if (differenceX > differenceY && differenceX > differenceZ) roundedX = -roundedY - roundedZ;
  else if (differenceY <= differenceZ) roundedZ = -roundedX - roundedY;

  return { q: roundedX, r: roundedZ };
}

function hashCoordinate(q: number, r: number) {
  let value = Math.imul(q + 4096, 374761393) ^ Math.imul(r + 8192, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return value ^ (value >>> 16);
}
