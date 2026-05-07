import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/widget.js", (_req, res): void => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const script = `
(function() {
  var config = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var apiKey = config.getAttribute('data-widget-key');
  var apiBase = config.src.replace('/api/widget.js', '/api');
  if (!apiKey) { console.warn('[SimpleChat] Missing data-widget-key'); return; }

  // Inject styles
  var style = document.createElement('style');
  style.textContent = \`
    #sc-bubble { position:fixed; bottom:24px; right:24px; width:52px; height:52px; border-radius:50%; background:#2563eb; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,.25); z-index:9999; border:none; }
    #sc-bubble svg { width:24px; height:24px; fill:white; }
    #sc-badge { position:absolute; top:-4px; right:-4px; width:18px; height:18px; background:#ef4444; border-radius:50%; display:none; align-items:center; justify-content:center; font-size:10px; color:white; font-weight:bold; font-family:sans-serif; }
    #sc-box { position:fixed; bottom:88px; right:24px; width:340px; max-height:500px; border-radius:16px; background:#fff; box-shadow:0 8px 32px rgba(0,0,0,.18); display:none; flex-direction:column; overflow:hidden; z-index:9998; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    #sc-header { background:#2563eb; color:white; padding:14px 16px; font-weight:600; font-size:14px; }
    #sc-form { padding:16px; display:flex; flex-direction:column; gap:10px; }
    #sc-form input, #sc-form textarea { border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; width:100%; box-sizing:border-box; outline:none; }
    #sc-form textarea { height:80px; resize:none; }
    #sc-form button { background:#2563eb; color:white; border:none; border-radius:8px; padding:10px; font-size:13px; font-weight:600; cursor:pointer; }
    #sc-messages { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
    .sc-msg { max-width:75%; padding:8px 12px; border-radius:12px; font-size:13px; line-height:1.4; word-wrap:break-word; }
    .sc-msg.visitor { background:#2563eb; color:white; align-self:flex-end; border-bottom-right-radius:4px; }
    .sc-msg.agent { background:#f1f5f9; color:#1e293b; align-self:flex-start; border-bottom-left-radius:4px; }
    #sc-reply { display:flex; gap:8px; padding:10px; border-top:1px solid #e2e8f0; }
    #sc-reply input { flex:1; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; outline:none; }
    #sc-reply button { background:#2563eb; color:white; border:none; border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; }
  \`;
  document.head.appendChild(style);

  // Create bubble
  var bubble = document.createElement('button');
  bubble.id = 'sc-bubble';
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><div id="sc-badge"></div>';
  document.body.appendChild(bubble);

  // Create chat box
  var box = document.createElement('div');
  box.id = 'sc-box';
  document.body.appendChild(box);

  var conversationId = null;
  var pollInterval = null;
  var lastMessageTime = null;

  function showForm() {
    box.innerHTML = \`
      <div id="sc-header">Send us a message</div>
      <div id="sc-form">
        <input id="sc-name" placeholder="Your name" required />
        <input id="sc-email" type="email" placeholder="Email (optional)" />
        <textarea id="sc-msg-input" placeholder="How can we help?"></textarea>
        <button id="sc-submit">Start chat</button>
      </div>
    \`;
    document.getElementById('sc-submit').onclick = startConversation;
  }

  function startConversation() {
    var name = document.getElementById('sc-name').value.trim();
    var email = document.getElementById('sc-email').value.trim();
    var msg = document.getElementById('sc-msg-input').value.trim();
    if (!name || !msg) { alert('Please fill in your name and message.'); return; }
    fetch(apiBase + '/widget/conversations', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ visitorName:name, visitorEmail:email||null, siteUrl:window.location.hostname, apiKey:apiKey, initialMessage:msg })
    }).then(function(r){return r.json();}).then(function(data){
      conversationId = data.conversationId;
      lastMessageTime = data.message.createdAt;
      showThread([data.message]);
      startPolling();
    });
  }

  function showThread(messages) {
    box.innerHTML = \`<div id="sc-header">Chat with us</div><div id="sc-messages"></div><div id="sc-reply"><input id="sc-reply-input" placeholder="Type a message..." /><button id="sc-reply-btn">Send</button></div>\`;
    var container = document.getElementById('sc-messages');
    messages.forEach(function(m){ appendMessage(container, m); });
    document.getElementById('sc-reply-btn').onclick = sendReply;
    document.getElementById('sc-reply-input').addEventListener('keydown', function(e){ if(e.key==='Enter') sendReply(); });
  }

  function appendMessage(container, m) {
    var div = document.createElement('div');
    div.className = 'sc-msg ' + m.sender;
    div.textContent = m.content;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function sendReply() {
    var input = document.getElementById('sc-reply-input');
    var text = input.value.trim();
    if (!text || !conversationId) return;
    input.value = '';
    fetch(apiBase + '/widget/conversations/' + conversationId + '/messages', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content:text})
    }).then(function(r){return r.json();}).then(function(m){
      lastMessageTime = m.createdAt;
      var container = document.getElementById('sc-messages');
      if (container) appendMessage(container, m);
    });
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(function(){
      if (!conversationId) return;
      var url = apiBase + '/widget/conversations/' + conversationId + '/messages' + (lastMessageTime ? '?since=' + encodeURIComponent(lastMessageTime) : '');
      fetch(url).then(function(r){return r.json();}).then(function(msgs){
        if (!msgs.length) return;
        var container = document.getElementById('sc-messages');
        msgs.forEach(function(m){
          lastMessageTime = m.createdAt;
          if (m.sender === 'agent') {
            document.getElementById('sc-badge').style.display = 'flex';
            if (container) appendMessage(container, m);
          }
        });
      });
    }, 4000);
  }

  bubble.onclick = function() {
    var isOpen = box.style.display === 'flex';
    box.style.display = isOpen ? 'none' : 'flex';
    document.getElementById('sc-badge').style.display = 'none';
    if (!isOpen && !conversationId) showForm();
  };
})();
`;
  res.send(script);
});

export default router;
