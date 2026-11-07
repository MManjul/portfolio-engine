/**
 * AAA Master Background Canvas Orchestrator
 * Randomly selects one of three signature Game Engineering canvas simulations on launch:
 * 1. [NETCODE]: Server-Authoritative Netcode & Replication Stream (128Hz host, comet packets, rollback reconciliation)
 * 2. [WIREFRAME]: Unreal Engine 5 3D Topo Wireframe Terrain (perspective heightfield, LIDAR scanner, distance fog)
 * 3. [OCTREE]: Dynamic Octree & Bounding Box (AABB) Spatial Partitioning (recursive quadrant subdivision, broadphase tracking)
 *
 * Provides window.switchBackgroundEffect(mode) for runtime preview switching.
 */

/* ==========================================================================
   1. SERVER-AUTHORITATIVE NETCODE & REPLICATION PACKET STREAM ENGINE
   ========================================================================== */
class EliteNetcodePacketStreamCanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;

    this.mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      connected: false,
      reticleAngle: 0
    };

    this.nodes = [];
    this.connections = [];
    this.packets = [];
    this.particles = [];
    this.broadcastWaves = [];
    this.isMobile = window.innerWidth <= 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.time = 0;
    this.serverTick = 0;
    this.serverSpin = 0;
    this.heartbeatTimer = 0;
    this.rollbackEventTimer = 220;

    this.boundResize = this.resize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseOut = this.onMouseOut.bind(this);
    this.boundClick = this.onClick.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);

    this.start();
  }

  start() {
    this.isRunning = true;
    this.resize();
    this.bindEvents();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  stop() {
    this.isRunning = false;
    this.unbindEvents();
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  bindEvents() {
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseout', this.boundMouseOut);
    window.addEventListener('click', this.boundClick);
    window.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    window.addEventListener('touchmove', this.boundTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  unbindEvents() {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseout', this.boundMouseOut);
    window.removeEventListener('click', this.boundClick);
    window.removeEventListener('touchstart', this.boundTouchStart);
    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
  }

  onMouseMove(e) {
    this.mouse.targetX = e.clientX;
    this.mouse.targetY = e.clientY;
    this.mouse.connected = true;
  }

  onMouseOut() {
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
    this.mouse.connected = false;
  }

  onClick(e) {
    this.broadcastRPC(e.clientX, e.clientY);
  }

  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      this.mouse.targetX = t.clientX;
      this.mouse.targetY = t.clientY;
      this.mouse.connected = true;
      this.broadcastRPC(t.clientX, t.clientY);
    }
  }

  onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      this.mouse.targetX = t.clientX;
      this.mouse.targetY = t.clientY;
    }
  }

  onTouchEnd() {
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
    this.mouse.connected = false;
  }

  resize() {
    this.isMobile = window.innerWidth <= 768;
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.canvasWidth * this.dpr;
    this.canvas.height = this.canvasHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.buildNetworkTopology();
  }

  buildNetworkTopology() {
    this.nodes = [];
    this.connections = [];
    this.packets = [];

    // Central Dedicated Server Node
    const serverNode = {
      id: 'SERVER_AUTH_128Hz',
      isServer: true,
      x: this.canvasWidth * 0.5,
      y: this.canvasHeight * (this.isMobile ? 0.38 : 0.44),
      baseX: this.canvasWidth * 0.5,
      baseY: this.canvasHeight * (this.isMobile ? 0.38 : 0.44),
      r: this.isMobile ? 18 : 25,
      label: 'SERVER_AUTH_128Hz',
      sublabel: 'TICK: 128Hz // 0% LOSS',
      color: '0, 242, 254',
      flashAlpha: 0,
      phase: 0
    };
    this.nodes.push(serverNode);

    // Replicated Client Endpoints
    const clientCount = this.isMobile ? 5 : 8;
    const clientSpecs = [
      { name: 'CLIENT_01', tag: 'PREDICT_LOC', rtt: '14ms' },
      { name: 'CLIENT_02', tag: 'SERVER_RECON', rtt: '22ms' },
      { name: 'CLIENT_03', tag: 'RPC_DISPATCH', rtt: '18ms' },
      { name: 'CLIENT_04', tag: 'TG_PRE_PHYS', rtt: '12ms' },
      { name: 'CLIENT_05', tag: 'INTERP_PROXY', rtt: '26ms' },
      { name: 'CLIENT_06', tag: 'ROLLBACK_BUF', rtt: '15ms' },
      { name: 'CLIENT_07', tag: 'NET_DRIVER', rtt: '19ms' },
      { name: 'CLIENT_08', tag: 'AUTH_VALID', rtt: '24ms' }
    ];

    const radiusX = this.canvasWidth * (this.isMobile ? 0.38 : 0.36);
    const radiusY = this.canvasHeight * (this.isMobile ? 0.34 : 0.32);

    for (let i = 0; i < clientCount; i++) {
      const angle = (i / clientCount) * Math.PI * 2 + 0.35;
      const x = serverNode.baseX + Math.cos(angle) * radiusX;
      const y = serverNode.baseY + Math.sin(angle) * radiusY;
      const spec = clientSpecs[i % clientSpecs.length];

      const clientNode = {
        id: spec.name,
        isServer: false,
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        r: this.isMobile ? 11 : 15,
        label: spec.name,
        sublabel: spec.tag,
        ping: spec.rtt,
        color: '0, 242, 254',
        flashAlpha: 0,
        phase: Math.random() * Math.PI * 2
      };
      this.nodes.push(clientNode);

      this.connections.push({
        from: serverNode,
        to: clientNode,
        length: Math.hypot(clientNode.x - serverNode.x, clientNode.y - serverNode.y),
        packetTimer: Math.floor(Math.random() * 35),
        isPeer: false
      });
    }

    // P2P Gossip Edges
    for (let i = 1; i < this.nodes.length; i++) {
      const nextIdx = i === this.nodes.length - 1 ? 1 : i + 1;
      this.connections.push({
        from: this.nodes[i],
        to: this.nodes[nextIdx],
        length: Math.hypot(this.nodes[nextIdx].x - this.nodes[i].x, this.nodes[nextIdx].y - this.nodes[i].y),
        isPeer: true,
        packetTimer: Math.floor(Math.random() * 70)
      });
    }
  }

  broadcastRPC(originX, originY) {
    if (this.broadcastWaves.length > 3) this.broadcastWaves.shift();
    this.broadcastWaves.push({
      x: originX,
      y: originY,
      radius: 10,
      maxRadius: this.isMobile ? 260 : 420,
      life: 0,
      maxLife: 35,
      color: '255, 209, 102'
    });

    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i];
      if (!conn.isPeer) {
        this.spawnPacket(conn, true, 'RPC_MULTICAST', '255, 209, 102');
      }
    }
  }

  spawnPacket(conn, isHighPriority = false, customLabel = null, customColor = null) {
    const isServerOut = conn.from.isServer;
    const color = customColor || (isHighPriority ? '255, 209, 102' : '0, 242, 254');
    const label = customLabel || (isServerOut ? 'SNAPSHOT' : 'CLIENT_INPUT');

    this.packets.push({
      conn: conn,
      progress: 0,
      speed: isHighPriority ? 0.042 : 0.016 + Math.random() * 0.012,
      direction: isServerOut ? 1 : -1,
      color: color,
      size: isHighPriority ? 3.5 : 2.4,
      label: label,
      trailHistory: []
    });
  }

  spawnArrivalSparks(x, y, color) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        alpha: 0.9,
        life: 0,
        maxLife: 16
      });
    }
  }

  triggerRollbackReconciliation() {
    if (this.nodes.length <= 1) return;
    const clientIdx = 1 + Math.floor(Math.random() * (this.nodes.length - 1));
    const client = this.nodes[clientIdx];
    client.flashAlpha = 0.95;
    client.color = '244, 63, 94';

    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i];
      if (conn.to === client && conn.from.isServer) {
        this.spawnPacket(conn, true, 'ROLLBACK_RECONCILE', '244, 63, 94');
        setTimeout(() => {
          client.color = '0, 242, 254';
          client.flashAlpha = 0.8;
          this.spawnArrivalSparks(client.x, client.y, '0, 242, 254');
        }, 550);
        break;
      }
    }
  }

  render() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.time += 0.012;
    this.serverTick++;
    this.serverSpin += 0.008;

    // Heartbeat Pulse
    this.heartbeatTimer++;
    if (this.heartbeatTimer > 210) {
      this.heartbeatTimer = 0;
      const server = this.nodes[0];
      if (server) {
        this.broadcastWaves.push({
          x: server.x,
          y: server.y,
          radius: server.r,
          maxRadius: server.r + 90,
          life: 0,
          maxLife: 45,
          color: '0, 242, 254'
        });
      }
    }

    // Rollback Reconciliation Event
    this.rollbackEventTimer--;
    if (this.rollbackEventTimer <= 0) {
      this.rollbackEventTimer = 900 + Math.floor(Math.random() * 400);
      this.triggerRollbackReconciliation();
    }

    // Cursor Smooth Interpolation
    if (this.mouse.targetX !== -1000) {
      if (this.mouse.x === -1000) {
        this.mouse.x = this.mouse.targetX;
        this.mouse.y = this.mouse.targetY;
      } else {
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.18;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.18;
      }
      this.mouse.reticleAngle += 0.025;
    } else {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }

    // Arrival Sparks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life++;
      pt.alpha *= 0.88;

      if (pt.life >= pt.maxLife || pt.alpha <= 0.02) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = `rgba(${pt.color}, ${pt.alpha})`;
      this.ctx.fillRect(pt.x - 1, pt.y - 1, 2, 2);
    }

    // Broadcast Shockwaves
    for (let i = this.broadcastWaves.length - 1; i >= 0; i--) {
      const bw = this.broadcastWaves[i];
      bw.life++;
      bw.radius += (bw.maxRadius - bw.radius) * 0.09 + 3;
      const alpha = Math.max(0, 1 - bw.life / bw.maxLife);

      if (bw.life >= bw.maxLife) {
        this.broadcastWaves.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(bw.x, bw.y, bw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(${bw.color}, ${alpha * 0.65})`;
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();

      for (let n = 0; n < this.nodes.length; n++) {
        const node = this.nodes[n];
        const dist = Math.hypot(node.x - bw.x, node.y - bw.y);
        if (Math.abs(dist - bw.radius) < 25) {
          node.flashAlpha = Math.max(node.flashAlpha, 0.7);
        }
      }
    }

    // Ambient Node Drift
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.phase += 0.015;
      node.x = node.baseX + Math.sin(node.phase) * (node.isServer ? 3 : 7);
      node.y = node.baseY + Math.cos(node.phase * 0.8) * (node.isServer ? 3 : 7);

      if (node.flashAlpha > 0) {
        node.flashAlpha = Math.max(0, node.flashAlpha - 0.025);
      }
    }

    // Conduits
    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i];
      const from = conn.from;
      const to = conn.to;

      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - 14;
      this.ctx.quadraticCurveTo(midX, midY, to.x, to.y);

      const alpha = conn.isPeer ? 0.08 : 0.17;
      this.ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
      this.ctx.lineWidth = conn.isPeer ? 0.8 : 1.2;
      if (conn.isPeer) this.ctx.setLineDash([4, 6]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      conn.packetTimer--;
      if (conn.packetTimer <= 0) {
        conn.packetTimer = conn.isPeer ? 65 + Math.floor(Math.random() * 55) : 32 + Math.floor(Math.random() * 28);
        this.spawnPacket(conn, Math.random() < 0.18);
      }
    }

    // Cursor Network Tether
    if (this.mouse.x !== -1000) {
      const serverNode = this.nodes[0];
      this.ctx.beginPath();
      this.ctx.moveTo(serverNode.x, serverNode.y);
      const midX = (serverNode.x + this.mouse.x) / 2;
      const midY = (serverNode.y + this.mouse.y) / 2 - 20;
      this.ctx.quadraticCurveTo(midX, midY, this.mouse.x, this.mouse.y);
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();

      const r = 16;
      this.ctx.save();
      this.ctx.translate(this.mouse.x, this.mouse.y);
      this.ctx.rotate(this.mouse.reticleAngle);

      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
      this.ctx.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) {
        this.ctx.rotate(Math.PI / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(r - 4, -r);
        this.ctx.lineTo(r, -r);
        this.ctx.lineTo(r, -r + 4);
        this.ctx.stroke();
      }
      this.ctx.restore();

      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 242, 254, 0.95)';
      this.ctx.fill();

      this.ctx.font = '8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = 'rgba(0, 242, 254, 0.9)';
      this.ctx.fillText('AUTH_PEER // ZERO_LATENCY (0ms)', this.mouse.x + 22, this.mouse.y + 3);
    }

    // Laser Comet Packets
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const pkt = this.packets[i];
      pkt.progress += pkt.speed;

      const t = pkt.direction === 1 ? pkt.progress : 1 - pkt.progress;
      const from = pkt.conn.from;
      const to = pkt.conn.to;
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - 14;

      const px = Math.pow(1 - t, 2) * from.x + 2 * (1 - t) * t * midX + Math.pow(t, 2) * to.x;
      const py = Math.pow(1 - t, 2) * from.y + 2 * (1 - t) * t * midY + Math.pow(t, 2) * to.y;

      pkt.trailHistory.push({ x: px, y: py });
      if (pkt.trailHistory.length > 8) pkt.trailHistory.shift();

      if (pkt.progress >= 1.0) {
        const dest = pkt.direction === 1 ? pkt.conn.to : pkt.conn.from;
        dest.flashAlpha = 0.65;
        this.spawnArrivalSparks(dest.x, dest.y, pkt.color);
        this.packets.splice(i, 1);
        continue;
      }

      if (pkt.trailHistory.length > 1) {
        for (let j = 0; j < pkt.trailHistory.length - 1; j++) {
          const pt1 = pkt.trailHistory[j];
          const pt2 = pkt.trailHistory[j + 1];
          const tailAlpha = (j / pkt.trailHistory.length) * 0.65;
          this.ctx.beginPath();
          this.ctx.moveTo(pt1.x, pt1.y);
          this.ctx.lineTo(pt2.x, pt2.y);
          this.ctx.strokeStyle = `rgba(${pkt.color}, ${tailAlpha})`;
          this.ctx.lineWidth = pkt.size * (j / pkt.trailHistory.length);
          this.ctx.stroke();
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(px, py, pkt.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${pkt.color}, 0.95)`;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(px, py, pkt.size * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${pkt.color}, 0.22)`;
      this.ctx.fill();
    }

    // Nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const alpha = Math.min(0.95, 0.22 + node.flashAlpha);

      if (node.isServer) {
        this.ctx.save();
        this.ctx.translate(node.x, node.y);
        this.ctx.rotate(this.serverSpin);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, node.r + 7, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 242, 254, ${alpha * 0.85})`;
        this.ctx.lineWidth = 1.4;
        this.ctx.setLineDash([4, 4]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 242, 254, 0.28)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.9)';
        this.ctx.lineWidth = 1.6;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 242, 254, 1.0)';
        this.ctx.fill();

        this.ctx.font = '9px "JetBrains Mono", monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.label, node.x, node.y + node.r + 14);

        this.ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
        this.ctx.fillText(node.sublabel, node.x, node.y + node.r + 25);
        this.ctx.textAlign = 'left';
      } else {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.r + 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${node.color}, ${alpha * 0.75})`;
        this.ctx.lineWidth = 1.0;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${node.color}, 0.2)`;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${node.color}, 0.95)`;
        this.ctx.fill();

        if (!this.isMobile) {
          this.ctx.font = '8px "JetBrains Mono", monospace';
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(node.label, node.x, node.y + node.r + 12);

          this.ctx.fillStyle = `rgba(${node.color}, 0.75)`;
          this.ctx.fillText(`[${node.sublabel}] · ${node.ping}`, node.x, node.y + node.r + 21);
          this.ctx.textAlign = 'left';
        } else {
          this.ctx.font = '7.5px "JetBrains Mono", monospace';
          this.ctx.fillStyle = 'rgba(0, 242, 254, 0.8)';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(node.ping, node.x, node.y + node.r + 11);
          this.ctx.textAlign = 'left';
        }
      }
    }

    if (this.isRunning) requestAnimationFrame(this.render);
  }
}

/* ==========================================================================
   2. UNREAL ENGINE 5 3D TOPO WIREFRAME TERRAIN ENGINE
   ========================================================================== */
class UnrealTopoWireframeCanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;

    this.mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 180
    };

    this.isMobile = window.innerWidth <= 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.time = 0;
    this.scanZ = 200;
    this.shockwaves = [];

    this.boundResize = this.resize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseOut = this.onMouseOut.bind(this);
    this.boundClick = this.onClick.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);

    this.start();
  }

  start() {
    this.isRunning = true;
    this.resize();
    this.bindEvents();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  stop() {
    this.isRunning = false;
    this.unbindEvents();
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  bindEvents() {
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseout', this.boundMouseOut);
    window.addEventListener('click', this.boundClick);
    window.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    window.addEventListener('touchmove', this.boundTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  unbindEvents() {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseout', this.boundMouseOut);
    window.removeEventListener('click', this.boundClick);
    window.removeEventListener('touchstart', this.boundTouchStart);
    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
  }

  onMouseMove(e) {
    this.mouse.targetX = e.clientX;
    this.mouse.targetY = e.clientY;
  }

  onMouseOut() {
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
  }

  onClick(e) {
    this.triggerShockwave(e.clientX, e.clientY);
  }

  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      this.mouse.targetX = t.clientX;
      this.mouse.targetY = t.clientY;
      this.triggerShockwave(t.clientX, t.clientY);
    }
  }

  onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      this.mouse.targetX = t.clientX;
      this.mouse.targetY = t.clientY;
    }
  }

  onTouchEnd() {
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
  }

  resize() {
    this.isMobile = window.innerWidth <= 768;
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.canvasWidth * this.dpr;
    this.canvas.height = this.canvasHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.fov = Math.min(this.canvasWidth, this.canvasHeight) * 0.9;
    this.horizonY = this.canvasHeight * 0.48;
    this.cameraHeight = this.isMobile ? 220 : 280;
    this.nearZ = 120;
    this.farZ = 1350;

    this.cols = this.isMobile ? 22 : 36;
    this.rows = this.isMobile ? 20 : 28;
    this.worldWidth = this.canvasWidth * (this.isMobile ? 2.2 : 2.5);
  }

  triggerShockwave(screenX, screenY) {
    if (this.shockwaves.length > 3) this.shockwaves.shift();
    this.shockwaves.push({
      x: screenX,
      y: screenY,
      radius: 10,
      maxRadius: this.isMobile ? 180 : 260,
      force: 28,
      life: 0,
      maxLife: 35
    });
  }

  render() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.time += 0.012;

    if (this.mouse.targetX !== -1000) {
      if (this.mouse.x === -1000) {
        this.mouse.x = this.mouse.targetX;
        this.mouse.y = this.mouse.targetY;
      } else {
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.15;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.15;
      }
    } else {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }

    this.scanZ += 4.5;
    if (this.scanZ > this.farZ) this.scanZ = this.nearZ;

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life++;
      sw.radius += (sw.maxRadius - sw.radius) * 0.1 + 3;
      sw.force *= 0.92;
      if (sw.life >= sw.maxLife || sw.force < 0.5) {
        this.shockwaves.splice(i, 1);
      }
    }

    const projectedGrid = [];

    for (let r = 0; r < this.rows; r++) {
      const rowVertices = [];
      const zProgress = r / (this.rows - 1);
      const z = this.nearZ + zProgress * (this.farZ - this.nearZ);
      const scale = this.fov / (z + 200);

      const depthFactor = 1 - Math.pow(zProgress, 1.4);
      const baseAlpha = Math.max(0.04, Math.min(0.55, depthFactor * 0.45));

      const scanDist = Math.abs(z - this.scanZ);
      const scanHighlight = scanDist < 80 ? (1 - scanDist / 80) * 0.45 : 0;

      for (let c = 0; c < this.cols; c++) {
        const xProgress = c / (this.cols - 1);
        const x = (xProgress - 0.5) * this.worldWidth;

        const wave1 = Math.sin(x * 0.0028 + this.time * 0.8) * Math.cos(z * 0.0035 + this.time * 0.6) * 48;
        const wave2 = Math.sin(x * 0.0055 - z * 0.004 + this.time * 1.1) * 22;
        const valley = Math.pow(Math.abs(xProgress - 0.5) * 2, 1.8) * 45;
        let elevation = wave1 + wave2 + valley;

        const screenX = this.canvasWidth * 0.5 + x * scale;
        const screenY = this.horizonY + (this.cameraHeight - elevation) * scale;

        let mouseDeform = 0;
        if (this.mouse.x !== -1000) {
          const distToCursor = Math.hypot(screenX - this.mouse.x, screenY - this.mouse.y);
          if (distToCursor < this.mouse.radius) {
            const prox = 1 - distToCursor / this.mouse.radius;
            mouseDeform = Math.sin(prox * Math.PI) * 35;
          }
        }

        let shockDeform = 0;
        for (let s = 0; s < this.shockwaves.length; s++) {
          const sw = this.shockwaves[s];
          const distToSw = Math.hypot(screenX - sw.x, screenY - sw.y);
          const waveDelta = Math.abs(distToSw - sw.radius);
          if (waveDelta < 30) {
            shockDeform += Math.cos((waveDelta / 30) * (Math.PI / 2)) * sw.force;
          }
        }

        const finalScreenY = screenY - mouseDeform + shockDeform;
        const finalAlpha = Math.min(0.85, baseAlpha + scanHighlight + (mouseDeform > 0 ? 0.35 : 0));

        rowVertices.push({
          x: screenX,
          y: finalScreenY,
          alpha: finalAlpha,
          zProgress: zProgress,
          isExcited: mouseDeform > 5 || scanHighlight > 0.2
        });
      }
      projectedGrid.push(rowVertices);
    }

    for (let r = 0; r < this.rows; r++) {
      const row = projectedGrid[r];
      this.ctx.beginPath();
      this.ctx.moveTo(row[0].x, row[0].y);

      for (let c = 1; c < this.cols; c++) {
        this.ctx.lineTo(row[c].x, row[c].y);
      }

      const avgAlpha = row[Math.floor(this.cols / 2)].alpha;
      this.ctx.strokeStyle = `rgba(0, 242, 254, ${avgAlpha})`;
      this.ctx.lineWidth = r % 4 === 0 ? 1.4 : 0.9;
      this.ctx.stroke();
    }

    for (let c = 0; c < this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(projectedGrid[0][c].x, projectedGrid[0][c].y);

      for (let r = 1; r < this.rows; r++) {
        this.ctx.lineTo(projectedGrid[r][c].x, projectedGrid[r][c].y);
      }

      const alpha = projectedGrid[Math.floor(this.rows * 0.4)][c].alpha * 0.75;
      this.ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
      this.ctx.lineWidth = c % 4 === 0 ? 1.2 : 0.75;
      this.ctx.stroke();
    }

    const step = this.isMobile ? 3 : 2;
    for (let r = 0; r < this.rows; r += step) {
      for (let c = 0; c < this.cols; c += step) {
        const v = projectedGrid[r][c];
        if (v.zProgress < 0.85 && v.alpha > 0.12) {
          const ptSize = v.isExcited ? 2.5 : 1.2;
          this.ctx.fillStyle = `rgba(0, 242, 254, ${v.alpha * 1.2})`;
          this.ctx.fillRect(v.x - ptSize * 0.5, v.y - ptSize * 0.5, ptSize, ptSize);
        }
      }
    }

    if (this.isRunning) requestAnimationFrame(this.render);
  }
}

/* ==========================================================================
   3. DYNAMIC OCTREE & BOUNDING BOX (AABB) SPATIAL PARTITIONING ENGINE
   ========================================================================== */
class DynamicOctreeAABBCanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;

    this.mouse = {
      x: -1000,
      y: -1000,
      radius: 140
    };

    this.rootNodes = [];
    this.entities = [];
    this.raycasts = [];
    this.isMobile = window.innerWidth <= 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.time = 0;

    this.boundResize = this.resize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseOut = this.onMouseOut.bind(this);
    this.boundClick = this.onClick.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);

    this.start();
  }

  start() {
    this.isRunning = true;
    this.resize();
    this.bindEvents();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  stop() {
    this.isRunning = false;
    this.unbindEvents();
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  bindEvents() {
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseout', this.boundMouseOut);
    window.addEventListener('click', this.boundClick);
    window.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    window.addEventListener('touchmove', this.boundTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  unbindEvents() {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseout', this.boundMouseOut);
    window.removeEventListener('click', this.boundClick);
    window.removeEventListener('touchstart', this.boundTouchStart);
    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onMouseOut() {
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  onClick(e) {
    this.fireRaycast(e.clientX, e.clientY);
  }

  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      this.mouse.x = t.clientX;
      this.mouse.y = t.clientY;
      this.fireRaycast(t.clientX, t.clientY);
    }
  }

  onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      this.mouse.x = t.clientX;
      this.mouse.y = t.clientY;
    }
  }

  onTouchEnd() {
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  resize() {
    this.isMobile = window.innerWidth <= 768;
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.canvasWidth * this.dpr;
    this.canvas.height = this.canvasHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.cols = this.isMobile ? 2 : 4;
    this.rows = this.isMobile ? 4 : 3;
    const cellW = this.canvasWidth / this.cols;
    const cellH = this.canvasHeight / this.rows;

    this.rootNodes = [];
    let id = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.rootNodes.push(this.createNode(id++, c * cellW, r * cellH, cellW, cellH, 0));
      }
    }

    const entityCount = this.isMobile ? 8 : 14;
    this.entities = [];
    for (let i = 0; i < entityCount; i++) {
      this.entities.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: Math.random() * 2 + 2,
        color: Math.random() > 0.3 ? '0, 242, 254' : '255, 209, 102'
      });
    }
  }

  createNode(id, x, y, w, h, depth) {
    return {
      id: id,
      x: x,
      y: y,
      w: w,
      h: h,
      depth: depth,
      maxDepth: 2,
      subdivideProgress: 0,
      subdivided: false,
      children: null,
      flashAlpha: 0,
      baseAlpha: 0.16 + (depth * 0.05),
      pulse: Math.random() * Math.PI * 2
    };
  }

  fireRaycast(originX, originY) {
    const angle = Math.random() * Math.PI * 2;
    this.raycasts.push({
      x: originX,
      y: originY,
      dx: Math.cos(angle) * 12,
      dy: Math.sin(angle) * 12,
      curX: originX,
      curY: originY,
      life: 0,
      maxLife: 40,
      points: [{ x: originX, y: originY }]
    });
  }

  subdivide(node) {
    if (node.children) return;
    const halfW = node.w / 2;
    const halfH = node.h / 2;
    const d = node.depth + 1;
    node.children = [
      this.createNode(node.id * 4 + 1, node.x, node.y, halfW, halfH, d),
      this.createNode(node.id * 4 + 2, node.x + halfW, node.y, halfW, halfH, d),
      this.createNode(node.id * 4 + 3, node.x, node.y + halfH, halfW, halfH, d),
      this.createNode(node.id * 4 + 4, node.x + halfW, node.y + halfH, halfW, halfH, d)
    ];
  }

  collapse(node) {
    node.children = null;
    node.subdivided = false;
  }

  updateNodeHierarchy(node) {
    node.pulse += 0.02;

    const centerX = node.x + node.w / 2;
    const centerY = node.y + node.h / 2;
    const distToCursor = Math.hypot(centerX - this.mouse.x, centerY - this.mouse.y);
    const cursorInside =
      this.mouse.x >= node.x &&
      this.mouse.x <= node.x + node.w &&
      this.mouse.y >= node.y &&
      this.mouse.y <= node.y + node.h;

    const shouldSubdivide = (cursorInside || distToCursor < this.mouse.radius) && node.depth < node.maxDepth;

    if (shouldSubdivide) {
      if (!node.subdivided) {
        node.subdivided = true;
        this.subdivide(node);
      }
      node.subdivideProgress = Math.min(1.0, node.subdivideProgress + 0.12);
    } else {
      if (node.subdivided) {
        node.subdivideProgress = Math.max(0, node.subdivideProgress - 0.08);
        if (node.subdivideProgress <= 0) {
          this.collapse(node);
        }
      }
    }

    if (node.flashAlpha > 0) {
      node.flashAlpha = Math.max(0, node.flashAlpha - 0.03);
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        this.updateNodeHierarchy(node.children[i]);
      }
    }
  }

  render() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.time += 0.015;

    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      ent.x += ent.vx;
      ent.y += ent.vy;

      if (ent.x < 0) ent.x = this.canvasWidth;
      if (ent.x > this.canvasWidth) ent.x = 0;
      if (ent.y < 0) ent.y = this.canvasHeight;
      if (ent.y > this.canvasHeight) ent.y = 0;

      for (let n = 0; n < this.rootNodes.length; n++) {
        const root = this.rootNodes[n];
        if (ent.x >= root.x && ent.x <= root.x + root.w && ent.y >= root.y && ent.y <= root.y + root.h) {
          root.flashAlpha = Math.max(root.flashAlpha, 0.22);
          break;
        }
      }

      this.ctx.fillStyle = `rgba(${ent.color}, 0.65)`;
      this.ctx.fillRect(ent.x - ent.size / 2, ent.y - ent.size / 2, ent.size, ent.size);
    }

    for (let i = this.raycasts.length - 1; i >= 0; i--) {
      const ray = this.raycasts[i];
      ray.life++;
      ray.curX += ray.dx;
      ray.curY += ray.dy;
      ray.points.push({ x: ray.curX, y: ray.curY });

      for (let n = 0; n < this.rootNodes.length; n++) {
        const root = this.rootNodes[n];
        if (ray.curX >= root.x && ray.curX <= root.x + root.w && ray.curY >= root.y && ray.curY <= root.y + root.h) {
          root.flashAlpha = 0.6;
        }
      }

      const alpha = Math.max(0, 1 - ray.life / ray.maxLife);
      if (ray.points.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(ray.points[0].x, ray.points[0].y);
        for (let p = 1; p < ray.points.length; p++) {
          this.ctx.lineTo(ray.points[p].x, ray.points[p].y);
        }
        this.ctx.strokeStyle = `rgba(255, 209, 102, ${alpha * 0.75})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }

      if (ray.life >= ray.maxLife) {
        this.raycasts.splice(i, 1);
      }
    }

    for (let i = 0; i < this.rootNodes.length; i++) {
      this.updateNodeHierarchy(this.rootNodes[i]);
      this.drawNode(this.rootNodes[i]);
    }

    if (this.isRunning) requestAnimationFrame(this.render);
  }

  drawNode(node) {
    const pad = 6;
    const x = node.x + pad;
    const y = node.y + pad;
    const w = node.w - pad * 2;
    const h = node.h - pad * 2;
    const cx = x + w / 2;
    const cy = y + h / 2;

    const baseAlpha = node.baseAlpha + Math.sin(node.pulse) * 0.03;
    const totalAlpha = Math.min(0.9, baseAlpha + node.flashAlpha + (node.subdivideProgress * 0.25));

    const bracketLen = Math.min(14, w * 0.15);
    this.ctx.strokeStyle = `rgba(0, 242, 254, ${totalAlpha * 0.95})`;
    this.ctx.lineWidth = 1.2;

    // Corner Reticles
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + bracketLen);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x + bracketLen, y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x + w - bracketLen, y);
    this.ctx.lineTo(x + w, y);
    this.ctx.lineTo(x + w, y + bracketLen);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + h - bracketLen);
    this.ctx.lineTo(x, y + h);
    this.ctx.lineTo(x + bracketLen, y + h);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x + w - bracketLen, y + h);
    this.ctx.lineTo(x + w, y + h);
    this.ctx.lineTo(x + w, y + h - bracketLen);
    this.ctx.stroke();

    this.ctx.strokeStyle = `rgba(0, 242, 254, ${totalAlpha * 0.3})`;
    this.ctx.lineWidth = 0.8;
    this.ctx.strokeRect(x, y, w, h);

    const crossSize = 3;
    this.ctx.strokeStyle = `rgba(0, 242, 254, ${totalAlpha * 0.7})`;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - crossSize, cy);
    this.ctx.lineTo(cx + crossSize, cy);
    this.ctx.moveTo(cx, cy - crossSize);
    this.ctx.lineTo(cx, cy + crossSize);
    this.ctx.stroke();

    if (node.subdivideProgress > 0) {
      const splitW = (w / 2) * node.subdivideProgress;
      const splitH = (h / 2) * node.subdivideProgress;
      this.ctx.strokeStyle = `rgba(0, 242, 254, ${totalAlpha * 0.85})`;
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.moveTo(cx - splitW, cy);
      this.ctx.lineTo(cx + splitW, cy);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy - splitH);
      this.ctx.lineTo(cx, cy + splitH);
      this.ctx.stroke();
    }

    if (totalAlpha > 0.15 && w > 80 && !this.isMobile) {
      this.ctx.font = '8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = `rgba(0, 242, 254, ${totalAlpha * 0.7})`;
      this.ctx.fillText(`AABB_${node.id} // D:${node.depth}`, x + 6, y + 12);
    }

    if (node.children && node.subdivideProgress > 0.4) {
      for (let i = 0; i < node.children.length; i++) {
        this.drawNode(node.children[i]);
      }
    }
  }
}

/* ==========================================================================
   4. MASTER BACKGROUND ORCHESTRATOR
   Randomly selects one of the 3 engines on launch, supports runtime switching.
   ========================================================================== */
class BackgroundCanvasOrchestrator {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.modes = [
      { id: 'netcode', name: 'Server-Authoritative Netcode Stream', Class: EliteNetcodePacketStreamCanvasEngine },
      { id: 'wireframe', name: 'Unreal Engine 5 3D Topo Wireframe', Class: UnrealTopoWireframeCanvasEngine },
      { id: 'octree', name: 'Dynamic Octree & Spatial AABB Partitioning', Class: DynamicOctreeAABBCanvasEngine }
    ];

    this.currentEngine = null;
    this.currentMode = null;

    this.init();
  }

  init() {
    // Check if device is mobile: completely disable background canvas animation to prevent visual distraction
    if (window.innerWidth <= 768) {
      if (this.canvas) {
        this.canvas.style.display = 'none';
      }
      // Listen for orientation change or desktop resizing
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && !this.currentEngine) {
          if (this.canvas) this.canvas.style.display = 'block';
          this.startSimulation();
        } else if (window.innerWidth <= 768 && this.currentEngine) {
          this.currentEngine.stop();
          this.currentEngine = null;
          if (this.canvas) this.canvas.style.display = 'none';
        }
      });
      return;
    }

    this.startSimulation();
  }

  startSimulation() {
    // Select randomly on page launch
    const randomIndex = Math.floor(Math.random() * this.modes.length);
    const chosen = this.modes[randomIndex];
    this.switchMode(chosen.id);

    // Expose runtime switcher for console / HUD controls
    window.switchBackgroundEffect = (modeId) => this.switchMode(modeId);
    window.nextBackgroundEffect = () => this.nextMode();
  }

  switchMode(modeId) {
    const target = this.modes.find(m => m.id === modeId) || this.modes[0];

    // Clean up current running engine
    if (this.currentEngine && typeof this.currentEngine.stop === 'function') {
      this.currentEngine.stop();
    }

    // Instantiate new engine
    this.currentMode = target;
    this.currentEngine = new target.Class(this.canvas);
    window.activeBackgroundEngine = this.currentEngine;
    window.activeBackgroundMode = target.id;

    console.log(`%c[HUD_SUBSYSTEM] Active Background Engine: ${target.name} (${target.id})`, 'color: #00f2fe; font-weight: bold;');
  }

  nextMode() {
    const currentIndex = this.modes.findIndex(m => m.id === this.currentMode.id);
    const nextIndex = (currentIndex + 1) % this.modes.length;
    this.switchMode(this.modes[nextIndex].id);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.bgOrchestrator = new BackgroundCanvasOrchestrator('bg-canvas');
});
