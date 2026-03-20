const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ─── LLM Architecture Groups ────────────────────────────────────

const COLORS = {
  embedding:  { base: [0, 210, 80],   glow: 'rgba(0,210,80,',   label: 'Token Embedding' },   // terminal green
  attention:  { base: [0, 180, 220],  glow: 'rgba(0,180,220,',  label: 'Multi-Head Attention' }, // tron cyan
  layernorm1: { base: [40, 255, 160], glow: 'rgba(40,255,160,', label: 'Layer Norm' },         // mint
  ffn:        { base: [0, 140, 200],  glow: 'rgba(0,140,200,',  label: 'Feed-Forward Network' }, // deep tron blue
  layernorm2: { base: [40, 255, 160], glow: 'rgba(40,255,160,', label: 'Layer Norm' },         // mint
  output:     { base: [80, 220, 120], glow: 'rgba(80,220,120,', label: 'Softmax Output' },     // bright console green
};

// ─── Group Layout ────────────────────────────────────────────────

function buildGroups(w, h) {
  const pad = 0.04;
  const groupW = 0.12;
  const groupH = 0.55;
  const topY = 0.22;
  const gap = (1 - pad * 2 - groupW * 6) / 5;

  function gx(i) { return pad + i * (groupW + gap); }

  return [
    { key: 'embedding',  x: gx(0) * w, y: topY * h, w: groupW * w, h: groupH * h },
    { key: 'attention',  x: gx(1) * w, y: topY * h, w: groupW * w, h: groupH * h },
    { key: 'layernorm1', x: gx(2) * w, y: topY * h, w: groupW * w, h: groupH * h },
    { key: 'ffn',        x: gx(3) * w, y: topY * h, w: groupW * w, h: groupH * h },
    { key: 'layernorm2', x: gx(4) * w, y: topY * h, w: groupW * w, h: groupH * h },
    { key: 'output',     x: gx(5) * w, y: topY * h, w: groupW * w, h: groupH * h },
  ];
}

let groups = buildGroups(canvas.width, canvas.height);

// ─── Network Node Structures ─────────────────────────────────────
// Pre-compute node positions and connections for each group.
// Each structure has layers of nodes with connections between them.

function buildNodeStructures() {
  const structures = {};

  for (const g of groups) {
    const col = COLORS[g.key];
    const nodes = [];   // { x, y, r }
    const edges = [];   // { x1, y1, x2, y2 }
    const pad = 0.1;    // padding inside group box
    const innerX = g.x + g.w * pad;
    const innerY = g.y + g.h * pad;
    const innerW = g.w * (1 - pad * 2);
    const innerH = g.h * (1 - pad * 2);
    const nodeR = Math.max(3, Math.min(6, g.w * 0.03));

    switch (g.key) {
      case 'embedding': {
        // Grid of cells at top (lookup table) funneling to vector nodes at bottom
        const gridCols = 6;
        const gridRows = 4;
        const vecNodes = 8;
        // Grid cells (top 40%)
        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            nodes.push({
              x: innerX + (c + 0.5) / gridCols * innerW,
              y: innerY + (r + 0.5) / gridRows * innerH * 0.4,
              r: nodeR * 0.8,
              type: 'grid'
            });
          }
        }
        // Vector nodes (bottom row, 80% down)
        for (let i = 0; i < vecNodes; i++) {
          const nx = innerX + (i + 0.5) / vecNodes * innerW;
          const ny = innerY + innerH * 0.85;
          nodes.push({ x: nx, y: ny, r: nodeR, type: 'vec' });
        }
        // Connections: each grid cell in bottom row connects to vector nodes
        for (let c = 0; c < gridCols; c++) {
          const gridIdx = (gridRows - 1) * gridCols + c;
          const gn = nodes[gridIdx];
          for (let v = 0; v < vecNodes; v++) {
            const vn = nodes[gridCols * gridRows + v];
            edges.push({ x1: gn.x, y1: gn.y, x2: vn.x, y2: vn.y });
          }
        }
        // Vertical connections within grid columns
        for (let c = 0; c < gridCols; c++) {
          for (let r = 0; r < gridRows - 1; r++) {
            const a = nodes[r * gridCols + c];
            const b = nodes[(r + 1) * gridCols + c];
            edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
          }
        }
        break;
      }

      case 'attention': {
        // 4 attention heads: input splits into Q,K,V streams, merges at bottom
        const heads = 4;
        const inputNodes = 6;
        const outputNodes = 6;
        // Input layer (top)
        for (let i = 0; i < inputNodes; i++) {
          nodes.push({
            x: innerX + (i + 0.5) / inputNodes * innerW,
            y: innerY + innerH * 0.05,
            r: nodeR, type: 'input'
          });
        }
        // Q, K, V rows per head (3 rows in middle)
        const labels = ['Q', 'K', 'V'];
        for (let h = 0; h < heads; h++) {
          const hx = innerX + (h + 0.5) / heads * innerW;
          for (let qkv = 0; qkv < 3; qkv++) {
            nodes.push({
              x: hx + (qkv - 1) * nodeR * 2.5,
              y: innerY + innerH * (0.3 + qkv * 0.15),
              r: nodeR * 0.7, type: labels[qkv]
            });
          }
        }
        // Output layer (bottom)
        for (let i = 0; i < outputNodes; i++) {
          nodes.push({
            x: innerX + (i + 0.5) / outputNodes * innerW,
            y: innerY + innerH * 0.9,
            r: nodeR, type: 'output'
          });
        }
        // Connections: input -> each head's Q,K,V
        for (let i = 0; i < inputNodes; i++) {
          for (let h = 0; h < heads; h++) {
            const qIdx = inputNodes + h * 3;
            edges.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[qIdx].x, y2: nodes[qIdx].y });
          }
        }
        // Q->K->V chains per head
        for (let h = 0; h < heads; h++) {
          const base = inputNodes + h * 3;
          edges.push({ x1: nodes[base].x, y1: nodes[base].y, x2: nodes[base+1].x, y2: nodes[base+1].y });
          edges.push({ x1: nodes[base+1].x, y1: nodes[base+1].y, x2: nodes[base+2].x, y2: nodes[base+2].y });
        }
        // V -> output nodes
        for (let h = 0; h < heads; h++) {
          const vIdx = inputNodes + h * 3 + 2;
          for (let o = 0; o < outputNodes; o++) {
            const outIdx = inputNodes + heads * 3 + o;
            edges.push({ x1: nodes[vIdx].x, y1: nodes[vIdx].y, x2: nodes[outIdx].x, y2: nodes[outIdx].y });
          }
        }
        break;
      }

      case 'layernorm1':
      case 'layernorm2': {
        // Single clean horizontal row with normalization arrows
        const count = 8;
        // Input row (top)
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: innerX + (i + 0.5) / count * innerW,
            y: innerY + innerH * 0.2,
            r: nodeR * 0.9, type: 'in'
          });
        }
        // Normalized row (middle) — all same size, evenly spaced
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: innerX + (i + 0.5) / count * innerW,
            y: innerY + innerH * 0.5,
            r: nodeR, type: 'norm'
          });
        }
        // Output row (bottom)
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: innerX + (i + 0.5) / count * innerW,
            y: innerY + innerH * 0.8,
            r: nodeR * 0.9, type: 'out'
          });
        }
        // Straight 1:1 connections
        for (let i = 0; i < count; i++) {
          edges.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[count + i].x, y2: nodes[count + i].y });
          edges.push({ x1: nodes[count + i].x, y1: nodes[count + i].y, x2: nodes[count * 2 + i].x, y2: nodes[count * 2 + i].y });
        }
        break;
      }

      case 'ffn': {
        // Classic neural net: narrow(6) → wide(12) → narrow(6)
        const layers = [6, 12, 6];
        const yPositions = [0.15, 0.5, 0.85];
        let offset = 0;
        for (let l = 0; l < layers.length; l++) {
          const count = layers[l];
          for (let i = 0; i < count; i++) {
            nodes.push({
              x: innerX + (i + 0.5) / count * innerW,
              y: innerY + innerH * yPositions[l],
              r: nodeR * (l === 1 ? 0.7 : 1), type: `layer${l}`
            });
          }
        }
        // Fully connected between adjacent layers
        offset = 0;
        for (let l = 0; l < layers.length - 1; l++) {
          const prevStart = offset;
          const prevCount = layers[l];
          offset += prevCount;
          const nextStart = offset;
          const nextCount = layers[l + 1];
          for (let p = 0; p < prevCount; p++) {
            for (let n = 0; n < nextCount; n++) {
              edges.push({
                x1: nodes[prevStart + p].x, y1: nodes[prevStart + p].y,
                x2: nodes[nextStart + n].x, y2: nodes[nextStart + n].y
              });
            }
          }
        }
        break;
      }

      case 'output': {
        // Narrow input (4) fanning out to wide vocabulary (14)
        const inputCount = 4;
        const vocabCount = 14;
        // Input
        for (let i = 0; i < inputCount; i++) {
          nodes.push({
            x: innerX + (i + 0.5) / inputCount * innerW,
            y: innerY + innerH * 0.2,
            r: nodeR, type: 'in'
          });
        }
        // Vocab output — tall column spread
        for (let i = 0; i < vocabCount; i++) {
          nodes.push({
            x: innerX + innerW * 0.5 + (Math.random() - 0.5) * innerW * 0.6,
            y: innerY + innerH * 0.4 + (i / vocabCount) * innerH * 0.55,
            r: nodeR * (0.4 + Math.random() * 0.6), type: 'vocab'
          });
        }
        // Each input connects to all vocab
        for (let i = 0; i < inputCount; i++) {
          for (let v = 0; v < vocabCount; v++) {
            edges.push({
              x1: nodes[i].x, y1: nodes[i].y,
              x2: nodes[inputCount + v].x, y2: nodes[inputCount + v].y
            });
          }
        }
        break;
      }
    }

    structures[g.key] = { nodes, edges, color: col };
  }
  return structures;
}

let nodeStructures = buildNodeStructures();

// ─── Bridge Connections Between Groups ───────────────────────────
// Find "exit" nodes (rightmost / last layer) of each group and
// "entry" nodes (leftmost / first layer) of the next, then create
// sparse connecting lines between them.

function getExitNodes(key, nodes) {
  // Return nodes from the last/output layer of each structure
  switch (key) {
    case 'embedding':  return nodes.filter(n => n.type === 'vec');
    case 'attention':  return nodes.filter(n => n.type === 'output');
    case 'layernorm1': return nodes.filter(n => n.type === 'out');
    case 'ffn':        return nodes.filter(n => n.type === 'layer2');
    case 'layernorm2': return nodes.filter(n => n.type === 'out');
    case 'output':     return nodes.filter(n => n.type === 'vocab');
    default: return [];
  }
}

function getEntryNodes(key, nodes) {
  switch (key) {
    case 'embedding':  return nodes.filter(n => n.type === 'grid').slice(0, 6); // first row
    case 'attention':  return nodes.filter(n => n.type === 'input');
    case 'layernorm1': return nodes.filter(n => n.type === 'in');
    case 'ffn':        return nodes.filter(n => n.type === 'layer0');
    case 'layernorm2': return nodes.filter(n => n.type === 'in');
    case 'output':     return nodes.filter(n => n.type === 'in');
    default: return [];
  }
}

let bridgeEdges = []; // { x1,y1,x2,y2, cr,cg,cb }

function buildBridges() {
  bridgeEdges = [];
  const groupKeys = groups.map(g => g.key);

  for (let i = 0; i < groups.length - 1; i++) {
    const fromKey = groupKeys[i];
    const toKey = groupKeys[i + 1];
    const fromStruct = nodeStructures[fromKey];
    const toStruct = nodeStructures[toKey];

    const exits = getExitNodes(fromKey, fromStruct.nodes);
    const entries = getEntryNodes(toKey, toStruct.nodes);

    if (exits.length === 0 || entries.length === 0) continue;

    // Pick sparse subset: every 2nd exit → every 2nd entry
    const sparseExits = exits.filter((_, idx) => idx % 2 === 0);
    const sparseEntries = entries.filter((_, idx) => idx % 2 === 0);

    // Blend colors between the two groups
    const cFrom = COLORS[fromKey].base;
    const cTo = COLORS[toKey].base;
    const cr = Math.round((cFrom[0] + cTo[0]) / 2);
    const cg = Math.round((cFrom[1] + cTo[1]) / 2);
    const cb = Math.round((cFrom[2] + cTo[2]) / 2);

    // Connect each sparse exit to a corresponding sparse entry (wrap around)
    for (let e = 0; e < sparseExits.length; e++) {
      const entry = sparseEntries[e % sparseEntries.length];
      bridgeEdges.push({
        x1: sparseExits[e].x, y1: sparseExits[e].y,
        x2: entry.x, y2: entry.y,
        cr, cg, cb
      });
    }
  }
}

buildBridges();

// ─── Flow Field ──────────────────────────────────────────────────

const cellSize = 8;
let cols, rows, flowField, flowColors;

function buildFlowField(w, h) {
  cols = Math.ceil(w / cellSize);
  rows = Math.ceil(h / cellSize);
  flowField = new Float32Array(cols * rows);
  flowColors = new Uint8Array(cols * rows * 3);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const px = c * cellSize;
      const py = r * cellSize;

      let angle = Math.cos(r * 0.04) * 0.3;
      let cr = 20, cg = 50, cb = 45;

      let inGroup = null;
      for (const g of groups) {
        if (px >= g.x && px < g.x + g.w && py >= g.y && py < g.y + g.h) {
          inGroup = g;
          break;
        }
      }

      if (inGroup) {
        const lx = (px - inGroup.x) / inGroup.w;
        const ly = (py - inGroup.y) / inGroup.h;
        const col = COLORS[inGroup.key];
        cr = col.base[0]; cg = col.base[1]; cb = col.base[2];

        // Each group gets its own character, but we blend heavily
        // toward 0 (rightward) so particles push left-to-right.
        let localAngle = 0;
        switch (inGroup.key) {
          case 'embedding':
            localAngle = Math.sin(ly * Math.PI * 3) * 0.5 + Math.sin(lx * Math.PI * 4) * 0.3;
            break;
          case 'attention':
            localAngle = Math.sin(lx * 6 + ly * 6) * 0.6 + Math.cos(ly * 4) * 0.3;
            break;
          case 'layernorm1':
          case 'layernorm2':
            localAngle = Math.sin(ly * Math.PI * 6) * 0.2;
            break;
          case 'ffn':
            localAngle = Math.sin(lx * Math.PI) * (ly - 0.5) * 1.5 + Math.cos(ly * 4) * 0.2;
            break;
          case 'output':
            localAngle = (ly - 0.5) * 0.8 + Math.cos(lx * 5) * 0.3;
            break;
        }
        // Blend: 70% rightward (0), 30% local character
        angle = localAngle * 0.3;
      } else {
        const nx = px / w;
        const ny = py / h;

        if (ny < 0.12) {
          angle = Math.PI + Math.sin(nx * Math.PI) * 0.6;
          cr = 0; cg = 100; cb = 90;
        } else if (ny > 0.88) {
          angle = Math.PI + Math.sin(nx * Math.PI) * 0.4;
          cr = 0; cg = 80; cb = 70;
        } else {
          angle = Math.sin(ny * 3) * 0.25 + Math.cos(nx * 2) * 0.15;
          cr = 15; cg = 45; cb = 40;
        }
      }

      flowField[idx] = angle;
      flowColors[idx * 3] = cr;
      flowColors[idx * 3 + 1] = cg;
      flowColors[idx * 3 + 2] = cb;
    }
  }

  // Second pass: override gap cells near bridge lines to follow them.
  // For each bridge, stamp cells within a corridor to aim along the bridge.
  const corridorRadius = 30; // pixels from bridge line to influence
  for (const b of bridgeEdges) {
    const dx = b.x2 - b.x1;
    const dy = b.y2 - b.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    const bridgeAngle = Math.atan2(dy, dx);

    // Walk along the bridge in steps
    const steps = Math.ceil(len / cellSize);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const bx = b.x1 + dx * t;
      const by = b.y1 + dy * t;

      // Stamp a few cells around this point
      for (let oy = -corridorRadius; oy <= corridorRadius; oy += cellSize) {
        for (let ox = -corridorRadius; ox <= corridorRadius; ox += cellSize) {
          const px = bx + ox;
          const py = by + oy;
          const gc = Math.floor(px / cellSize);
          const gr = Math.floor(py / cellSize);
          if (gc < 0 || gc >= cols || gr < 0 || gr >= rows) continue;

          // Skip cells that are inside a group box
          let insideGroup = false;
          for (const g of groups) {
            if (px >= g.x && px < g.x + g.w && py >= g.y && py < g.y + g.h) {
              insideGroup = true;
              break;
            }
          }
          if (insideGroup) continue;

          const dist = Math.sqrt(ox * ox + oy * oy);
          if (dist > corridorRadius) continue;

          const idx = gr * cols + gc;
          // Blend toward bridge angle based on proximity
          const influence = 1 - dist / corridorRadius;
          flowField[idx] = flowField[idx] * (1 - influence * 0.85) + bridgeAngle * influence * 0.85;
          // Blend color too
          flowColors[idx * 3]     = Math.round(flowColors[idx * 3]     * (1 - influence * 0.6) + b.cr * influence * 0.6);
          flowColors[idx * 3 + 1] = Math.round(flowColors[idx * 3 + 1] * (1 - influence * 0.6) + b.cg * influence * 0.6);
          flowColors[idx * 3 + 2] = Math.round(flowColors[idx * 3 + 2] * (1 - influence * 0.6) + b.cb * influence * 0.6);
        }
      }
    }
  }
}

buildFlowField(canvas.width, canvas.height);

// ─── Particle ────────────────────────────────────────────────────

class Particle {
  constructor(effect) {
    this.effect = effect;
    this.maxLength = Math.floor(Math.random() * 40 + 10);
    this.speedModifier = Math.random() * 0.42 + 0.08;
    this.angleCorrector = Math.random() * 0.4 + 0.05;
    this.angle = 0;
    this.timer = 0;
    this.history = [];
    this.color = 'rgba(100,120,180,0.8)';
    this.lineWidth = Math.random() * 1.5 + 0.3;
    this.reset();
  }

  draw() {
    if (this.history.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
  }

  update() {
    this.timer--;
    if (this.timer >= 1) {
      const c = Math.floor(this.x / cellSize);
      const r = Math.floor(this.y / cellSize);
      if (c >= 0 && c < cols && r >= 0 && r < rows) {
        const idx = r * cols + c;
        const target = flowField[idx];
        let diff = target - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * this.angleCorrector;

        const cr = flowColors[idx * 3];
        const cg = flowColors[idx * 3 + 1];
        const cb = flowColors[idx * 3 + 2];
        const alpha = 0.4 + (this.history.length / this.maxLength) * 0.5;
        this.color = `rgba(${cr},${cg},${cb},${alpha.toFixed(2)})`;
      }

      this.x += Math.cos(this.angle) * this.speedModifier;
      this.y += Math.sin(this.angle) * this.speedModifier;

      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.maxLength) {
        this.history.shift();
      }

      if (this.x < -20) this.x = this.effect.width + 10;
      if (this.x > this.effect.width + 20) this.x = -10;
      if (this.y < -20 || this.y > this.effect.height + 20) this.reset();
    } else if (this.history.length > 1) {
      this.history.shift();
    } else {
      this.reset();
    }
  }

  reset() {
    this.x = Math.random() * this.effect.width;
    this.y = Math.random() * this.effect.height;
    this.history = [{ x: this.x, y: this.y }];
    this.timer = this.maxLength * 2;
    this.angle = 0;
  }
}

// ─── Effect ──────────────────────────────────────────────────────

class Effect {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
    this.numberOfParticles = 1800;
    this.debug = false;
    this.time = 0;

    this.init();

    window.addEventListener('keydown', e => {
      if (e.key === 'd') this.debug = !this.debug;
    });

    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
    groups = buildGroups(w, h);
    nodeStructures = buildNodeStructures();
    buildBridges();
    buildFlowField(w, h);
    this.particles = [];
    this.init();
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  drawNetworkStructures() {
    this.time += 0.008;

    for (const g of groups) {
      const s = nodeStructures[g.key];
      const col = s.color;

      // ── Group border ──
      ctx.save();
      ctx.strokeStyle = col.glow + '0.18)';
      ctx.lineWidth = 1;
      ctx.shadowColor = col.glow + '0.3)';
      ctx.shadowBlur = 14;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.restore();

      // ── Label ──
      ctx.save();
      ctx.font = `${Math.max(11, Math.min(14, g.w * 0.08))}px "Courier New", monospace`;
      ctx.fillStyle = col.glow + '0.65)';
      ctx.textAlign = 'center';
      ctx.fillText(col.label, g.x + g.w / 2, g.y - 10);
      ctx.restore();

      // ── Edges (connections) ──
      ctx.save();
      ctx.lineWidth = 0.4;
      for (const e of s.edges) {
        // Pulse: subtle brightness wave traveling along connections
        const pulse = Math.sin(this.time * 3 + e.x1 * 0.01 + e.y1 * 0.01) * 0.5 + 0.5;
        const alpha = 0.04 + pulse * 0.08;
        ctx.strokeStyle = col.glow + alpha.toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
      }
      ctx.restore();

      // ── Nodes ──
      ctx.save();
      for (let ni = 0; ni < s.nodes.length; ni++) {
        const n = s.nodes[ni];
        // Gentle individual pulse
        const pulse = Math.sin(this.time * 2 + ni * 0.7) * 0.5 + 0.5;
        const alpha = 0.25 + pulse * 0.35;
        const r = n.r * (0.9 + pulse * 0.2);

        // Glow
        ctx.shadowColor = col.glow + '0.5)';
        ctx.shadowBlur = 8;

        // Filled circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col.glow + alpha.toFixed(2) + ')';
        ctx.fill();

        // Ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = col.glow + (alpha * 0.8).toFixed(2) + ')';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
  }

  drawInterGroupConnections() {
    ctx.save();

    // ── Node-to-node bridge lines between groups ──
    ctx.lineWidth = 0.6;
    ctx.setLineDash([]);
    for (const b of bridgeEdges) {
      const pulse = Math.sin(this.time * 2 + b.x1 * 0.005 + b.y1 * 0.005) * 0.5 + 0.5;
      const alpha = 0.06 + pulse * 0.1;
      ctx.strokeStyle = `rgba(${b.cr},${b.cg},${b.cb},${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    }

    // ── Dashed center arrows (keep as subtle backdrop) ──
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(0,160,120,0.08)';
    for (let i = 0; i < groups.length - 1; i++) {
      const a = groups[i];
      const b = groups[i + 1];
      const ax = a.x + a.w;
      const ay = a.y + a.h / 2;
      const bx = b.x;
      const by = b.y + b.h / 2;
      ctx.beginPath();
      ctx.moveTo(ax + 4, ay);
      ctx.lineTo(bx - 4, by);
      ctx.stroke();
    }

    // Skip connections
    ctx.strokeStyle = 'rgba(0,180,140,0.08)';
    ctx.setLineDash([4, 6]);
    const outG = groups[5];
    const attG = groups[1];
    ctx.beginPath();
    ctx.moveTo(outG.x + outG.w / 2, outG.y);
    ctx.quadraticCurveTo(
      (outG.x + attG.x) / 2, outG.y - canvas.height * 0.15,
      attG.x + attG.w / 2, attG.y
    );
    ctx.stroke();

    const ffnG = groups[3];
    const ln1G = groups[2];
    ctx.strokeStyle = 'rgba(0,200,100,0.08)';
    ctx.beginPath();
    ctx.moveTo(ffnG.x + ffnG.w / 2, ffnG.y + ffnG.h);
    ctx.quadraticCurveTo(
      (ffnG.x + ln1G.x) / 2, ffnG.y + ffnG.h + canvas.height * 0.1,
      ln1G.x + ln1G.w / 2, ln1G.y + ln1G.h
    );
    ctx.stroke();

    ctx.restore();
  }

  drawLabels() {
    ctx.save();
    ctx.font = `${Math.max(16, Math.min(26, canvas.width * 0.016))}px "Courier New", monospace`;
    ctx.fillStyle = 'rgba(0,200,140,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('Transformer Block — Flow Field Visualization', canvas.width / 2, canvas.height * 0.08);

    ctx.font = `${Math.max(10, Math.min(13, canvas.width * 0.009))}px "Courier New", monospace`;
    ctx.fillStyle = 'rgba(0,160,120,0.25)';
    ctx.fillText('Particles trace data flow through embedding → attention → FFN → output  |  Press D for debug grid', canvas.width / 2, canvas.height * 0.94);
    ctx.restore();
  }

  drawDebugGrid() {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#446';
    ctx.lineWidth = 0.3;
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, this.height);
      ctx.stroke();
    }
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(this.width, r * cellSize);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.3;
    for (let r = 0; r < rows; r += 4) {
      for (let c = 0; c < cols; c += 4) {
        const idx = r * cols + c;
        const a = flowField[idx];
        const cx2 = c * cellSize + cellSize / 2;
        const cy2 = r * cellSize + cellSize / 2;
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(cx2 + Math.cos(a) * cellSize * 2, cy2 + Math.sin(a) * cellSize * 2);
        ctx.strokeStyle = `rgb(${flowColors[idx*3]},${flowColors[idx*3+1]},${flowColors[idx*3+2]})`;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  render() {
    this.drawNetworkStructures();
    this.drawInterGroupConnections();
    this.drawLabels();
    if (this.debug) this.drawDebugGrid();
    this.particles.forEach(p => {
      p.draw();
      p.update();
    });
  }
}

// ─── Animation Loop ──────────────────────────────────────────────

const effect = new Effect(canvas);

function animate() {
  ctx.fillStyle = 'rgba(5,5,16,0.12)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  effect.render();
  requestAnimationFrame(animate);
}
animate();
