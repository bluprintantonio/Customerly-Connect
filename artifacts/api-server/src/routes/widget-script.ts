import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/widget.js", (_req, res): void => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300");

  const script = `
(function() {
  'use strict';
  var config = document.currentScript || (function() {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var apiKey    = config.getAttribute('data-widget-key');
  var accentRaw = config.getAttribute('data-color') || '#1a56db';
  var agentName = config.getAttribute('data-agent-name') || 'Support';
  var greeting  = config.getAttribute('data-greeting') || 'Hi there! How can we help you today?';

  // Prefer explicit data-api-url attribute, then derive from script src
  var explicitApiUrl = config.getAttribute('data-api-url');
  var apiBase;
  if (explicitApiUrl) {
    apiBase = explicitApiUrl.replace(/\\/$/, '');
  } else if (config.src) {
    apiBase = config.src.replace('/api/widget.js', '/api');
  } else {
    console.warn('[SimpleChat] Could not determine API URL. Add data-api-url attribute to the script tag.');
    return;
  }

  if (!apiKey) { console.warn('[SimpleChat] Missing data-widget-key'); return; }

  // Derive a darker shade for gradients
  function hexToRgb(h) {
    var r = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(h);
    return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : { r:26, g:86, b:219 };
  }
  function darken(h, amt) {
    var c = hexToRgb(h);
    return 'rgb('+Math.max(0,c.r-amt)+','+Math.max(0,c.g-amt)+','+Math.max(0,c.b-amt)+')';
  }
  var accent     = accentRaw;
  var accentDark = darken(accentRaw, 30);
  var rgb        = hexToRgb(accentRaw);
  var accentRgb  = rgb.r+','+rgb.g+','+rgb.b;

  // ── Styles ───────────────────────────────────────────────────────────
  var css = \`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    #sc-wrap * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

    /* Bubble */
    #sc-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483646;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, \${accent}, \${accentDark});
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(\${accentRgb},.45), 0 2px 6px rgba(0,0,0,.15);
      transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
      outline: none;
    }
    #sc-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(\${accentRgb},.55), 0 2px 8px rgba(0,0,0,.18); }
    #sc-bubble:active { transform: scale(.96); }
    #sc-bubble svg { width: 26px; height: 26px; transition: opacity .15s, transform .15s; }
    .az-chat-logo {
      width: 26px;
      height: 26px;
      transition: opacity .15s, transform .15s;
    }
    #sc-bubble .sc-ico-close {
      opacity: 0;
      transform: scale(.6) rotate(-45deg);
      position: absolute;
    }
    #sc-bubble.open .az-chat-logo {
      opacity: 0;
      transform: scale(.6) rotate(45deg);
    }
    #sc-bubble.open .sc-ico-close {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }

    /* Unread badge */
    #sc-badge {
      position: absolute; top: -3px; right: -3px;
      min-width: 20px; height: 20px; border-radius: 10px; padding: 0 5px;
      background: #ef4444; border: 2px solid white;
      display: none; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white; letter-spacing: -.3px;
    }

    /* Panel */
    #sc-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 2147483645;
      width: 360px; height: 560px; border-radius: 20px;
      background: #fff; overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
      display: flex; flex-direction: column;
      transform: scale(.9) translateY(16px); opacity: 0; pointer-events: none;
      transition: transform .25s cubic-bezier(.34,1.3,.64,1), opacity .2s ease;
      transform-origin: bottom right;
    }
    #sc-panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

    /* Header */
    #sc-header {
      background: linear-gradient(135deg, \${accent} 0%, \${accentDark} 100%);
      padding: 20px 18px 48px;
      flex-shrink: 0; position: relative;
    }
    #sc-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    #sc-header-top .sc-close-btn {
      background: rgba(255,255,255,.2); border: none; border-radius: 50%;
      width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: white; transition: background .15s;
    }
    #sc-header-top .sc-close-btn:hover { background: rgba(255,255,255,.32); }
    #sc-header-top .sc-close-btn svg { width: 14px; height: 14px; stroke: white; fill: none; stroke-width: 2; stroke-linecap: round; }
    .sc-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,.25); border: 2px solid rgba(255,255,255,.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .sc-agent-info { margin-left: 12px; }
    .sc-agent-name { font-size: 15px; font-weight: 600; color: white; line-height: 1.2; }
    .sc-agent-status { font-size: 11px; color: rgba(255,255,255,.8); margin-top: 2px; display: flex; align-items: center; gap: 4px; }
    .sc-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; flex-shrink: 0; }
    #sc-greeting {
      font-size: 15px; font-weight: 500; color: white; line-height: 1.5;
      margin-top: 0;
    }

    /* Card overlay on header */
    #sc-card {
      margin: 0 12px; border-radius: 14px;
      background: white; box-shadow: 0 4px 20px rgba(0,0,0,.12);
      flex-shrink: 0; position: relative; z-index: 1; margin-top: -32px;
      overflow: hidden;
    }

    /* Welcome screen */
    #sc-welcome { padding: 18px; }
    #sc-welcome p { font-size: 13px; color: #6b7280; line-height: 1.55; margin: 0 0 14px; }
    .sc-start-btn {
      width: 100%; padding: 11px 0; border-radius: 10px; border: none;
      background: linear-gradient(135deg, \${accent}, \${accentDark});
      color: white; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: opacity .15s, transform .1s;
    }
    .sc-start-btn:hover { opacity: .92; }
    .sc-start-btn:active { transform: scale(.98); }

    /* Form */
    #sc-form { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 9px; }
    .sc-field { display: flex; flex-direction: column; gap: 4px; }
    .sc-field label { font-size: 11px; font-weight: 600; color: #374151; letter-spacing: .3px; text-transform: uppercase; }
    .sc-field input, .sc-field textarea {
      border: 1.5px solid #e5e7eb; border-radius: 9px;
      padding: 9px 12px; font-size: 13px; color: #111827;
      background: #f9fafb; outline: none; width: 100%; resize: none;
      transition: border-color .15s, background .15s;
    }
    .sc-field input:focus, .sc-field textarea:focus { border-color: \${accent}; background: white; }
    .sc-field textarea { height: 72px; }
    .sc-field input::placeholder, .sc-field textarea::placeholder { color: #9ca3af; }
    #sc-send-btn {
      margin-top: 2px; padding: 11px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, \${accent}, \${accentDark});
      color: white; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 7px;
      transition: opacity .15s, transform .1s;
    }
    #sc-send-btn:hover { opacity: .92; }
    #sc-send-btn:active { transform: scale(.98); }
    #sc-send-btn svg { width: 15px; height: 15px; fill: white; }
    #sc-send-btn.loading { opacity: .7; pointer-events: none; }

    /* Thread */
    #sc-thread { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    #sc-messages {
      flex: 1; overflow-y: auto; padding: 10px 14px;
      display: flex; flex-direction: column; gap: 6px;
      scroll-behavior: smooth;
    }
    #sc-messages::-webkit-scrollbar { width: 4px; }
    #sc-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

    .sc-msg-row { display: flex; align-items: flex-end; gap: 6px; animation: sc-slide-in .2s ease; }
    .sc-msg-row.visitor { flex-direction: row-reverse; }
    @keyframes sc-slide-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

    .sc-msg-avatar {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, \${accent}, \${accentDark});
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white;
    }
    .sc-msg-row.visitor .sc-msg-avatar { display: none; }

    .sc-bubble-wrap { display: flex; flex-direction: column; max-width: 78%; }
    .sc-msg-row.visitor .sc-bubble-wrap { align-items: flex-end; }

    .sc-bubble-text {
      padding: 9px 13px; border-radius: 16px;
      font-size: 13px; line-height: 1.5; word-wrap: break-word; color: #111827;
      background: #f3f4f6;
      border-bottom-left-radius: 4px;
    }
    .sc-msg-row.visitor .sc-bubble-text {
      background: linear-gradient(135deg, \${accent}, \${accentDark});
      color: white; border-bottom-left-radius: 16px; border-bottom-right-radius: 4px;
    }
    .sc-bubble-time { font-size: 10px; color: #9ca3af; margin-top: 3px; padding: 0 2px; }
    .sc-msg-row.visitor .sc-bubble-time { text-align: right; }

    /* Reply bar */
    #sc-reply-bar {
      border-top: 1px solid #f3f4f6; padding: 10px 12px;
      display: flex; align-items: flex-end; gap: 8px; flex-shrink: 0;
    }
    #sc-reply-input {
      flex: 1; border: 1.5px solid #e5e7eb; border-radius: 20px;
      padding: 9px 14px; font-size: 13px; color: #111827;
      background: #f9fafb; outline: none; resize: none;
      max-height: 100px; min-height: 38px; line-height: 1.4;
      transition: border-color .15s, background .15s;
    }
    #sc-reply-input:focus { border-color: \${accent}; background: white; }
    #sc-reply-input::placeholder { color: #9ca3af; }
    #sc-reply-send {
      width: 36px; height: 36px; border-radius: 50%; border: none; flex-shrink: 0;
      background: linear-gradient(135deg, \${accent}, \${accentDark});
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: transform .15s, opacity .15s;
    }
    #sc-reply-send:hover { transform: scale(1.08); }
    #sc-reply-send:active { transform: scale(.94); }
    #sc-reply-send svg { width: 16px; height: 16px; fill: white; margin-left: 2px; }

    /* Typing indicator */
    .sc-typing { display: flex; align-items: center; gap: 3px; padding: 10px 13px; }
    .sc-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;
      display: inline-block; animation: sc-bounce .9s infinite;
    }
    .sc-typing span:nth-child(2) { animation-delay: .15s; }
    .sc-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes sc-bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }

    /* Powered by */
    #sc-powered { text-align:center; font-size:10px; color:#d1d5db; padding:6px 0 8px; flex-shrink:0; }

    /* Scrollbar inside panel */
    #sc-panel { scrollbar-width: thin; }
  \`;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'sc-wrap';
  document.body.appendChild(wrap);

  // Bubble
  var bubble = document.createElement('button');
  bubble.id = 'sc-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = \`
    <svg class="az-chat-logo" viewBox="0 0 24 24" fill="white"><path d="M5 14 L9 7 L13 12 L19 8 L15 15 L11 10 Z"/></svg>
    <svg class="sc-ico-close" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    <div id="sc-badge"></div>
  \`;
  wrap.appendChild(bubble);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'sc-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat');
  wrap.appendChild(panel);

  // ── State ─────────────────────────────────────────────────────────────
  var conversationId  = null;
  var pollInterval    = null;
  var lastMessageTime = null;
  var isOpen          = false;
  var shownMessageIds = {};

  function initials(name) {
    return name.split(' ').slice(0,2).map(function(w){ return w[0]||''; }).join('').toUpperCase() || '?';
  }

  function timeLabel(iso) {
    try {
      var d = new Date(iso), now = new Date();
      var diff = (now - d) / 60000;
      if (diff < 1) return 'just now';
      if (diff < 60) return Math.floor(diff)+'m ago';
      if (diff < 1440) return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      return d.toLocaleDateString([], {month:'short',day:'numeric'});
    } catch(e) { return ''; }
  }

  // ── Header (always rendered) ──────────────────────────────────────────
  function renderHeader(subtitle) {
    return \`
      <div id="sc-header">
        <div id="sc-header-top">
          <div style="display:flex;align-items:center">
            <div class="sc-avatar">\${initials(agentName)}</div>
            <div class="sc-agent-info">
              <div class="sc-agent-name">\${agentName}</div>
              <div class="sc-agent-status"><span class="sc-status-dot"></span>\${subtitle || 'Online'}</div>
            </div>
          </div>
          <button class="sc-close-btn" aria-label="Close chat">
            <svg viewBox="0 0 14 14"><path d="M13 1L1 13M1 1l12 12"/></svg>
          </button>
        </div>
        <p id="sc-greeting">\${greeting}</p>
      </div>
    \`;
  }

  // ── Welcome screen ────────────────────────────────────────────────────
  function showWelcome() {
    panel.innerHTML = renderHeader('Typically replies in minutes') + \`
      <div id="sc-card">
        <div id="sc-welcome">
          <p>Send us a message and we'll get back to you as soon as possible.</p>
          <button class="sc-start-btn" id="sc-start-btn">Start a conversation</button>
        </div>
      </div>
      <div id="sc-powered">Powered by SimpleChat</div>
    \`;
    bindClose();
    document.getElementById('sc-start-btn').onclick = showForm;
  }

  // ── Contact form ──────────────────────────────────────────────────────
  function showForm() {
    panel.innerHTML = renderHeader('Typically replies in minutes') + \`
      <div id="sc-card">
        <form id="sc-form" autocomplete="on">
          <div class="sc-field">
            <label for="sc-name">Your name</label>
            <input id="sc-name" name="name" placeholder="Maria Santos" required autocomplete="name" />
          </div>
          <div class="sc-field">
            <label for="sc-email">Email <span style="font-weight:400;text-transform:none;color:#9ca3af">(optional)</span></label>
            <input id="sc-email" name="email" type="email" placeholder="maria@email.com" autocomplete="email" />
          </div>
          <div class="sc-field">
            <label for="sc-msg">Message</label>
            <textarea id="sc-msg" name="message" placeholder="How can we help?" required></textarea>
          </div>
          <button type="submit" id="sc-send-btn">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            Send message
          </button>
        </form>
      </div>
      <div id="sc-powered">Powered by SimpleChat</div>
    \`;
    bindClose();
    document.getElementById('sc-form').onsubmit = function(e) {
      e.preventDefault();
      startConversation();
    };
  }

  // ── Start conversation ────────────────────────────────────────────────
  function startConversation() {
    var name  = (document.getElementById('sc-name').value  || '').trim();
    var email = (document.getElementById('sc-email').value || '').trim();
    var msg   = (document.getElementById('sc-msg').value   || '').trim();
    if (!name || !msg) return;

    var btn = document.getElementById('sc-send-btn');
    btn.classList.add('loading');
    btn.textContent = 'Sending...';

    fetch(apiBase + '/widget/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName: name,
        visitorEmail: email || null,
        siteUrl: window.location.hostname,
        apiKey: apiKey,
        initialMessage: msg
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      conversationId  = data.conversationId;
      lastMessageTime = data.message.createdAt;
      showThread([data.message], name);
      startPolling();
    })
    .catch(function() {
      btn.classList.remove('loading');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Send message';
    });
  }

  // ── Thread ────────────────────────────────────────────────────────────
  function showThread(messages, visitorName) {
    var vName = visitorName || 'You';
    panel.innerHTML = renderHeader('Online') + \`
      <div id="sc-thread">
        <div id="sc-messages"></div>
        <div id="sc-reply-bar">
          <textarea id="sc-reply-input" placeholder="Type a message…" rows="1"></textarea>
          <button id="sc-reply-send" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <div id="sc-powered">Powered by SimpleChat</div>
    \`;
    bindClose();

    var container = document.getElementById('sc-messages');
    messages.forEach(function(m) { appendMessage(container, m, vName); });

    var replyInput = document.getElementById('sc-reply-input');
    var replySend  = document.getElementById('sc-reply-send');

    replySend.onclick = function() { sendReply(replyInput, vName); };
    replyInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(replyInput, vName); }
    });
    // Auto-resize textarea
    replyInput.addEventListener('input', function() {
      replyInput.style.height = 'auto';
      replyInput.style.height = Math.min(replyInput.scrollHeight, 100) + 'px';
    });
  }

  function appendMessage(container, m, vName) {
    if (shownMessageIds[m.id]) return;
    shownMessageIds[m.id] = true;
    var row = document.createElement('div');
    row.className = 'sc-msg-row ' + m.sender;

    var avatarHtml = m.sender === 'agent'
      ? '<div class="sc-msg-avatar">' + initials(agentName) + '</div>'
      : '';

    row.innerHTML = avatarHtml + \`
      <div class="sc-bubble-wrap">
        <div class="sc-bubble-text">\${escHtml(m.content)}</div>
        <div class="sc-bubble-time">\${timeLabel(m.createdAt)}</div>
      </div>
    \`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\\n/g,'<br>');
  }

  // ── Send ──────────────────────────────────────────────────────────────
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
      var container = document.getElementById('sc-messages');
      if (container) appendMessage(container, m, vName);
    });
  }

  // ── Polling ───────────────────────────────────────────────────────────
  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(function() {
      if (!conversationId) return;
      // Add 1ms to lastMessageTime to avoid re-fetching the same message
      // due to microsecond vs millisecond precision mismatch in timestamps
      var sinceParam = lastMessageTime
        ? new Date(new Date(lastMessageTime).getTime() + 1).toISOString()
        : null;
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
              if (badge && !isOpen) {
                badge.style.display = 'flex';
                badge.textContent   = '1';
              }
              if (container) appendMessage(container, m);
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
    if (!conversationId) showWelcome();
  }

  function closePanel() {
    isOpen = false;
    bubble.classList.remove('open');
    panel.classList.remove('open');
  }

  function bindClose() {
    var btn = panel.querySelector('.sc-close-btn');
    if (btn) btn.onclick = closePanel;
  }

  bubble.onclick = function() {
    isOpen ? closePanel() : openPanel();
  };
})();
`;

  res.send(script);
});

export default router;
