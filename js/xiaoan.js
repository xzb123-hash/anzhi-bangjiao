/**
 * 安置帮教综合管理平台 - 小安 AI 助手
 * 由豆包大模型（火山方舟 Ark）驱动，面向刑释人员提供政策、补助、社保等咨询。
 * 注意：演示环境下 API Key 位于前端，正式部署时应改为服务端代理调用。
 */
const XiaoAn = (function () {
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  const MODEL = 'ep-20260831151156-44ql7';

  // API Key 读取顺序：js/config.js（window.XIAOAN_CONFIG）-> 浏览器本地存储。
  // 密钥不会写入仓库；正式部署建议改为服务端代理。
  function getApiKey() {
    try {
      if (typeof window !== 'undefined' && window.XIAOAN_CONFIG && window.XIAOAN_CONFIG.apiKey) {
        return window.XIAOAN_CONFIG.apiKey;
      }
      return localStorage.getItem('xiaoan_api_key') || '';
    } catch (e) { return ''; }
  }

  const SYSTEM_PROMPT = [
    '你是“小安”，安置帮教综合管理平台刑释人员端专属 AI 政策助手，由豆包大模型驱动。',
    '你的职责：为刑释人员解答社会补助办理、社会保障办理、就业帮扶、创业支持、医保、低保/特困申请、',
    '失业保险金申领、安置帮教政策等相关问题，给出通俗易懂、分步骤的办事指引。',
    '要求：',
    '1. 语气亲切、耐心、尊重，使用简体中文；',
    '2. 回答简洁，先给结论再给步骤；不确定的政策信息要明确说明并建议咨询当地司法所、人社/民政窗口或 12348 法律服务热线；',
    '3. 不得编造政策、金额或办理期限；',
    '4. 不泄露任何个人信息，拒绝违法犯罪、暴力等内容；',
    '5. 当用户表达负面情绪时，先共情安抚，再建议寻求专业心理支持。',
    '6. 你同时为公安、监狱、司法行政、人社、医保、民政、志愿者等工作人员提供平台操作、业务办理流程与政策咨询服务。'
  ].join('');

  const QUICK_QUESTIONS = [
    '刑满释放后可以申请哪些补助？',
    '失业保险金怎么申领？',
    '创业担保贷款怎么申请？',
    '低保和特困人员救助怎么申请？',
    '医保怎么办理？',
    '在异地居住，政策信息怎么查询？'
  ];

  let currentUser = null;
  let chatKey = '';
  let btnEl = null;
  let panelEl = null;
  let messagesEl = null;
  let inputEl = null;
  let busy = false;

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(chatKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveHistory(messages) {
    try {
      localStorage.setItem(chatKey, JSON.stringify(messages.slice(-40)));
    } catch (e) { /* 存储满时忽略，仅影响历史记录 */ }
  }

  function el(tag, attrs, ...ch) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    ch.flat().forEach(c => {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(String(c)));
      else e.appendChild(c);
    });
    return e;
  }

  function callAPI(messages) {
    const apiKey = getApiKey();
    if (!apiKey) {
      return Promise.reject(new Error('尚未配置 API Key，请先在小安面板中填写（仅保存在当前浏览器）'));
    }
    return fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.6,
        max_tokens: 1200
      })
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.json().then(function (data) {
          const msg = (data && data.error && data.error.message) || ('请求失败（' + resp.status + '）');
          throw new Error(msg);
        });
      }
      return resp.json();
    }).then(function (data) {
      const content = data && data.choices && data.choices[0] &&
        data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error('小安暂时没有返回内容，请稍后再试');
      return content;
    });
  }

  function addMessage(role, text) {
    const row = el('div', { class: 'xa-msg ' + (role === 'user' ? 'xa-user' : 'xa-ai') });
    if (role === 'user') {
      const bubble = el('div', { class: 'xa-bubble' });
      bubble.textContent = text;
      row.appendChild(bubble);
    } else {
      const avatar = el('div', { class: 'xa-avatar' });
      avatar.textContent = '安';
      const bubble = el('div', { class: 'xa-bubble' });
      bubble.textContent = text;
      row.appendChild(avatar);
      row.appendChild(bubble);
    }
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addTyping() {
    const row = el('div', { class: 'xa-msg xa-ai' });
    const avatar = el('div', { class: 'xa-avatar' });
    avatar.textContent = '安';
    const bubble = el('div', { class: 'xa-bubble xa-typing' });
    [0, 1, 2].forEach(function () {
      bubble.appendChild(el('span', { class: 'xa-dot' }));
    });
    row.appendChild(avatar);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  }

  function sendMessage(text) {
    if (busy) return;
    const content = (text != null ? String(text) : '').trim();
    if (!content) return;
    const history = loadHistory();
    history.push({ role: 'user', content: content });
    saveHistory(history);
    addMessage('user', content);
    inputEl.value = '';
    busy = true;
    setSendState();
    const typingRow = addTyping();

    const payload = [{ role: 'system', content: SYSTEM_PROMPT }].concat(history);
    callAPI(payload).then(function (reply) {
      history.push({ role: 'assistant', content: reply });
      saveHistory(history);
      if (typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
      addMessage('ai', reply);
    }).catch(function (err) {
      if (typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
      addMessage('ai', '抱歉，' + err.message + '。请检查网络后重试，或稍后再来问我。');
    }).finally(function () {
      busy = false;
      setSendState();
    });
  }

  function addSetupRow() {
    const row = el('div', { class: 'xa-msg xa-ai' });
    const avatar = el('div', { class: 'xa-avatar' });
    avatar.textContent = '安';
    const bubble = el('div', { class: 'xa-bubble xa-setup' });
    const keyInput = el('input', { class: 'xa-key-input', type: 'password', placeholder: '粘贴 Ark API Key（ark- 开头）' });
    const saveBtn = el('button', {
      class: 'xa-send xa-key-save',
      text: '保存',
      onclick: function () {
        const k = keyInput.value.trim();
        if (!k) {
          addMessage('ai', 'API Key 不能为空，请粘贴后重试。');
          return;
        }
        try {
          localStorage.setItem('xiaoan_api_key', k);
        } catch (e) {
          addMessage('ai', '浏览器存储失败，无法保存 Key。');
          return;
        }
        if (row.parentNode) row.parentNode.removeChild(row);
        const greeting = '配置成功！请问有什么可以帮您？';
        addMessage('ai', greeting);
        saveHistory([{ role: 'assistant', content: greeting }]);
        if (inputEl) inputEl.focus();
      }
    });
    bubble.appendChild(keyInput);
    bubble.appendChild(saveBtn);
    row.appendChild(avatar);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setSendState() {
    if (!inputEl) return;
    const sendBtn = panelEl && panelEl.querySelector('.xa-send');
    if (sendBtn) sendBtn.disabled = busy;
  }

  function renderQuick() {
    const chips = el('div', { class: 'xa-quick' });
    QUICK_QUESTIONS.forEach(function (q) {
      const chip = el('button', {
        class: 'xa-chip',
        text: q,
        onclick: function () { sendMessage(q); }
      });
      chips.appendChild(chip);
    });
    return chips;
  }

  function open() {
    if (!panelEl) return;
    panelEl.classList.add('xa-open');
    btnEl.classList.add('xa-hidden');
    if (inputEl) setTimeout(function () { inputEl.focus(); }, 150);
  }

  function close() {
    if (!panelEl) return;
    panelEl.classList.remove('xa-open');
    btnEl.classList.remove('xa-hidden');
  }

  function mount(user) {
    currentUser = user;
    chatKey = 'xiaoan_chat_' + user.id;
    if (panelEl) return;

    btnEl = el('button', {
      class: 'xa-fab',
      'aria-label': '打开小安助手',
      title: '小安助手',
      onclick: open
    });
    const fabIcon = el('span', { class: 'xa-fab-icon' });
    fabIcon.textContent = '安';
    const fabText = el('span', { class: 'xa-fab-text' });
    fabText.textContent = '小安助手';
    btnEl.appendChild(fabIcon);
    btnEl.appendChild(fabText);

    const header = el('div', { class: 'xa-header' });
    const hAvatar = el('div', { class: 'xa-havatar' });
    hAvatar.textContent = '安';
    const hInfo = el('div', { class: 'xa-hinfo' },
      el('div', { class: 'xa-hname', text: '小安' }),
      el('div', { class: 'xa-hsub', text: '安置帮教政策助手 · 豆包大模型驱动' })
    );
    const hClose = el('button', { class: 'xa-close', text: '×', 'aria-label': '关闭', onclick: close });
    header.appendChild(hAvatar);
    header.appendChild(hInfo);
    header.appendChild(hClose);

    messagesEl = el('div', { class: 'xa-messages' });

    const footer = el('div', { class: 'xa-footer' });
    inputEl = el('textarea', { class: 'xa-input', rows: '1', placeholder: '请输入您想咨询的问题，回车发送…' });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputEl.value);
      }
    });
    const sendBtn = el('button', { class: 'xa-send xa-send-ico', text: '➤', 'aria-label': '发送', onclick: function () { sendMessage(inputEl.value); } });
    footer.appendChild(inputEl);
    footer.appendChild(sendBtn);

    panelEl = el('div', { class: 'xa-panel' }, header, messagesEl, renderQuick(), footer);

    const isReleased = user.role === 'released';
    const greeting = isReleased
      ? '您好，' + (user.name || '朋友') + '！我是小安 🤖，可以为您解答社会补助、社会保障、就业创业和相关政策问题。有什么想了解的，随时问我。'
      : '您好，' + (user.name || '朋友') + '！我是小安 🤖，可以为您解答政策信息、业务办理流程和平台使用问题。有什么需要帮助的，随时问我。';
    const history = loadHistory();
    if (!getApiKey()) {
      addMessage('ai', '您好，' + (user.name || '朋友') + '！我是小安 🤖。首次使用请先配置 API Key（仅保存在当前浏览器，不会上传）：');
      addSetupRow();
    } else if (!history.length) {
      addMessage('ai', greeting);
      saveHistory([{ role: 'assistant', content: greeting }]);
    } else {
      history.forEach(function (m) { addMessage(m.role, m.content); });
    }

    document.body.appendChild(btnEl);
    document.body.appendChild(panelEl);
  }

  // 供其他模块复用：携带历史直接请求豆包（如 AI 风险评级）
  function request(messages) {
    return callAPI(messages);
  }

  function destroy() {
    if (btnEl && btnEl.parentNode) btnEl.parentNode.removeChild(btnEl);
    if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    btnEl = null; panelEl = null; messagesEl = null; inputEl = null;
    currentUser = null; chatKey = '';
  }

  return { mount: mount, open: open, close: close, send: sendMessage, request: request, destroy: destroy };
})();
