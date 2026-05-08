import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/widget.js", (_req, res): void => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const script = `
(function() {
  'use strict';
  var config = document.currentScript || (function() {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var apiKey = config.getAttribute('data-widget-key');
  if (!apiKey) { console.warn('[SimpleChat] Missing data-widget-key'); return; }

  var explicitApiUrl = config.getAttribute('data-api-url');
  var apiBase;
  if (explicitApiUrl) {
    apiBase = explicitApiUrl.replace(/\\/$/, '');
  } else if (config.src) {
    apiBase = config.src.replace('/api/widget.js', '/api');
  } else {
    console.warn('[SimpleChat] Could not determine API URL.');
    return;
  }

  fetch(apiBase + '/widget/config?key=' + encodeURIComponent(apiKey) + '&_=' + Date.now(), { cache: 'no-store' })
    .then(function(r) { return r.ok ? r.json() : {}; })
    .catch(function() { return {}; })
    .then(function(cfg) {
      try { init(cfg); } catch(e) { console.error('[SimpleChat] init error:', e); }
    });

  function init(cfg) {
    var accentRaw  = cfg.color     || '#1a56db';
    var agentName  = cfg.agentName || 'Support';
    var greeting   = cfg.greeting  || 'Hi there! How can we help you today?';
    var posAttr    = cfg.position  || 'right';
    var isLeft     = posAttr === 'left';
    var lang       = cfg.lang      || 'en';
    var logoUrl    = cfg.logoUrl   || '';
    var iconStyle  = cfg.iconStyle || 'chat';

    var T = {
      en: {
        hello: 'Hello from', yourConversations: 'Your Conversations',
        startBtn: 'Start a Conversation', repliesIn: 'Typically replies in minutes',
        online: 'Online', tabHome: 'Home', tabMessages: 'Messages', tabHelp: 'Help',
        tapToContinue: 'Continue your conversation', startNew: 'Start a new conversation',
        nameLabel: 'Your name', namePlaceholder: 'Maria Santos',
        phoneLabel: 'Phone number', phonePlaceholder: '+351 912 345 678',
        msgLabel: 'Message', msgPlaceholder: 'How can we help?',
        sendBtn: 'Send message',
      },
      pt: {
        hello: 'Olá de', yourConversations: 'As suas conversas',
        startBtn: 'Iniciar conversa', repliesIn: 'Normalmente responde em minutos',
        online: 'Online', tabHome: 'Início', tabMessages: 'Mensagens', tabHelp: 'Ajuda',
        tapToContinue: 'Continuar a conversa', startNew: 'Nova conversa',
        nameLabel: 'O seu nome', namePlaceholder: 'Maria Santos',
        phoneLabel: 'Número de telefone', phonePlaceholder: '+351 912 345 678',
        msgLabel: 'Mensagem', msgPlaceholder: 'Como podemos ajudar?',
        sendBtn: 'Enviar mensagem',
      },
    };
    var t = T[lang] || T['en'];

    function hexToRgb(h) {
      var r = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(h);
      return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : { r:26,g:86,b:219 };
    }
    function darken(h, amt) {
      var c = hexToRgb(h);
      return 'rgb('+Math.max(0,c.r-amt)+','+Math.max(0,c.g-amt)+','+Math.max(0,c.b-amt)+')';
    }
    function isLight(h) {
      var c = hexToRgb(h);
      return (0.299*c.r + 0.587*c.g + 0.114*c.b)/255 > 0.55;
    }

    var accent     = accentRaw;
    var accentDark = darken(accentRaw, 30);
    var rgb        = hexToRgb(accentRaw);
    var accentRgb  = rgb.r+','+rgb.g+','+rgb.b;
    var light      = isLight(accentRaw);
    var ink        = light ? '#1a1a1a' : '#ffffff';
    var inkSub     = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.78)';
    var overlay    = light ? 'rgba(0,0,0,0.1)'  : 'rgba(255,255,255,0.18)';
    var overlayHov = light ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.28)';

    // ── Styles ───────────────────────────────────────────────────────────
    var css = \`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      #sc-wrap, #sc-wrap * {
        box-sizing:border-box !important;
        font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif !important;
        line-height:normal !important;
      }
      #sc-wrap input, #sc-wrap textarea, #sc-wrap button, #sc-wrap a {
        font-size:inherit; color:inherit; background:none; border:none;
        padding:0; margin:0; outline:none; text-decoration:none;
        -webkit-appearance:none; appearance:none;
      }

      /* Bubble wrapper — carries the fixed position so the badge can sit outside the clipped button */
      #sc-bubble-wrap {
        position:fixed !important; bottom:24px !important; \${isLeft?'left':'right'}:24px !important; z-index:2147483646 !important;
        width:56px !important; height:56px !important;
        pointer-events:none !important;
      }
      /* Bubble */
      #sc-bubble {
        position:relative !important;
        width:56px !important; height:56px !important; min-width:0 !important; max-width:none !important;
        min-height:0 !important; max-height:none !important;
        border-radius:50% !important; padding:0 !important; margin:0 !important;
        box-sizing:border-box !important; line-height:1 !important; overflow:hidden !important;
        background:linear-gradient(135deg,\${accent},\${accentDark}) !important;
        border:none !important; cursor:pointer !important; display:flex !important;
        align-items:center !important; justify-content:center !important;
        box-shadow:0 4px 20px rgba(\${accentRgb},.45),0 2px 6px rgba(0,0,0,.15) !important;
        transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease !important; outline:none !important;
        pointer-events:all !important;
      }
      #sc-bubble:hover { transform:scale(1.08); box-shadow:0 6px 24px rgba(\${accentRgb},.55),0 2px 8px rgba(0,0,0,.18); }
      #sc-bubble:active { transform:scale(.96); }
      #sc-wrap .material-symbols-outlined {
        font-family:'Material Symbols Outlined'!important; font-weight:normal !important; font-style:normal !important;
        font-size:31px !important; line-height:1 !important; display:inline-block !important;
        white-space:nowrap !important; direction:ltr !important; letter-spacing:normal !important;
        text-transform:none !important; -webkit-font-smoothing:antialiased;
        font-feature-settings:'liga' !important; -webkit-font-feature-settings:'liga' !important;
        font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 32 !important;
      }
      .fv-chat-icon { color:white; transition:opacity .15s,transform .15s; }
      #sc-bubble .sc-ico-close {
        opacity:0; transform:scale(.6) rotate(-45deg); position:absolute;
        display:flex; align-items:center; justify-content:center;
        transition:opacity .15s,transform .15s;
      }
      #sc-bubble.open .fv-chat-icon { opacity:0; transform:scale(.6) rotate(45deg); }
      #sc-bubble.open .sc-ico-close { opacity:1; transform:scale(1) rotate(0deg); }
      #sc-bubble .sc-ico-close svg { width:22px; height:22px; stroke:white; fill:none; stroke-width:2.5; stroke-linecap:round; }

      /* Badge — sibling of bubble button, positioned relative to the wrapper */
      #sc-badge {
        position:absolute; top:-3px; right:-3px;
        min-width:20px; height:20px; border-radius:10px; padding:0 5px;
        background:#ef4444; border:2px solid white;
        display:none; align-items:center; justify-content:center;
        font-size:10px; font-weight:700; color:white;
        pointer-events:none; z-index:1;
      }

      /* Panel */
      #sc-panel {
        position:fixed; bottom:92px; \${isLeft?'left':'right'}:24px; z-index:2147483645;
        width:360px; height:580px; border-radius:24px;
        background:\${accent}; overflow:hidden;
        box-shadow:0 16px 56px rgba(0,0,0,.22),0 2px 10px rgba(0,0,0,.1);
        display:flex; flex-direction:column;
        transform:scale(.9) translateY(20px); opacity:0; pointer-events:none;
        transition:transform .28s cubic-bezier(.34,1.3,.64,1),opacity .2s ease;
        transform-origin:\${isLeft?'bottom left':'bottom right'};
      }
      #sc-panel.open { transform:scale(1) translateY(0); opacity:1; pointer-events:all; }
      #sc-panel.sc-chat-mode { background:#f8f9fa; }

      /* Drag handle */
      #sc-handle { width:36px; height:4px; border-radius:2px; background:\${overlay}; margin:10px auto 0; flex-shrink:0; }

      /* Top bar (home) */
      #sc-topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; flex-shrink:0; }
      .sc-top-logo {
        width:44px; height:44px; border-radius:14px; background:\${overlay};
        display:flex; align-items:center; justify-content:center;
        font-size:15px; font-weight:700; color:\${ink}; overflow:hidden; flex-shrink:0;
      }
      .sc-top-logo img { width:100%; height:100%; object-fit:cover; display:block; }

      /* Generic close / back buttons */
      .sc-icon-btn {
        width:32px !important; height:32px !important; min-width:0 !important; max-width:none !important;
        min-height:0 !important; max-height:none !important;
        border-radius:50% !important; border:none !important; cursor:pointer !important;
        padding:0 !important; margin:0 !important; box-sizing:border-box !important; line-height:1 !important;
        background:\${overlay} !important; display:flex !important; align-items:center !important; justify-content:center !important;
        color:\${ink} !important; transition:background .15s !important;
      }
      .sc-icon-btn:hover { background:\${overlayHov}; }
      .sc-icon-btn svg { width:15px; height:15px; stroke:\${ink}; fill:none; stroke-width:2.5; stroke-linecap:round; }

      /* Hero */
      #sc-hero { padding:6px 20px 24px; flex-shrink:0; }
      #sc-hero h2 { font-size:26px; font-weight:700; color:\${ink}; line-height:1.2; margin:0 0 10px; letter-spacing:-.4px; }
      #sc-hero p  { font-size:14px; color:\${inkSub}; line-height:1.55; margin:0; }

      /* Cards scrollable area */
      #sc-cards { flex:1; overflow-y:auto; padding:0 12px 12px; }
      #sc-cards::-webkit-scrollbar { width:0; }

      /* Card */
      .sc-card { background:white; border-radius:16px; overflow:hidden; margin-bottom:10px; box-shadow:0 2px 16px rgba(0,0,0,.1); }
      .sc-card-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; }
      .sc-card-title  { font-size:13px; font-weight:600; color:#374151; }

      /* Avatar stack */
      .sc-av-stack { display:flex; }
      .sc-mini-av {
        width:34px; height:34px; border-radius:50%; border:2px solid white;
        display:flex; align-items:center; justify-content:center;
        font-size:11px; font-weight:700;
      }
      .sc-mini-av+.sc-mini-av { margin-left:-10px; }
      .sc-mini-av-a { background:linear-gradient(135deg,\${accent},\${accentDark}); color:white; }
      .sc-mini-av-v { background:#e0f2fe; color:#0369a1; font-size:16px; }

      /* Start button */
      .sc-start-card-btn {
        display:flex !important; align-items:center !important; justify-content:center !important; gap:8px !important;
        width:calc(100% - 32px) !important; max-width:calc(100% - 32px) !important;
        margin:0 16px 14px !important; padding:12px !important;
        border-radius:12px !important; border:none !important;
        background:linear-gradient(135deg,\${accent},\${accentDark}) !important;
        color:white !important; font-size:13px !important; font-weight:600 !important; cursor:pointer !important;
        box-shadow:0 2px 10px rgba(\${accentRgb},.35) !important;
        transition:opacity .15s,transform .1s !important;
      }
      .sc-start-card-btn:hover { opacity:.92; }
      .sc-start-card-btn:active { transform:scale(.98); }
      .sc-start-card-btn svg { width:14px; height:14px; fill:white; flex-shrink:0; }

      /* Tab bar */
      #sc-tabs { display:flex; background:white; flex-shrink:0; border-top:1px solid #f0f0f0; padding:8px 0 10px; }
      .sc-tab {
        flex:1; display:flex; flex-direction:column; align-items:center; gap:3px;
        padding:4px 0; border:none; background:none; cursor:pointer;
        font-size:10px; font-weight:500; color:#9ca3af; transition:color .15s;
      }
      .sc-tab.active { color:\${accent}; }
      .sc-tab svg { width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }

      /* Chat header */
      #sc-chat-hdr {
        display:flex; align-items:center; gap:10px; padding:12px 14px;
        background:white; border-bottom:1px solid #f3f4f6; flex-shrink:0;
      }
      .sc-chat-av {
        width:36px; height:36px; border-radius:50%; flex-shrink:0;
        background:linear-gradient(135deg,\${accent},\${accentDark});
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; color:white; overflow:hidden;
      }
      .sc-chat-av img { width:100%; height:100%; object-fit:cover; display:block; }
      .sc-chat-name   { font-size:14px; font-weight:600; color:#111827; }
      .sc-chat-status { font-size:11px; color:#6b7280; display:flex; align-items:center; gap:4px; margin-top:1px; }
      .sc-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; flex-shrink:0; }
      #sc-chat-hdr .sc-ml { margin-left:auto; }
      #sc-panel.sc-chat-mode .sc-icon-btn { background:#f3f4f6; }
      #sc-panel.sc-chat-mode .sc-icon-btn:hover { background:#e5e7eb; }
      #sc-panel.sc-chat-mode .sc-icon-btn svg { stroke:#374151; }

      /* Form */
      #sc-form-wrap { flex:1; overflow-y:auto; padding:16px; background:white; }
      .sc-field { display:flex; flex-direction:column; gap:4px; margin-bottom:9px; }
      .sc-field label { font-size:11px; font-weight:600; color:#374151; letter-spacing:.3px; text-transform:uppercase; }
      .sc-field input, .sc-field textarea {
        border:1.5px solid #e5e7eb; border-radius:9px; padding:9px 12px;
        font-size:13px; color:#111827; background:#f9fafb; outline:none; width:100%; resize:none;
        transition:border-color .15s,background .15s;
      }
      .sc-field input:focus, .sc-field textarea:focus { border-color:\${accent}; background:white; }
      .sc-field textarea { height:72px; }
      .sc-field input::placeholder, .sc-field textarea::placeholder { color:#9ca3af; }
      #sc-send-btn {
        width:100%; margin-top:4px; padding:11px; border-radius:10px; border:none;
        background:linear-gradient(135deg,\${accent},\${accentDark});
        color:white; font-size:13px; font-weight:600; cursor:pointer;
        display:flex; align-items:center; justify-content:center; gap:7px;
        transition:opacity .15s,transform .1s;
      }
      #sc-send-btn:hover { opacity:.92; }
      #sc-send-btn:active { transform:scale(.98); }
      #sc-send-btn svg { width:15px; height:15px; fill:white; }
      #sc-send-btn.loading { opacity:.7; pointer-events:none; }

      /* Thread messages */
      #sc-messages {
        flex:1; overflow-y:auto; padding:10px 14px;
        display:flex; flex-direction:column; gap:6px;
        scroll-behavior:smooth; background:white;
      }
      #sc-messages::-webkit-scrollbar { width:4px; }
      #sc-messages::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }

      .sc-msg-row { display:flex; align-items:flex-end; gap:6px; animation:sc-in .2s ease; }
      .sc-msg-row.visitor { flex-direction:row-reverse; }
      @keyframes sc-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

      .sc-msg-av {
        width:26px; height:26px; border-radius:50%; flex-shrink:0;
        background:linear-gradient(135deg,\${accent},\${accentDark});
        display:flex; align-items:center; justify-content:center;
        font-size:10px; font-weight:700; color:white;
      }
      .sc-msg-row.visitor .sc-msg-av { display:none; }
      .sc-bub-wrap { display:flex; flex-direction:column; max-width:78%; }
      .sc-msg-row.visitor .sc-bub-wrap { align-items:flex-end; }
      .sc-bub-text {
        padding:9px 13px; border-radius:16px; border-bottom-left-radius:4px;
        font-size:13px; line-height:1.5; word-wrap:break-word; color:#111827; background:#f3f4f6;
      }
      .sc-msg-row.visitor .sc-bub-text {
        background:linear-gradient(135deg,\${accent},\${accentDark}); color:white;
        border-bottom-left-radius:16px; border-bottom-right-radius:4px;
      }
      .sc-bub-time { font-size:10px; color:#9ca3af; margin-top:3px; padding:0 2px; }
      .sc-msg-row.visitor .sc-bub-time { text-align:right; }

      /* Reply bar */
      #sc-reply-bar {
        border-top:1px solid #f3f4f6; padding:10px 12px;
        display:flex; align-items:flex-end; gap:8px; flex-shrink:0; background:white;
      }
      #sc-reply-input {
        flex:1; border:1.5px solid #e5e7eb; border-radius:20px;
        padding:9px 14px; font-size:13px; color:#111827; background:#f9fafb;
        outline:none; resize:none; max-height:100px; min-height:38px; line-height:1.4;
        transition:border-color .15s,background .15s;
      }
      #sc-reply-input:focus { border-color:\${accent}; background:white; }
      #sc-reply-input::placeholder { color:#9ca3af; }
      #sc-reply-send {
        width:36px; height:36px; border-radius:50%; border:none; flex-shrink:0;
        background:linear-gradient(135deg,\${accent},\${accentDark});
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; transition:transform .15s,opacity .15s;
      }
      #sc-reply-send:hover { transform:scale(1.08); }
      #sc-reply-send:active { transform:scale(.94); }
      #sc-reply-send svg { width:16px; height:16px; fill:white; margin-left:2px; }

      /* Typing */
      .sc-typing { display:flex; align-items:center; gap:3px; padding:10px 13px; }
      .sc-typing span { width:6px; height:6px; border-radius:50%; background:#9ca3af; display:inline-block; animation:sc-bounce .9s infinite; }
      .sc-typing span:nth-child(2) { animation-delay:.15s; }
      .sc-typing span:nth-child(3) { animation-delay:.3s; }
      @keyframes sc-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }

      /* Existing conversation item */
      .sc-conv-item {
        display:flex; align-items:center; gap:10px;
        padding:10px 16px 4px; cursor:pointer; transition:background .15s;
      }
      .sc-conv-item:hover { background:#f9fafb; }
      .sc-conv-av {
        width:36px; height:36px; border-radius:50%; flex-shrink:0;
        background:linear-gradient(135deg,\${accent},\${accentDark});
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; color:white;
      }
      .sc-conv-info { flex:1; min-width:0; }
      .sc-conv-name { font-size:13px; font-weight:600; color:#111827; }
      .sc-conv-sub  { font-size:12px; color:#6b7280; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .sc-new-link {
        display:block; width:100%; padding:8px 16px 12px;
        border:none; background:none; cursor:pointer;
        font-size:12px; color:#6b7280; text-align:center; text-decoration:underline;
        transition:color .15s;
      }
      .sc-new-link:hover { color:#374151; }
    \`;

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    if (!document.querySelector('link[data-sc-icons]')) {
      var iconLink = document.createElement('link');
      iconLink.rel = 'stylesheet';
      iconLink.setAttribute('data-sc-icons', '1');
      iconLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=bolt,chat,co_present,contact_support,forum,info,send&display=block';
      document.head.appendChild(iconLink);
    }

    // ── DOM ──────────────────────────────────────────────────────────────
    var wrap = document.createElement('div');
    wrap.id = 'sc-wrap';
    document.body.appendChild(wrap);

    var bubbleWrap = document.createElement('div');
    bubbleWrap.id = 'sc-bubble-wrap';
    wrap.appendChild(bubbleWrap);

    var bubble = document.createElement('button');
    bubble.id = 'sc-bubble';
    bubble.setAttribute('aria-label', 'Open chat');
    bubble.innerHTML =
      '<span class="material-symbols-outlined fv-chat-icon">' + iconStyle + '</span>' +
      '<div class="sc-ico-close"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></div>';
    bubbleWrap.appendChild(bubble);

    var badge = document.createElement('div');
    badge.id = 'sc-badge';
    bubbleWrap.appendChild(badge);

    var panel = document.createElement('div');
    panel.id = 'sc-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat');
    wrap.appendChild(panel);

    // ── State ─────────────────────────────────────────────────────────────
    var conversationId   = null;
    var pollInterval     = null;
    var lastMessageTime  = null;
    var isOpen           = false;
    var shownMessageIds  = {};
    var cachedVisitorName = null;

    // ── Storage ───────────────────────────────────────────────────────────
    var STORAGE_KEY = 'sc_' + apiKey;
    function saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cid: conversationId, name: cachedVisitorName, t: lastMessageTime,
        }));
      } catch(e) {}
    }
    function loadFromStorage() {
      try { var r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch(e) { return null; }
    }
    function clearStorage() {
      try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    }

    // Restore previous session
    var _stored = loadFromStorage();
    if (_stored && _stored.cid) {
      conversationId    = _stored.cid;
      cachedVisitorName = _stored.name;
      lastMessageTime   = _stored.t;
    }

    function initials(name) {
      return (name || '?').split(' ').slice(0,2).map(function(w){ return w[0]||''; }).join('').toUpperCase() || '?';
    }

    function timeLabel(iso) {
      try {
        var d = new Date(iso), now = new Date(), diff = (now-d)/60000;
        if (diff < 1) return 'just now';
        if (diff < 60) return Math.floor(diff)+'m ago';
        if (diff < 1440) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        return d.toLocaleDateString([],{month:'short',day:'numeric'});
      } catch(e) { return ''; }
    }

    function tabsHtml(active) {
      return \`
        <div id="sc-tabs">
          <button class="sc-tab \${active==='home'?'active':''}" data-sc-tab="home">
            <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
            \${t.tabHome}
          </button>
          <button class="sc-tab \${active==='messages'?'active':''}" data-sc-tab="messages">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
            \${t.tabMessages}
          </button>
          <button class="sc-tab \${active==='help'?'active':''}" data-sc-tab="help">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            \${t.tabHelp}
          </button>
        </div>
      \`;
    }

    function bindTabs(active) {
      var tabs = panel.querySelectorAll('[data-sc-tab]');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var which = tab.getAttribute('data-sc-tab');
          if (which === active) return;
          if (which === 'home') showWelcome();
          else if (which === 'messages') {
            if (conversationId) { loadConversation(function(msgs) { showThread(msgs, cachedVisitorName); startPolling(); }); }
            else showForm();
          }
        });
      });
    }

    function closeBtn(extraClass) {
      return '<button class="sc-icon-btn ' + (extraClass||'') + '" aria-label="Close"><svg viewBox="0 0 14 14"><path d="M13 1L1 13M1 1l12 12"/></svg></button>';
    }
    function backBtn() {
      return '<button class="sc-icon-btn" id="sc-back" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg></button>';
    }
    function logoInner() {
      if (!logoUrl) return initials(agentName);
      return '<img src="' + logoUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">';
    }
    function chatAvInner() {
      if (!logoUrl) return initials(agentName);
      return '<img src="' + logoUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">';
    }

    // ── Load conversation from server ──────────────────────────────────────
    function loadConversation(cb) {
      fetch(apiBase + '/widget/conversations/' + conversationId + '/messages')
        .then(function(r) { return r.ok ? r.json() : []; })
        .catch(function() { return []; })
        .then(function(msgs) {
          if (msgs && msgs.length) lastMessageTime = msgs[msgs.length - 1].createdAt;
          cb(msgs || []);
        });
    }

    // ── Home screen ───────────────────────────────────────────────────────
    function showWelcome() {
      panel.classList.remove('sc-chat-mode');
      var cardHtml = conversationId
        ? '<div class="sc-card">' +
            '<div class="sc-card-header">' +
              '<span class="sc-card-title">' + t.yourConversations + '</span>' +
              '<div class="sc-av-stack">' +
                '<div class="sc-mini-av sc-mini-av-a">' + initials(agentName) + '</div>' +
                '<div class="sc-mini-av sc-mini-av-v">😊</div>' +
              '</div>' +
            '</div>' +
            '<div class="sc-conv-item" id="sc-resume-btn">' +
              '<div class="sc-conv-av">' + initials(cachedVisitorName || agentName) + '</div>' +
              '<div class="sc-conv-info">' +
                '<div class="sc-conv-name">' + (cachedVisitorName || 'You') + '</div>' +
                '<div class="sc-conv-sub">' + t.tapToContinue + '</div>' +
              '</div>' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' +
            '</div>' +
            '<button class="sc-new-link" id="sc-new-btn">' + t.startNew + '</button>' +
          '</div>'
        : '<div class="sc-card">' +
            '<div class="sc-card-header">' +
              '<span class="sc-card-title">' + t.yourConversations + '</span>' +
              '<div class="sc-av-stack">' +
                '<div class="sc-mini-av sc-mini-av-a">' + initials(agentName) + '</div>' +
                '<div class="sc-mini-av sc-mini-av-v">😊</div>' +
              '</div>' +
            '</div>' +
            '<button class="sc-start-card-btn" id="sc-start-btn">' +
              '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
              t.startBtn +
            '</button>' +
          '</div>';
      panel.innerHTML =
        '<div id="sc-handle"></div>' +
        '<div id="sc-topbar">' +
          '<div class="sc-top-logo">' + logoInner() + '</div>' +
          closeBtn('sc-close-btn') +
        '</div>' +
        '<div id="sc-hero">' +
          '<h2>' + t.hello + ' ' + agentName + ' 👋</h2>' +
          '<p>' + greeting + '</p>' +
        '</div>' +
        '<div id="sc-cards">' + cardHtml + '</div>' +
        tabsHtml('home');
      panel.querySelector('.sc-close-btn').onclick = closePanel;
      if (conversationId) {
        document.getElementById('sc-resume-btn').addEventListener('click', function() {
          loadConversation(function(msgs) { showThread(msgs, cachedVisitorName); startPolling(); });
        });
        document.getElementById('sc-new-btn').addEventListener('click', function() {
          clearStorage();
          conversationId = null; cachedVisitorName = null; lastMessageTime = null; shownMessageIds = {};
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          showForm();
        });
      } else {
        document.getElementById('sc-start-btn').addEventListener('click', showForm);
      }
      bindTabs('home');
    }

    // ── Form screen ───────────────────────────────────────────────────────
    function showForm() {
      panel.classList.add('sc-chat-mode');
      panel.innerHTML =
        '<div id="sc-chat-hdr">' +
          backBtn() +
          '<div class="sc-chat-av">' + chatAvInner() + '</div>' +
          '<div>' +
            '<div class="sc-chat-name">' + agentName + '</div>' +
            '<div class="sc-chat-status"><span class="sc-dot"></span>' + t.repliesIn + '</div>' +
          '</div>' +
          '<div class="sc-ml">' + closeBtn() + '</div>' +
        '</div>' +
        '<div id="sc-form-wrap">' +
          '<form id="sc-form" autocomplete="on">' +
            '<div class="sc-field">' +
              '<label for="sc-name">' + t.nameLabel + '</label>' +
              '<input id="sc-name" name="name" placeholder="' + t.namePlaceholder + '" required autocomplete="name" />' +
            '</div>' +
            '<div class="sc-field">' +
              '<label for="sc-phone">' + t.phoneLabel + '</label>' +
              '<input id="sc-phone" name="phone" type="tel" placeholder="' + t.phonePlaceholder + '" autocomplete="tel" />' +
            '</div>' +
            '<div class="sc-field">' +
              '<label for="sc-msg">' + t.msgLabel + '</label>' +
              '<textarea id="sc-msg" name="message" placeholder="' + t.msgPlaceholder + '" required></textarea>' +
            '</div>' +
            '<button type="submit" id="sc-send-btn">' +
              '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
              t.sendBtn +
            '</button>' +
          '</form>' +
        '</div>' +
        tabsHtml('messages');
      document.getElementById('sc-back').addEventListener('click', showWelcome);
      panel.querySelector('.sc-ml .sc-icon-btn').onclick = closePanel;
      document.getElementById('sc-form').addEventListener('submit', function(e) { e.preventDefault(); startConversation(); });
      bindTabs('messages');
    }

    // ── Thread screen ─────────────────────────────────────────────────────
    function showThread(messages, visitorName) {
      var vName = visitorName || cachedVisitorName || 'You';
      cachedVisitorName = vName;
      shownMessageIds = {};
      panel.classList.add('sc-chat-mode');
      panel.innerHTML =
        '<div id="sc-chat-hdr">' +
          backBtn() +
          '<div class="sc-chat-av">' + chatAvInner() + '</div>' +
          '<div>' +
            '<div class="sc-chat-name">' + agentName + '</div>' +
            '<div class="sc-chat-status"><span class="sc-dot"></span>' + t.online + '</div>' +
          '</div>' +
          '<div class="sc-ml">' + closeBtn() + '</div>' +
        '</div>' +
        '<div id="sc-messages"></div>' +
        '<div id="sc-reply-bar">' +
          '<textarea id="sc-reply-input" placeholder="Type a message…" rows="1"></textarea>' +
          '<button id="sc-reply-send" aria-label="Send">' +
            '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
          '</button>' +
        '</div>' +
        tabsHtml('messages');
      document.getElementById('sc-back').addEventListener('click', showWelcome);
      panel.querySelector('.sc-ml .sc-icon-btn').onclick = closePanel;

      var container = document.getElementById('sc-messages');
      messages.forEach(function(m) { appendMessage(container, m, vName); });

      var replyInput = document.getElementById('sc-reply-input');
      var replySend  = document.getElementById('sc-reply-send');
      replySend.addEventListener('click', function() { sendReply(replyInput, vName); });
      replyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(replyInput, vName); }
      });
      replyInput.addEventListener('input', function() {
        replyInput.style.height = 'auto';
        replyInput.style.height = Math.min(replyInput.scrollHeight, 100) + 'px';
      });
      bindTabs('messages');
    }

    function appendMessage(container, m, vName) {
      if (shownMessageIds[m.id]) return;
      shownMessageIds[m.id] = true;
      var row = document.createElement('div');
      row.className = 'sc-msg-row ' + m.sender;
      var avHtml = m.sender === 'agent' ? '<div class="sc-msg-av">' + initials(agentName) + '</div>' : '';
      row.innerHTML = avHtml +
        '<div class="sc-bub-wrap">' +
          '<div class="sc-bub-text">' + escHtml(m.content) + '</div>' +
          '<div class="sc-bub-time">' + timeLabel(m.createdAt) + '</div>' +
        '</div>';
      container.appendChild(row);
      container.scrollTop = container.scrollHeight;
    }

    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\\n/g,'<br>');
    }

    // ── Start conversation ────────────────────────────────────────────────
    function startConversation() {
      var name  = (document.getElementById('sc-name').value  || '').trim();
      var phone = (document.getElementById('sc-phone').value || '').trim();
      var msg   = (document.getElementById('sc-msg').value   || '').trim();
      if (!name || !msg) return;
      cachedVisitorName = name;

      var btn = document.getElementById('sc-send-btn');
      btn.classList.add('loading');
      btn.textContent = 'Sending…';

      fetch(apiBase + '/widget/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorName: name, visitorPhone: phone || null, siteUrl: window.location.hostname, apiKey: apiKey, initialMessage: msg })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        conversationId  = data.conversationId;
        lastMessageTime = data.message.createdAt;
        saveToStorage();
        showThread([data.message], name);
        startPolling();
      })
      .catch(function() {
        btn.classList.remove('loading');
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> ' + t.sendBtn;
      });
    }

    // ── Send reply ────────────────────────────────────────────────────────
    function sendReply(input, vName) {
      var text = (input.value || '').trim();
      if (!text || !conversationId) return;
      input.value = '';
      input.style.height = 'auto';
      fetch(apiBase + '/widget/conversations/' + conversationId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      .then(function(r) { return r.json(); })
      .then(function(m) {
        lastMessageTime = m.createdAt;
        saveToStorage();
        var container = document.getElementById('sc-messages');
        if (container) appendMessage(container, m, vName);
      });
    }

    // ── Polling ───────────────────────────────────────────────────────────
    function startPolling() {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(function() {
        if (!conversationId) return;
        var sinceParam = lastMessageTime ? new Date(new Date(lastMessageTime).getTime()+1).toISOString() : null;
        var qs = sinceParam ? '?since=' + encodeURIComponent(sinceParam) : '';
        fetch(apiBase + '/widget/conversations/' + conversationId + '/messages' + qs)
          .then(function(r) { return r.json(); })
          .then(function(msgs) {
            if (!msgs || !msgs.length) return;
            var container = document.getElementById('sc-messages');
            msgs.forEach(function(m) {
              if (shownMessageIds[m.id]) return;
              lastMessageTime = m.createdAt;
              if (m.sender === 'agent') {
                var badge = document.getElementById('sc-badge');
                if (badge && !isOpen) { badge.style.display = 'flex'; badge.textContent = '1'; }
                if (container) appendMessage(container, m, cachedVisitorName);
              }
            });
          });
      }, 4000);
    }

    // ── Open / Close ──────────────────────────────────────────────────────
    function openPanel() {
      isOpen = true;
      bubble.classList.add('open');
      panel.classList.add('open');
      var badge = document.getElementById('sc-badge');
      if (badge) badge.style.display = 'none';
      if (conversationId) {
        loadConversation(function(msgs) { showThread(msgs, cachedVisitorName); startPolling(); });
      } else {
        showWelcome();
      }
    }

    function closePanel() {
      isOpen = false;
      bubble.classList.remove('open');
      panel.classList.remove('open');
    }

    bubble.onclick = function() { isOpen ? closePanel() : openPanel(); };

    // ── Public API ────────────────────────────────────────────────────────
    window.customerly = window.customerly || {};
    window.customerly.open  = openPanel;
    window.customerly.close = closePanel;
    window.customerly.show  = openPanel;
    window.customerly.hide  = closePanel;
    window.SimpleChat = window.SimpleChat || {};
    window.SimpleChat.open   = openPanel;
    window.SimpleChat.close  = closePanel;
    window.SimpleChat.toggle = function() { isOpen ? closePanel() : openPanel(); };
  } // end init
})();
`;

  res.send(script);
});

export default router;
