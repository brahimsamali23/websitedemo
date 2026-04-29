/* ═══════════════════════════════════════════════════════════════════
   FlyEX — Ava Support Chatbot
   Self-contained vanilla JS widget. No dependencies.
   Integrates with booking.html error system via window.flyex* globals.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────
  const BOT_NAME = 'Ava';
  const TYPING_DELAY_SHORT = 1000;
  const TYPING_DELAY_LONG  = 2000;

  const S = {
    IDLE:           'idle',
    GREETING:       'greeting',
    MENU:           'menu',
    ERROR_EXPLAIN:  'error_explain',
    ASK_REF:        'ask_ref',
    VERIFYING:      'verifying',
    OFFER_FIX:      'offer_fix',
    FIXING:         'fixing',
    RESOLVED:       'resolved',
    FAQ_HOURS:      'faq_hours',
    FAQ_INSURANCE:  'faq_insurance',
    FAQ_VISA:       'faq_visa',
    FAQ_GROUP:      'faq_group',
    FAQ_CANCEL:     'faq_cancel',
    FAQ_AMEND:      'faq_amend',
    HANDOFF:        'handoff',
    DONE:           'done',
  };

  // ── Error helpers ──────────────────────────────────────────────────
  function errorFieldLabel(m) {
    if (!m) return 'a booking detail';
    return { name: 'passenger name', date: 'departure date', pax: 'number of passengers', cabin: 'cabin class' }[m.type] || 'a booking detail';
  }

  function correctValue(m, bd) {
    if (!m || !bd) return '';
    const title = bd.title ? bd.title + ' ' : '';
    switch (m.type) {
      case 'name':  return title + bd.firstName + ' ' + bd.lastName;
      case 'date':  return bd.depart ? formatDateDisplay(bd.depart) : bd.depart;
      case 'pax':   return bd.pax + (bd.pax === '1' ? ' passenger' : ' passengers');
      case 'cabin': return bd.cabin;
      default:      return '';
    }
  }

  function formatDateDisplay(iso) {
    try {
      const d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (_) { return iso; }
  }

  // ── Styles ──────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('flyex-chatbot-styles')) return;
    const css = `
      /* ── Widget wrapper ── */
      #flyex-chat-widget {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 99999;
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
      }

      /* ── Toggle button ── */
      #flyex-chat-btn {
        width: 58px; height: 58px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1A7FE8 0%, #0F5DB5 100%);
        border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(26,127,232,0.45), 0 8px 32px rgba(0,0,0,0.3);
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
        position: relative;
      }
      #flyex-chat-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(26,127,232,0.55), 0 12px 40px rgba(0,0,0,0.35);
      }
      #flyex-chat-btn:active { transform: scale(0.97); }
      #flyex-chat-btn svg { transition: transform 0.3s ease, opacity 0.3s ease; }
      #flyex-chat-btn.open .flyex-icon-chat  { opacity: 0; transform: scale(0.5) rotate(90deg); }
      #flyex-chat-btn.open .flyex-icon-close { opacity: 1; transform: scale(1) rotate(0deg); }
      #flyex-chat-btn .flyex-icon-close { position: absolute; opacity: 0; transform: scale(0.5) rotate(-90deg); }

      /* Pulse ring when there's an error to flag */
      #flyex-chat-btn.has-error::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 2px solid rgba(255,140,0,0.7);
        animation: flyex-pulse-ring 1.8s ease-out infinite;
      }
      #flyex-chat-btn .flyex-badge {
        position: absolute;
        top: 0; right: 0;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: #FF8C00;
        border: 2px solid #060D1A;
        display: none;
      }
      #flyex-chat-btn.has-error .flyex-badge { display: block; }

      @keyframes flyex-pulse-ring {
        0%   { transform: scale(1);    opacity: 0.8; }
        100% { transform: scale(1.35); opacity: 0; }
      }

      /* ── Chat panel ── */
      #flyex-chat-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 370px;
        max-height: 540px;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #060D1A;
        border: 1px solid rgba(255,255,255,0.09);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.4);
        transform: scale(0.92) translateY(12px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
        transform-origin: bottom right;
      }
      #flyex-chat-panel.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      /* Header */
      #flyex-chat-header {
        background: linear-gradient(135deg, #0A1628 0%, #0F2040 100%);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        padding: 16px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .flyex-avatar {
        width: 38px; height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1A7FE8, #0F5DB5);
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
        position: relative;
      }
      .flyex-avatar::after {
        content: '';
        position: absolute;
        bottom: 1px; right: 1px;
        width: 9px; height: 9px;
        border-radius: 50%;
        background: #22C55E;
        border: 2px solid #0A1628;
      }
      .flyex-header-text { flex: 1; }
      .flyex-header-text .flyex-bot-name {
        font-weight: 700;
        color: #E8F0FF;
        font-size: 14px;
        line-height: 1.2;
      }
      .flyex-header-text .flyex-bot-status {
        font-size: 11px;
        color: rgba(232,240,255,0.45);
        margin-top: 1px;
      }
      .flyex-header-close {
        background: none; border: none; cursor: pointer;
        color: rgba(232,240,255,0.4);
        padding: 4px;
        border-radius: 6px;
        display: flex;
        transition: color 0.2s ease, background 0.2s ease;
      }
      .flyex-header-close:hover { color: #E8F0FF; background: rgba(255,255,255,0.06); }

      /* Messages area */
      #flyex-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
      }
      #flyex-messages::-webkit-scrollbar { width: 4px; }
      #flyex-messages::-webkit-scrollbar-track { background: transparent; }
      #flyex-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

      /* Message bubbles */
      .flyex-msg {
        display: flex;
        flex-direction: column;
        max-width: 88%;
        animation: flyex-msg-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes flyex-msg-in {
        from { opacity: 0; transform: translateY(8px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .flyex-msg.bot  { align-self: flex-start; align-items: flex-start; }
      .flyex-msg.user { align-self: flex-end;   align-items: flex-end; }

      .flyex-bubble {
        padding: 10px 13px;
        border-radius: 16px;
        line-height: 1.55;
        font-size: 13px;
      }
      .flyex-msg.bot  .flyex-bubble {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        color: #E8F0FF;
        border-bottom-left-radius: 4px;
      }
      .flyex-msg.user .flyex-bubble {
        background: linear-gradient(135deg, #1A7FE8, #0F5DB5);
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      /* Success bubble */
      .flyex-bubble.success {
        background: rgba(34,197,94,0.12);
        border-color: rgba(34,197,94,0.25);
        color: #86EFAC;
      }

      /* Timestamp */
      .flyex-msg-time {
        font-size: 10px;
        color: rgba(232,240,255,0.25);
        margin-top: 3px;
        padding: 0 4px;
      }

      /* Typing indicator */
      .flyex-typing .flyex-bubble {
        padding: 12px 16px;
      }
      .flyex-typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
        height: 14px;
      }
      .flyex-typing-dots span {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: rgba(232,240,255,0.4);
        animation: flyex-dot-bounce 1.2s ease-in-out infinite;
      }
      .flyex-typing-dots span:nth-child(2) { animation-delay: 0.18s; }
      .flyex-typing-dots span:nth-child(3) { animation-delay: 0.36s; }
      @keyframes flyex-dot-bounce {
        0%,80%,100% { transform: translateY(0); }
        40%          { transform: translateY(-5px); }
      }

      /* Quick replies */
      .flyex-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 4px 0 2px;
        animation: flyex-msg-in 0.35s 0.1s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .flyex-reply-btn {
        background: rgba(26,127,232,0.1);
        border: 1px solid rgba(26,127,232,0.35);
        color: #3B9BFF;
        font-size: 12px;
        font-family: inherit;
        padding: 6px 12px;
        border-radius: 20px;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        white-space: nowrap;
      }
      .flyex-reply-btn:hover {
        background: rgba(26,127,232,0.2);
        border-color: rgba(26,127,232,0.6);
        transform: translateY(-1px);
      }
      .flyex-reply-btn:active { transform: translateY(0); }

      /* Input area */
      #flyex-input-row {
        flex-shrink: 0;
        display: flex;
        gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid rgba(255,255,255,0.07);
        background: rgba(6,13,26,0.8);
      }
      #flyex-input {
        flex: 1;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 9px 14px;
        color: #E8F0FF;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      #flyex-input:focus {
        border-color: rgba(26,127,232,0.5);
        background: rgba(255,255,255,0.08);
      }
      #flyex-input::placeholder { color: rgba(232,240,255,0.3); }
      #flyex-send-btn {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1A7FE8, #0F5DB5);
        border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
        align-self: center;
      }
      #flyex-send-btn:hover  { transform: scale(1.1); }
      #flyex-send-btn:active { transform: scale(0.95); }
      #flyex-send-btn:disabled { opacity: 0.4; cursor: default; transform: none; }

      /* Resolved banner on confirmation page */
      #flyex-resolved-banner {
        display: none;
        background: rgba(34,197,94,0.10);
        border: 1px solid rgba(34,197,94,0.25);
        border-radius: 14px;
        padding: 14px 18px;
        margin-bottom: 20px;
        align-items: flex-start;
        gap: 12px;
      }
      #flyex-resolved-banner.show {
        display: flex;
        animation: flyex-msg-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      #flyex-resolved-banner .res-icon {
        width: 22px; height: 22px;
        border-radius: 50%;
        background: rgba(34,197,94,0.2);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        font-size: 12px;
        margin-top: 1px;
      }
      #flyex-resolved-banner .res-text .res-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #86EFAC;
        margin-bottom: 2px;
      }
      #flyex-resolved-banner .res-text .res-body {
        font-size: 0.75rem;
        color: rgba(134,239,172,0.75);
        line-height: 1.55;
      }

      @media (max-width: 420px) {
        #flyex-chat-panel { width: calc(100vw - 32px); right: 0; }
        #flyex-chat-widget { right: 16px; bottom: 16px; }
      }
    `;
    const el = document.createElement('style');
    el.id = 'flyex-chatbot-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ── DOM builder ─────────────────────────────────────────────────────
  function buildWidget() {
    const wrap = document.createElement('div');
    wrap.id = 'flyex-chat-widget';
    wrap.innerHTML = `
      <!-- Panel -->
      <div id="flyex-chat-panel" role="dialog" aria-label="FlyEX Support Chat">
        <div id="flyex-chat-header">
          <div class="flyex-avatar">✈</div>
          <div class="flyex-header-text">
            <div class="flyex-bot-name">${BOT_NAME} · FlyEX Support</div>
            <div class="flyex-bot-status">Online · Typically replies instantly</div>
          </div>
          <button class="flyex-header-close" id="flyex-close-btn" aria-label="Close chat">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div id="flyex-messages"></div>
        <div id="flyex-input-row">
          <input id="flyex-input" type="text" placeholder="Type a message…" autocomplete="off" />
          <button id="flyex-send-btn" aria-label="Send">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Toggle button -->
      <button id="flyex-chat-btn" aria-label="Open support chat">
        <span class="flyex-badge"></span>
        <!-- Chat icon -->
        <svg class="flyex-icon-chat" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="8" cy="10" r="1" fill="white"/><circle cx="12" cy="10" r="1" fill="white"/><circle cx="16" cy="10" r="1" fill="white"/>
        </svg>
        <!-- Close icon -->
        <svg class="flyex-icon-close" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
    document.body.appendChild(wrap);

    // Inject resolved banner into confirmation page if it exists
    const errorCard = document.getElementById('error-card');
    if (errorCard) {
      const banner = document.createElement('div');
      banner.id = 'flyex-resolved-banner';
      banner.innerHTML = `
        <div class="res-icon">✓</div>
        <div class="res-text">
          <div class="res-title">Booking corrected by support</div>
          <div class="res-body" id="flyex-resolved-msg">Your booking details have been updated to reflect the correct information.</div>
        </div>
      `;
      errorCard.parentNode.insertBefore(banner, errorCard);
    }
  }

  // ── Chatbot controller ───────────────────────────────────────────────
  class FlyEXBot {
    constructor() {
      this.state    = S.IDLE;
      this.isOpen   = false;
      this.typing   = false;
      this.autoOpened = false;
      this.inputLocked = false;

      this.btn    = document.getElementById('flyex-chat-btn');
      this.panel  = document.getElementById('flyex-chat-panel');
      this.msgs   = document.getElementById('flyex-messages');
      this.input  = document.getElementById('flyex-input');
      this.send   = document.getElementById('flyex-send-btn');
      this.closeBtn = document.getElementById('flyex-close-btn');

      this.bindEvents();
      this.watchConfirmation();
    }

    // ── Events ──────────────────────────────────────────────────────
    bindEvents() {
      this.btn.addEventListener('click', () => this.toggle());
      this.closeBtn.addEventListener('click', () => this.close());
      this.send.addEventListener('click', () => this.submitInput());
      this.input.addEventListener('keydown', e => { if (e.key === 'Enter') this.submitInput(); });
    }

    toggle() { this.isOpen ? this.close() : this.open(); }

    open() {
      this.isOpen = true;
      this.panel.classList.add('open');
      this.btn.classList.add('open');
      this.input.focus();
      if (this.state === S.IDLE) this.startConversation();
    }

    close() {
      this.isOpen = false;
      this.panel.classList.remove('open');
      this.btn.classList.remove('open');
    }

    // ── Auto-open on confirmation page ───────────────────────────────
    watchConfirmation() {
      const check = () => {
        const page5 = document.getElementById('page-5');
        const hasMistake = !!window.flyexCurrentMistake;
        if (page5 && page5.classList.contains('active') && hasMistake && !this.autoOpened) {
          this.autoOpened = true;
          this.btn.classList.add('has-error');
        }
      };

      new MutationObserver(check).observe(document.body, {
        subtree: true, attributes: true, attributeFilter: ['class']
      });
      check();
    }

    // ── Message rendering ────────────────────────────────────────────
    addBotMsg(text, opts = {}) {
      const div = document.createElement('div');
      div.className = 'flyex-msg bot';
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `
        <div class="flyex-bubble${opts.success ? ' success' : ''}">${text}</div>
        <span class="flyex-msg-time">${BOT_NAME} · ${now}</span>
      `;
      this.msgs.appendChild(div);
      this.scrollDown();
    }

    addUserMsg(text) {
      const div = document.createElement('div');
      div.className = 'flyex-msg user';
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `
        <div class="flyex-bubble">${text}</div>
        <span class="flyex-msg-time">You · ${now}</span>
      `;
      this.msgs.appendChild(div);
      this.scrollDown();
    }

    showTyping() {
      const div = document.createElement('div');
      div.className = 'flyex-msg bot flyex-typing';
      div.id = 'flyex-typing-indicator';
      div.innerHTML = `<div class="flyex-bubble"><div class="flyex-typing-dots"><span></span><span></span><span></span></div></div>`;
      this.msgs.appendChild(div);
      this.scrollDown();
      this.input.disabled = true;
      this.send.disabled  = true;
    }

    hideTyping() {
      const t = document.getElementById('flyex-typing-indicator');
      if (t) t.remove();
      this.input.disabled = false;
      this.send.disabled  = false;
    }

    showReplies(options) {
      // Remove any existing reply rows
      this.clearReplies();
      const row = document.createElement('div');
      row.className = 'flyex-replies';
      row.id = 'flyex-reply-row';
      options.forEach(({ label, action }) => {
        const btn = document.createElement('button');
        btn.className = 'flyex-reply-btn';
        btn.textContent = label;
        btn.addEventListener('click', () => {
          this.clearReplies();
          this.addUserMsg(label);
          action();
        });
        row.appendChild(btn);
      });
      this.msgs.appendChild(row);
      this.scrollDown();
    }

    clearReplies() {
      const r = document.getElementById('flyex-reply-row');
      if (r) r.remove();
    }

    scrollDown() {
      setTimeout(() => { this.msgs.scrollTop = this.msgs.scrollHeight; }, 50);
    }

    // ── Typing then speak ────────────────────────────────────────────
    botSay(text, delay = TYPING_DELAY_SHORT, opts = {}) {
      return new Promise(resolve => {
        this.showTyping();
        setTimeout(() => {
          this.hideTyping();
          this.addBotMsg(text, opts);
          resolve();
        }, delay);
      });
    }

    // ── Input handling ───────────────────────────────────────────────
    submitInput() {
      if (this.inputLocked) return;
      const val = this.input.value.trim();
      if (!val) return;
      this.input.value = '';
      this.clearReplies();
      this.addUserMsg(val);
      this.handleUserInput(val);
    }

    handleUserInput(text) {
      const t = text.toLowerCase();

      // State-specific handlers
      if (this.state === S.ASK_REF) {
        this.state = S.VERIFYING;
        this.runVerification();
        return;
      }

      // Keyword routing from any state
      if (/agent|human|person|call|phone|speak/.test(t)) { this.goHandoff(); return; }
      if (/hour|open|time|schedule|when/.test(t))        { this.goFAQ('hours'); return; }
      if (/insur/.test(t))                               { this.goFAQ('insurance'); return; }
      if (/visa|passport/.test(t))                       { this.goFAQ('visa'); return; }
      if (/group|corporate|company/.test(t))             { this.goFAQ('group'); return; }
      if (/cancel|refund/.test(t))                       { this.goFAQ('cancel'); return; }
      if (/amend|change|modify|update|correct|fix|wrong|error|mistake/.test(t)) {
        this.goErrorHelp(); return;
      }
      if (/thank|thanks|great|perfect|done|good|bye|bye/.test(t)) {
        this.botSay("You're very welcome! Safe travels ✈ — don't hesitate to reach out if you need anything else. Have a wonderful trip!");
        this.state = S.DONE;
        return;
      }

      // Fallback
      this.botSay("I want to make sure I help you correctly! Could you tell me a bit more, or pick one of the options below?")
        .then(() => this.showMainMenu());
    }

    // ── Conversation flows ───────────────────────────────────────────
    startConversation() {
      this.state = S.GREETING;
      const hasMistake = !!window.flyexCurrentMistake;

      if (hasMistake) {
        // On confirmation page with an error → proactive error flow
        this.botSay(
          `Hi there! I'm ${BOT_NAME}, your FlyEX support assistant. 👋<br><br>I can see your booking confirmation is showing a discrepancy in your <strong>${errorFieldLabel(window.flyexCurrentMistake)}</strong>. I'm here to get this sorted out for you right away.`,
          TYPING_DELAY_LONG
        ).then(() => {
          this.state = S.MENU;
          this.showReplies([
            { label: 'Yes, please fix my booking', action: () => this.goErrorHelp() },
            { label: 'What\'s wrong exactly?',     action: () => this.explainError() },
            { label: 'Talk to an agent',           action: () => this.goHandoff() },
          ]);
        });
      } else {
        // General greeting
        this.botSay(
          `Hi there! I'm ${BOT_NAME}, your FlyEX support assistant. ✈<br><br>How can I help you today?`,
          TYPING_DELAY_SHORT
        ).then(() => {
          this.state = S.MENU;
          this.showMainMenu();
        });
      }
    }

    showMainMenu() {
      this.showReplies([
        { label: 'Booking error help',   action: () => this.goErrorHelp() },
        { label: 'Amend my booking',     action: () => this.goFAQ('amend') },
        { label: 'Visa & passport',      action: () => this.goFAQ('visa') },
        { label: 'Travel insurance',     action: () => this.goFAQ('insurance') },
        { label: 'Opening hours',        action: () => this.goFAQ('hours') },
        { label: 'Talk to an agent',     action: () => this.goHandoff() },
      ]);
    }

    explainError() {
      const m = window.flyexCurrentMistake;
      let explanation = '';
      if (!m) {
        explanation = "It looks like one of your booking details may not match what you entered. This can happen due to a data entry issue during confirmation.";
      } else {
        switch (m.type) {
          case 'name':
            explanation = `Your passenger name has been recorded with a slight spelling error — it doesn't exactly match the name on your passport. This is important to correct before check-in, as airlines require your name to match your travel documents exactly.`;
            break;
          case 'date':
            explanation = `Your departure date on the confirmation doesn't match the date you selected during booking. Even a single day's difference can result in a missed flight, so this needs to be corrected immediately.`;
            break;
          case 'pax':
            explanation = `The number of passengers recorded in your booking is one more than what you selected. This could result in unnecessary seat reservations and billing discrepancies.`;
            break;
          case 'cabin':
            explanation = `The cabin class on your confirmation doesn't match what you selected during booking. This can affect your seating, baggage allowance, and in-flight services.`;
            break;
        }
      }
      this.state = S.ERROR_EXPLAIN;
      this.botSay(explanation, TYPING_DELAY_LONG)
        .then(() => {
          this.showReplies([
            { label: 'Fix it now, please', action: () => this.goErrorHelp() },
            { label: 'Talk to an agent',   action: () => this.goHandoff() },
          ]);
        });
    }

    goErrorHelp() {
      this.state = S.ASK_REF;
      this.botSay(
        `No problem at all — I can get this corrected for you right now. 😊<br><br>To verify your booking, could you please confirm your <strong>booking reference</strong>? You'll find it at the top of your confirmation page.`,
        TYPING_DELAY_SHORT
      ).then(() => {
        this.inputLocked = false;
        this.input.placeholder = 'Enter your booking reference…';
        this.input.focus();
        this.showReplies([
          { label: 'I can see it above ✓', action: () => { this.clearReplies(); this.addUserMsg('I can see it above ✓'); this.state = S.VERIFYING; this.runVerification(); } },
        ]);
      });
    }

    runVerification() {
      this.inputLocked = true;
      this.input.placeholder = 'Type a message…';
      this.botSay('Thank you! Let me pull up your booking now…', TYPING_DELAY_SHORT)
        .then(() => this.botSay('I\'ve located your booking. Analysing the confirmation details…', TYPING_DELAY_LONG))
        .then(() => {
          const m = window.flyexCurrentMistake;
          const label = errorFieldLabel(m);
          this.state = S.OFFER_FIX;
          this.botSay(
            `I can confirm the issue: there is an error in the <strong>${label}</strong> recorded on your confirmation. I have everything I need to apply the correction.<br><br>Would you like me to go ahead and update your booking now?`,
            TYPING_DELAY_SHORT
          ).then(() => {
            this.showReplies([
              { label: 'Yes, please update it', action: () => this.applyFix() },
              { label: 'No, I\'ll contact an agent', action: () => this.goHandoff() },
            ]);
          });
        });
    }

    applyFix() {
      this.state = S.FIXING;
      this.botSay('Applying the correction to your booking now…', TYPING_DELAY_SHORT)
        .then(() => {
          // ── Actually fix the DOM ──
          const fixed = this.fixBookingDisplay();
          const label = errorFieldLabel(window.flyexCurrentMistake);
          const correct = window.flyexCurrentMistake ? correctValue(window.flyexCurrentMistake, window.flyexBookingData) : '';

          return this.botSay(
            `✓ Done! Your <strong>${label}</strong> has been successfully corrected${correct ? ` to <strong>${correct}</strong>` : ''}.<br><br>Your booking now accurately reflects the details you provided. You should see the updated confirmation above.`,
            TYPING_DELAY_LONG,
            { success: true }
          ).then(() => {
            this.state = S.RESOLVED;
            this.btn.classList.remove('has-error');
            window.flyexCurrentMistake = null; // clear so it won't re-trigger
            this.showReplies([
              { label: 'Great, thanks! 🙌',   action: () => this.wrapUp() },
              { label: 'Ask another question', action: () => { this.botSay('Of course! What else can I help with?', TYPING_DELAY_SHORT).then(() => this.showMainMenu()); } },
            ]);
          });
        });
    }

    fixBookingDisplay() {
      const m   = window.flyexCurrentMistake;
      const bd  = window.flyexBookingData;
      if (!m || !bd) return;

      const correct = correctValue(m, bd);

      // Update the field and remove error styling
      const fieldMap = { name: 'cf-name', date: 'cf-depart', pax: 'cf-pax', cabin: 'cf-cabin' };
      const el = document.getElementById(fieldMap[m.type]);
      if (el) {
        el.textContent = correct;
        el.classList.remove('error');
        // Brief green flash
        el.style.color = '#86EFAC';
        el.style.transition = 'color 1.5s ease';
        setTimeout(() => { el.style.color = ''; }, 2500);
      }

      // Hide the amber error warning card
      const errorCard = document.getElementById('error-card');
      if (errorCard) {
        errorCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        errorCard.style.opacity = '0';
        errorCard.style.transform = 'translateY(-6px)';
        setTimeout(() => { errorCard.style.display = 'none'; }, 500);
      }

      // Show the green resolved banner
      const banner = document.getElementById('flyex-resolved-banner');
      const bannerMsg = document.getElementById('flyex-resolved-msg');
      if (banner) {
        if (bannerMsg) {
          bannerMsg.textContent = `Your ${errorFieldLabel(m)} has been corrected to "${correct}". This update was applied by Ava, your FlyEX support assistant.`;
        }
        setTimeout(() => { banner.classList.add('show'); }, 600);
      }
    }

    wrapUp() {
      this.botSay(
        `You're all set! 🎉 Your booking is now accurate and ready for your trip. If you ever need us again, we're right here. Safe travels! ✈`,
        TYPING_DELAY_SHORT
      );
    }

    goHandoff() {
      this.state = S.HANDOFF;
      this.botSay(
        `Of course! Here's how to reach a FlyEX advisor directly:<br><br>
        📞 <strong>+1 (800) 359-3993</strong> — available 24/7 for urgent travel issues<br>
        📧 <strong>support@flyex.com</strong> — we reply within one business day<br><br>
        Our office hours are <strong>Monday – Friday, 9:00 AM – 5:00 PM</strong>. Have your booking reference ready when you call.`,
        TYPING_DELAY_SHORT
      ).then(() => {
        this.showReplies([
          { label: 'Go back to menu', action: () => { this.botSay('Of course! What can I help you with?', TYPING_DELAY_SHORT).then(() => { this.state = S.MENU; this.showMainMenu(); }); } },
        ]);
      });
    }

    // ── FAQ flows ───────────────────────────────────────────────────
    goFAQ(topic) {
      const faqs = {
        hours:     `Our advisors are available <strong>Monday to Friday, 9:00 AM – 5:00 PM</strong>.<br><br>For travellers already mid-journey facing urgent situations, our <strong>24/7 emergency line</strong> is available at <strong>+1 (800) 359-3993</strong>.`,
        insurance: `Yes! FlyEX partners with leading insurers to offer comprehensive cover including:<br><br>• Trip cancellation & curtailment<br>• Medical & emergency evacuation<br>• Baggage loss & delay<br>• Flight disruption cover<br><br>Insurance can be added to any booking. Contact an advisor to arrange cover.`,
        visa:      `Absolutely. We provide guidance on visa requirements for all nationalities across our 180+ destinations.<br><br>We advise on required documents, processing times, and application procedures. We recommend starting the process <strong>at least 8 weeks before departure</strong>.<br><br>Contact your advisor at support@flyex.com for destination-specific guidance.`,
        group:     `Yes! Our dedicated Corporate & Groups desk handles parties of 10 or more, offering:<br><br>• Customised itineraries<br>• Negotiated group fares<br>• Consolidated billing<br>• Dedicated account manager<br><br>Contact us at support@flyex.com for a tailored group quote.`,
        cancel:    `Cancellation policies depend on the fare type and airline booked.<br><br>• <strong>Non-refundable fares:</strong> Not reimbursed, but we'll try to rebook or issue a credit<br>• <strong>Refundable fares:</strong> Processed within 7–14 business days<br><br>Travel insurance can cover many cancellation scenarios — we always recommend purchasing a policy at booking.`,
        amend:     `To amend your booking, contact us with your booking reference:<br><br>📧 <strong>support@flyex.com</strong><br>📞 <strong>+1 (800) 359-3993</strong><br><br>Please note that amendments may be subject to airline change fees, which your advisor will communicate before any changes are made.`,
      };
      const answer = faqs[topic];
      if (answer) {
        this.botSay(answer, TYPING_DELAY_SHORT).then(() => {
          this.showReplies([
            { label: 'That helped, thanks!', action: () => this.wrapUp() },
            { label: 'Ask something else',   action: () => { this.botSay('Of course! What else can I help with?', TYPING_DELAY_SHORT).then(() => { this.state = S.MENU; this.showMainMenu(); }); } },
            { label: 'Talk to an agent',     action: () => this.goHandoff() },
          ]);
        });
      }
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────────
  function boot() {
    injectStyles();
    buildWidget();
    new FlyEXBot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
