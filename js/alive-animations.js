/**
 * NEXUS ENTERPRISE ERP — "ALIVE" INTERACTION & ANIMATIONS ENGINE
 * Cursor Glow Aura, 3D Tilt Physics, Real-Time Heartbeat Event Ticker, Scroll Reveals, AI Token Streaming
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorAura();
  init3DTiltPhysics();
  initLiveHeartbeatTicker();
  initScrollReveal();
  initElectricConnectors();
});

/* 1. Dynamic Cursor Ambient Aura */
function initCursorAura() {
  const aura = document.createElement('div');
  aura.className = 'cursor-aura';
  document.body.appendChild(aura);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let auraX = mouseX;
  let auraY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateAura() {
    // Smooth trailing interpolation
    auraX += (mouseX - auraX) * 0.08;
    auraY += (mouseY - auraY) * 0.08;
    aura.style.left = `${auraX}px`;
    aura.style.top = `${auraY}px`;
    requestAnimationFrame(animateAura);
  }
  animateAura();
}

/* 2. Interactive 3D Perspective Card Tilt */
function init3DTiltPhysics() {
  const tiltCards = document.querySelectorAll('.glass-panel, .sandbox-card, .adr-card, .testimonial-card, .c4-service-node');

  tiltCards.forEach(card => {
    card.classList.add('tilt-card');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4.5;
      const rotateY = ((x - centerX) / centerX) * 4.5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

/* 3. Live Production Heartbeat & Real-Time Event Bus Simulator */
function initLiveHeartbeatTicker() {
  const liveFeedContainer = document.getElementById('cockpit-feed-content');
  const eventStreamContainer = document.getElementById('saga-event-stream');

  const simulatedEvents = [
    { entity: 'STOCK RESERVED', detail: 'Central Hub: SKU-8890 (80 units reserved in 4.2ms)', badge: 'RESERVED', type: 'info' },
    { entity: 'OUTBOX RELAY', detail: 'erp.inventory.stock.reserved.v1 acked by Kafka MSK', badge: 'ACK 200', type: 'success' },
    { entity: 'GAPLESS GL ENTRY', detail: 'JE-2026-000144 posted: Dr Cash / Cr AR ($18,400)', badge: 'IMMUTABLE', type: 'success' },
    { entity: '3-WAY MATCH', detail: 'PO-8832 vs GRN-449 matched with 0.0% variance', badge: 'TOUCHLESS', type: 'info' },
    { entity: 'RLS SESSION', detail: 'Active tenant UUID [a04e5781] session verified in 1.1ms', badge: 'ISOLATED', type: 'success' },
    { entity: 'FX REVALUATION', detail: 'Unrealized FX delta computed across 14 EUR accounts', badge: 'REVALUED', type: 'purple' },
    { entity: 'PAYROLL AUDIT', detail: 'Formula trace hash #7f8a9 verified against statutory rules', badge: 'VERIFIED', type: 'success' }
  ];

  let eventIndex = 0;

  setInterval(() => {
    const event = simulatedEvents[eventIndex % simulatedEvents.length];
    eventIndex++;

    // Add to hero cockpit live feed
    if (liveFeedContainer) {
      const newRow = document.createElement('div');
      newRow.className = 'feed-row';
      newRow.style.opacity = '0';
      newRow.style.transform = 'translateY(-10px)';
      newRow.style.transition = 'all 0.4s ease';
      newRow.innerHTML = `
        <div>
          <span class="feed-entity">${event.entity}</span>
          <div style="font-size: 0.82rem; color: var(--text-muted);">${event.detail}</div>
        </div>
        <span class="badge badge-${event.type}">${event.badge}</span>
      `;

      liveFeedContainer.prepend(newRow);
      setTimeout(() => {
        newRow.style.opacity = '1';
        newRow.style.transform = 'translateY(0)';
      }, 50);

      // Keep max 3 rows in hero feed
      if (liveFeedContainer.children.length > 3) {
        liveFeedContainer.lastElementChild.remove();
      }
    }

    // Add to saga outbox stream
    if (eventStreamContainer) {
      const streamRow = document.createElement('div');
      streamRow.className = 'event-stream-row';
      streamRow.style.opacity = '0';
      streamRow.style.transition = 'all 0.3s ease';
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      streamRow.innerHTML = `
        <span>[${timestamp}] ${event.entity}: ${event.detail}</span>
        <span class="badge badge-${event.type}" style="font-size: 0.7rem;">${event.badge}</span>
      `;
      eventStreamContainer.prepend(streamRow);
      setTimeout(() => {
        streamRow.style.opacity = '1';
      }, 50);

      if (eventStreamContainer.children.length > 6) {
        eventStreamContainer.lastElementChild.remove();
      }
    }
  }, 3200);
}

/* 4. Scroll-Triggered Staggered Entrance Animations */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(
    'section > .container > .section-header, .hero-metrics-bar, .hero-cockpit-wide, .persona-card-display, .modules-showcase-container, .c4-diagram-container, .saga-simulator-card, .comparison-table, .faq-accordion, .testimonial-card'
  );

  revealElements.forEach(el => el.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => observer.observe(el));
}

/* 5. Electric Animated Connectors */
function initElectricConnectors() {
  const serviceNodes = document.querySelectorAll('.c4-service-node');
  serviceNodes.forEach((node, idx) => {
    node.style.animationDelay = `${idx * 0.1}s`;
  });
}
