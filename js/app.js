/**
 * 安置帮教综合管理平台 - 主应用
 * 包含路由、认证、各端口页面渲染
 */
const App = (function () {
  const ROLE_CONFIG = {
    police: { name: '公安端口', icon: '👮', org: '公安系统', desc: '上传刑释人员档案信息并传送至监狱系统' },
    prison: { name: '监狱端口', icon: '🔒', org: '监狱系统', desc: '上传服刑档案、发送接送确认提醒至司法系统' },
    judicial: { name: '司法行政部门', icon: '⚖️', org: '司法行政系统', desc: '风险评级、招聘信息管理、政策发布、数据分析' },
    volunteer: { name: '社会志愿者', icon: '🤝', org: '志愿者公共账号', desc: '定期登录为刑释人员疑问进行专业答疑' },
    released: { name: '刑释人员', icon: '👤', org: '刑释人员端', desc: '更新信息、查看政策招聘、上传心理/法律疑问' }
  };

  // 当前视图状态
  let state = { view: 'portal', role: null, page: null };

  // ===== 工具函数 =====
  function $(sel) { return document.querySelector(sel); }
  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'dataset') for (const d in attrs[k]) e.dataset[d] = attrs[k][d];
      else e.setAttribute(k, attrs[k]);
    }
    children.flat().forEach(c => {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(String(c)));
      else e.appendChild(c);
    });
    return e;
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function toast(msg, type) {
    const t = el('div', { class: 'toast' + (type ? ' ' + type : '') }, msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function fmtDate(d) { return d ? String(d).slice(0, 10) : '-'; }

  // 模态框
  function showModal(title, contentNode, opts) {
    opts = opts || {};
    const close = () => m.remove();
    const m = el('div', { class: 'modal' },
      el('div', { class: 'modal-content' + (opts.wide ? ' wide' : '') },
        el('div', { class: 'modal-header' },
          el('h3', {}, title),
          el('button', { class: 'modal-close', onclick: close }, '×')
        ),
        contentNode,
        opts.footer ? el('div', { class: 'modal-footer' }, opts.footer) : null
      )
    );
    m.addEventListener('click', e => { if (e.target === m) close(); });
    document.body.appendChild(m);
    return { close, root: m };
  }
  function confirmModal(msg, onOk) {
    const m = showModal('确认操作', el('p', {}, msg), {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => { m.close(); onOk(); } }, '确认')
      ]
    });
  }

  function emptyState(msg) {
    return el('div', { class: 'empty-state' },
      el('div', { class: 'icon' }, '📭'),
      el('p', {}, msg || '暂无数据')
    );
  }

  // ===== 渲染入口 =====
  function render() {
    const app = $('#app');
    app.innerHTML = '';
    const user = Storage.getCurrentUser();
    if (user) {
      app.appendChild(renderDashboard(user));
    } else if (state.view === 'login') {
      app.appendChild(renderLogin(state.role));
    } else {
      app.appendChild(renderPortal());
    }
  }

  // ===== 登录门户选择页 =====
  function renderPortal() {
    const wrap = el('div', { class: 'portal-page' });
    wrap.appendChild(el('div', { class: 'header' },
      el('h1', {}, '⚖️ 安置帮教综合管理平台'),
      el('p', {}, '多部门协同 · 全流程管理 · AI智能分析'),
      el('p', { class: 'subtitle' }, '请选择登录端口')
    ));
    const grid = el('div', { class: 'portal-grid' });
    Object.keys(ROLE_CONFIG).forEach(role => {
      const cfg = ROLE_CONFIG[role];
      const card = el('div', { class: 'portal-card', onclick: () => { state.view = 'login'; state.role = role; render(); } },
        el('span', { class: 'icon' }, cfg.icon),
        el('h3', {}, cfg.name),
        el('p', {}, cfg.desc)
      );
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    wrap.appendChild(el('div', { class: 'footer-note' },
      '说明：本平台为演示系统，数据存储于本地浏览器。刑释人员默认账号 released1~3，密码均为 123456；其余端口账号同端口名，密码 123456。'
    ));
    return wrap;
  }

  // ===== 登录页 =====
  function renderLogin(role) {
    const cfg = ROLE_CONFIG[role];
    const wrap = el('div', { class: 'portal-page' });
    const box = el('div', { class: 'login-box' },
      el('h2', {}, cfg.icon + ' ' + cfg.name + '登录'),
      el('p', { class: 'login-sub' }, cfg.org),
      el('div', { class: 'hint' },
        role === 'released'
          ? '演示账号：released1 / released2 / released3，密码：123456'
          : '演示账号：' + role + '，密码：123456'
      ),
      el('div', { class: 'form-group' },
        el('label', {}, '用户名'),
        el('input', { id: 'loginUser', placeholder: '请输入用户名', value: role === 'released' ? 'released1' : role })
      ),
      el('div', { class: 'form-group' },
        el('label', {}, '密码'),
        el('input', { id: 'loginPwd', type: 'password', placeholder: '请输入密码', value: '123456' })
      ),
      el('button', { class: 'btn btn-primary btn-block', onclick: doLogin }, '登 录'),
      el('button', { class: 'btn btn-outline btn-block', style: 'margin-top:8px;', onclick: () => { state.view = 'portal'; state.role = null; render(); } }, '← 返回选择端口')
    );
    const modal = el('div', { class: 'login-modal' }, box);
    wrap.appendChild(modal);
    return wrap;
  }

  function doLogin() {
    const username = $('#loginUser').value.trim();
    const password = $('#loginPwd').value.trim();
    if (!username || !password) { toast('请输入用户名和密码', 'error'); return; }
    const user = Storage.login(username, password);
    if (!user) { toast('用户名或密码错误', 'error'); return; }
    if (state.role && user.role !== state.role) {
      toast('该账号不属于此端口', 'error'); return;
    }
    Storage.setCurrentUser(user);
    state.view = 'dashboard';
    state.page = defaultPage(user.role);
    toast('登录成功，欢迎您，' + user.name);
    render();
  }

  function defaultPage(role) {
    return { police: 'dashboard', prison: 'dashboard', judicial: 'dashboard', volunteer: 'questions', released: 'dashboard' }[role];
  }

  function logout() {
    confirmModal('确定要退出登录吗？', () => {
      Storage.setCurrentUser(null);
      state = { view: 'portal', role: null, page: null };
      render();
    });
  }

  // ===== 后台布局 =====
  function renderDashboard(user) {
    const cfg = ROLE_CONFIG[user.role];
    const layout = el('div', { class: 'layout' });

    // 侧边栏
    const navItems = getNavItems(user.role);
    const sidebar = el('div', { class: 'sidebar' },
      el('div', { class: 'brand' },
        el('h2', {}, '⚖️ 安置帮教平台'),
        el('p', {}, cfg.name)
      ),
      el('div', { class: 'nav' },
        ...navItems.map(item =>
          el('div', {
            class: 'nav-item' + (state.page === item.key ? ' active' : ''),
            onclick: () => { state.page = item.key; render(); }
          },
            el('span', { class: 'nav-icon' }, item.icon),
            el('span', {}, item.label)
          )
        )
      ),
      el('div', { class: 'user-box' },
        el('div', { class: 'user-name' }, user.name),
        el('div', { class: 'user-role' }, cfg.org + (user.org ? ' · ' + user.org : '')),
        el('a', { class: 'logout-link', onclick: logout }, '退出登录')
      )
    );
    layout.appendChild(sidebar);

    // 主区域
    const nav = navItems.find(i => i.key === state.page) || navItems[0];
    const main = el('div', { class: 'main-area' },
      el('div', { class: 'topbar' },
        el('h1', {}, nav.icon + ' ' + nav.label),
        el('div', { class: 'topbar-right' }, new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }))
      ),
      el('div', { class: 'content' }, renderPage(user, state.page))
    );
    layout.appendChild(main);
    return layout;
  }

  // 各端口导航
  function getNavItems(role) {
    const common = [
      { key: 'dashboard', icon: '📊', label: '工作台' }
    ];
    const maps = {
      police: [
        ...common,
        { key: 'persons', icon: '📁', label: '人员档案管理' },
        { key: 'upload', icon: '⬆️', label: '上传档案信息' },
        { key: 'logs', icon: '📜', label: '操作日志' }
      ],
      prison: [
        ...common,
        { key: 'records', icon: '📋', label: '服刑档案管理' },
        { key: 'reminders', icon: '🔔', label: '接送确认提醒' },
        { key: 'logs', icon: '📜', label: '操作日志' }
      ],
      judicial: [
        ...common,
        { key: 'persons', icon: '👥', label: '人员管理' },
        { key: 'risk', icon: '⚠️', label: '风险评级' },
        { key: 'reminders', icon: '🔔', label: '接送确认' },
        { key: 'jobs', icon: '💼', label: '招聘信息管理' },
        { key: 'policies', icon: '📢', label: '政策发布' },
        { key: 'analysis', icon: '🤖', label: 'AI数据分析' },
        { key: 'logs', icon: '📜', label: '操作日志' }
      ],
      volunteer: [
        { key: 'questions', icon: '❓', label: '待回复疑问' },
        { key: 'allQuestions', icon: '📋', label: '全部疑问' },
        { key: 'logs', icon: '📜', label: '操作日志' }
      ],
      released: [
        { key: 'dashboard', icon: '🏠', label: '我的主页' },
        { key: 'update', icon: '✏️', label: '更新信息' },
        { key: 'policies', icon: '📢', label: '政策与招聘' },
        { key: 'questions', icon: '❓', label: '我的疑问' },
        { key: 'ask', icon: '➕', label: '提交疑问' },
        { key: 'logs', icon: '📜', label: '操作日志' }
      ]
    };
    return maps[role] || common;
  }

  // ===== 页面路由 =====
  function renderPage(user, page) {
    const renderers = {
      police: {
        dashboard: () => policeDashboard(user),
        persons: () => personsListPage(user, 'police'),
        upload: () => policeUploadPage(user),
        logs: () => logsPage(user)
      },
      prison: {
        dashboard: () => prisonDashboard(user),
        records: () => prisonRecordsPage(user),
        reminders: () => prisonRemindersPage(user),
        logs: () => logsPage(user)
      },
      judicial: {
        dashboard: () => judicialDashboard(user),
        persons: () => personsListPage(user, 'judicial'),
        risk: () => riskPage(user),
        reminders: () => judicialRemindersPage(user),
        jobs: () => jobsManagePage(user),
        policies: () => policiesManagePage(user),
        analysis: () => analysisPage(user),
        logs: () => logsPage(user)
      },
      volunteer: {
        questions: () => volunteerQuestionsPage(user, true),
        allQuestions: () => volunteerQuestionsPage(user, false),
        logs: () => logsPage(user)
      },
      released: {
        dashboard: () => releasedDashboard(user),
        update: () => releasedUpdatePage(user),
        policies: () => releasedPoliciesPage(user),
        questions: () => releasedQuestionsPage(user),
        ask: () => releasedAskPage(user),
        logs: () => logsPage(user)
      }
    };
    try {
      return (renderers[user.role] && renderers[user.role][page]) ? renderers[user.role][page]() : el('div', {}, '页面不存在');
    } catch (e) {
      console.error(e);
      return el('div', { class: 'card' }, el('p', {}, '页面加载出错：' + e.message));
    }
  }

  // ===== 公共：人员详情 =====
  function personDetailModal(personId) {
    const p = Storage.getPerson(personId);
    if (!p) { toast('未找到人员信息', 'error'); return; }
    const updates = Storage.getUpdatesByPerson(personId);
    const questions = Storage.getQuestionsByPerson(personId);
    const body = el('div', {},
      el('ul', { class: 'info-list' },
        li('姓名', p.name), li('性别', p.gender), li('年龄', p.age + '岁'),
        li('身份证号', p.idCard), li('所犯罪行', p.crime), li('刑期', p.sentence),
        li('释放日期', fmtDate(p.releaseDate)), li('狱内表现', p.prisonPerformance),
        li('风险评级', riskTag(p.riskLevel)),
        li('帮教服务', p.serviceType === 'strict' ? tag('严格', 'tag-strict') : tag('灵活', 'tag-flexible')),
        li('居住地', p.address), li('职业情况', p.occupation), li('婚姻状况', p.maritalStatus),
        li('档案创建', fmtDate(p.createdAt))
      ),
      el('h4', { style: 'margin:16px 0 8px;color:var(--primary-dark);' }, '📝 信息更新记录'),
      updates.length ? table(
        ['时间节点', '居住地', '职业', '婚姻', '提交时间'],
        updates.map(u => [u.timePointLabel, u.address, u.occupation, u.maritalStatus, fmtDate(u.submittedAt)])
      ) : emptyState('暂无更新记录'),
      el('h4', { style: 'margin:16px 0 8px;color:var(--primary-dark);' }, '❓ 疑问记录'),
      questions.length ? table(
        ['类别', '标题', '状态', '提交时间'],
        questions.map(q => [q.category, q.title, q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'), fmtDate(q.createdAt)])
      ) : emptyState('暂无疑问')
    );
    showModal('人员档案详情 - ' + p.name, body, { wide: true });
  }

  function li(label, value) {
    return el('li', {}, el('span', { class: 'info-label' }, label), el('span', { class: 'info-value' }, value == null || value === '' ? '-' : value));
  }
  function tag(text, cls) {
    const t = el('span', { class: 'tag ' + cls }, text);
    const span = el('span');
    span.appendChild(t);
    return span;
  }
  function riskTag(level) {
    return level === 'high' ? tag('高风险', 'tag-high') : tag('低风险', 'tag-low');
  }

  function table(headers, rows) {
    const t = el('table', {});
    const thead = el('thead', {});
    const tr = el('tr', {});
    headers.forEach(h => tr.appendChild(el('th', {}, h)));
    thead.appendChild(tr);
    t.appendChild(thead);
    const tbody = el('tbody', {});
    rows.forEach(r => {
      const tr2 = el('tr', {});
      r.forEach(c => {
        const td = el('td', {});
        if (c instanceof Node) td.appendChild(c);
        else if (c === null || c === undefined || c === '') td.appendChild(document.createTextNode('-'));
        else td.appendChild(document.createTextNode(String(c)));
        tr2.appendChild(td);
      });
      tbody.appendChild(tr2);
    });
    t.appendChild(tbody);
    return t;
  }

  // ==================== 公安端口 ====================
  function policeDashboard(user) {
    const persons = Storage.getPersons().filter(p => p.createdBy === user.id);
    const all = Storage.getPersons();
    const frag = el('div', {});
    frag.appendChild(statGrid([
      { value: persons.length, label: '我上传的档案数', cls: '' },
      { value: all.length, label: '系统总档案数', cls: 'success' },
      { value: all.filter(p => p.riskLevel === 'high').length, label: '高风险人数', cls: 'danger' }
    ]));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '最近上传的档案',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'upload'; render(); } }, '⬆️ 上传新档案')
      ),
      persons.length ? table(
        ['姓名', '性别', '所犯罪行', '释放日期', '风险', '操作'],
        persons.slice(0, 8).map(p => [p.name, p.gender, p.crime, fmtDate(p.releaseDate), riskTag(p.riskLevel),
          el('button', { class: 'btn btn-outline btn-sm', onclick: () => personDetailModal(p.id) }, '详情')])
      ) : emptyState('暂无上传的档案')
    ));
    return frag;
  }

  function policeUploadPage(user) {
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '📁 上传刑释人员档案信息（传送至监狱系统）'));
    const note = el('div', { class: 'hint', style: 'background:#eef6ff;border-left-color:var(--primary);' },
      '说明：填写完成后点击"上传并传送至监狱"，档案将同步传送至监狱系统端口。'
    );
    frag.appendChild(note);
    const form = el('div', {},
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '姓名 *'), el('input', { id: 'f_name', placeholder: '请输入姓名' })),
        el('div', { class: 'form-group' }, el('label', {}, '性别 *'),
          el('select', { id: 'f_gender' }, ...['男', '女'].map(s => el('option', { value: s }, s)))),
        el('div', { class: 'form-group' }, el('label', {}, '年龄 *'), el('input', { id: 'f_age', type: 'number', placeholder: '年龄' }))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '身份证号 *'), el('input', { id: 'f_idCard', placeholder: '身份证号' })),
        el('div', { class: 'form-group' }, el('label', {}, '所犯罪行 *'), el('input', { id: 'f_crime', placeholder: '如：盗窃罪' }))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '刑期 *'), el('input', { id: 'f_sentence', placeholder: '如：有期徒刑3年' })),
        el('div', { class: 'form-group' }, el('label', {}, '预计释放日期 *'), el('input', { id: 'f_releaseDate', type: 'date' }))
      ),
      el('div', { class: 'form-group' }, el('label', {}, '狱内表现'), el('textarea', { id: 'f_performance', placeholder: '狱内表现情况描述' })),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '居住地'), el('input', { id: 'f_address', placeholder: '居住地' })),
        el('div', { class: 'form-group' }, el('label', {}, '职业情况'), el('input', { id: 'f_occupation', placeholder: '如：待业' })),
        el('div', { class: 'form-group' }, el('label', {}, '婚姻状况'),
          el('select', { id: 'f_marital' }, ...['未婚', '已婚', '离异', '丧偶'].map(s => el('option', { value: s }, s))))
      ),
      el('button', { class: 'btn btn-primary', onclick: () => submitPoliceForm(user) }, '⬆️ 上传并传送至监狱')
    );
    frag.appendChild(form);
    return frag;
  }

  function submitPoliceForm(user) {
    const name = $('#f_name').value.trim();
    const age = parseInt($('#f_age').value);
    if (!name) { toast('请输入姓名', 'error'); return; }
    if (!age) { toast('请输入有效年龄', 'error'); return; }
    if (!$('#f_crime').value.trim()) { toast('请输入所犯罪行', 'error'); return; }
    if (!$('#f_releaseDate').value) { toast('请选择释放日期', 'error'); return; }
    const person = {
      name,
      gender: $('#f_gender').value,
      age,
      idCard: $('#f_idCard').value.trim(),
      crime: $('#f_crime').value.trim(),
      sentence: $('#f_sentence').value.trim(),
      releaseDate: $('#f_releaseDate').value,
      prisonPerformance: $('#f_performance').value.trim(),
      address: $('#f_address').value.trim(),
      occupation: $('#f_occupation').value.trim() || '待业',
      maritalStatus: $('#f_marital').value,
      riskLevel: null, // 待司法评级
      serviceType: null,
      serviceChoiceMade: false
    };
    Storage.addPerson(person, user);
    toast('档案上传成功，已传送至监狱系统');
    state.page = 'persons';
    render();
  }

  function personsListPage(user, role) {
    const persons = Storage.getPersons();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📁 刑释人员档案列表',
        role === 'police' ? el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'upload'; render(); } }, '⬆️ 上传档案') : null
      ),
      persons.length ? table(
        ['姓名', '性别', '年龄', '所犯罪行', '释放日期', '风险', '帮教服务', '操作'],
        persons.map(p => [p.name, p.gender, p.age, p.crime, fmtDate(p.releaseDate), riskTag(p.riskLevel),
          p.serviceType ? (p.serviceType === 'strict' ? tag('严格', 'tag-strict') : tag('灵活', 'tag-flexible')) : '-',
          el('button', { class: 'btn btn-outline btn-sm', onclick: () => personDetailModal(p.id) }, '详情')])
      ) : emptyState('暂无档案')
    ));
    return frag;
  }

  // ==================== 监狱端口 ====================
  function prisonDashboard(user) {
    const persons = Storage.getPersons();
    const reminders = Storage.getReminders();
    const pending = reminders.filter(r => !r.confirmed);
    const frag = el('div', {});
    frag.appendChild(statGrid([
      { value: persons.length, label: '在册刑释人员', cls: '' },
      { value: reminders.length, label: '已发送提醒', cls: 'success' },
      { value: pending.length, label: '待司法确认', cls: 'danger' }
    ]));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🔔 近期待办接送确认提醒',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'reminders'; render(); } }, '前往发送')
      ),
      reminders.length ? table(
        ['人员', '释放日期', '提醒阶段', '状态', '创建时间'],
        reminders.slice(0, 8).map(r => [r.personName, fmtDate(r.releaseDate), stageLabel(r.stage),
          r.confirmed ? tag('已确认', 'tag-confirmed') : tag('待确认', 'tag-unconfirmed'), fmtDate(r.createdAt)])
      ) : emptyState('暂无提醒')
    ));
    return frag;
  }

  function stageLabel(s) {
    return { '30day': '出狱前30天', '15day': '出狱前15天', '7day': '出狱前7天' }[s] || s;
  }

  function prisonRecordsPage(user) {
    const persons = Storage.getPersons();
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '📋 服刑档案管理（上传服刑期间档案信息传送至司法系统）'));
    frag.appendChild(el('div', { class: 'hint', style: 'background:#eef6ff;border-left-color:var(--primary);margin-bottom:16px;' },
      '说明：点击"上传/更新服刑档案"可补充服刑期间档案信息，保存后将同步传送至司法行政部门系统。'
    ));
    frag.appendChild(table(
      ['姓名', '所犯罪行', '刑期', '释放日期', '狱内表现', '操作'],
      persons.map(p => [
        p.name, p.crime, p.sentence, fmtDate(p.releaseDate), p.prisonPerformance || '-',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => prisonUploadRecord(user, p) }, '上传/更新服刑档案')
      ])
    ));
    return frag;
  }

  function prisonUploadRecord(user, p) {
    const body = el('div', {},
      el('div', { class: 'hint' }, '上传/更新服刑期间档案信息，保存后将自动传送至司法行政部门系统。'),
      el('div', { class: 'form-group' }, el('label', {}, '姓名'), el('input', { value: p.name, disabled: true })),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '所犯罪行'), el('input', { id: 'r_crime', value: p.crime || '' })),
        el('div', { class: 'form-group' }, el('label', {}, '刑期'), el('input', { id: 'r_sentence', value: p.sentence || '' }))
      ),
      el('div', { class: 'form-group' }, el('label', {}, '狱内表现 *'), el('textarea', { id: 'r_performance' }, p.prisonPerformance || '')),
      el('div', { class: 'form-group' }, el('label', {}, '预计释放日期'), el('input', { id: 'r_releaseDate', type: 'date', value: p.releaseDate || '' }))
    );
    const m = showModal('上传服刑档案 - ' + p.name, body, null);
    m.root.querySelector('.modal-content').appendChild(el('div', { class: 'modal-footer' },
      el('button', { class: 'btn btn-outline', onclick: m.close }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const perf = $('#r_performance').value.trim();
        if (!perf) { toast('请填写狱内表现', 'error'); return; }
        Storage.updatePerson(p.id, {
          crime: $('#r_crime').value.trim(),
          sentence: $('#r_sentence').value.trim(),
          prisonPerformance: perf,
          releaseDate: $('#r_releaseDate').value
        }, user);
        toast('服刑档案已保存并传送至司法系统');
        m.close();
        render();
      } }, '保存并传送至司法')
    ));
  }

  function prisonRemindersPage(user) {
    const persons = Storage.getPersons();
    const reminders = Storage.getReminders();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🔔 发送接送确认提醒',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => sendReminderForm(user, persons) }, '➕ 发送新提醒')
      ),
      el('div', { class: 'hint' }, '在出狱前特定时候（30天/15天/7天）向司法行政部门发送"接送确认提醒"，由司法系统线上点击确认。'),
      reminders.length ? table(
        ['人员', '释放日期', '提醒阶段', '提醒内容', '状态', '创建时间'],
        reminders.map(r => [r.personName, fmtDate(r.releaseDate), stageLabel(r.stage), r.message,
          r.confirmed ? tag('已确认', 'tag-confirmed') : tag('待确认', 'tag-unconfirmed'), fmtDate(r.createdAt)])
      ) : emptyState('暂无提醒记录')
    ));
    return frag;
  }

  function sendReminderForm(user, persons) {
    const body = el('div', {},
      el('div', { class: 'form-group' }, el('label', {}, '选择刑释人员 *'),
        el('select', { id: 'rm_person' },
          ...persons.map(p => el('option', { value: p.id }, p.name + '（释放：' + fmtDate(p.releaseDate) + '）'))
        )
      ),
      el('div', { class: 'form-group' }, el('label', {}, '提醒阶段 *'),
        el('select', { id: 'rm_stage' },
          ...[['30day', '出狱前30天'], ['15day', '出狱前15天'], ['7day', '出狱前7天']].map(s => el('option', { value: s[0] }, s[1]))
        )
      ),
      el('div', { class: 'form-group' }, el('label', {}, '提醒内容'),
        el('textarea', { id: 'rm_msg', placeholder: '系统将自动生成提醒内容' })
      )
    );
    const m = showModal('发送接送确认提醒', body, null);
    m.root.querySelector('.modal-content').appendChild(el('div', { class: 'modal-footer' },
      el('button', { class: 'btn btn-outline', onclick: m.close }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const pid = $('#rm_person').value;
        const p = persons.find(x => x.id === pid);
        const stage = $('#rm_stage').value;
        let msg = $('#rm_msg').value.trim();
        if (!msg) msg = p.name + '将于' + p.releaseDate + '刑满释放，请司法行政部门确认接送安排。';
        Storage.addReminder({
          personId: p.id, personName: p.name, releaseDate: p.releaseDate,
          stage, message: msg
        }, user);
        toast('提醒已发送至司法行政部门');
        m.close();
        render();
      } }, '发送至司法系统')
    ));
  }

  // ==================== 司法行政部门端口 ====================
  function judicialDashboard(user) {
    const persons = Storage.getPersons();
    const pendingReminders = Storage.getPendingReminders();
    const pendingQuestions = Storage.getPendingQuestions();
    const frag = el('div', {});
    frag.appendChild(statGrid([
      { value: persons.length, label: '在册人员', cls: '' },
      { value: persons.filter(p => p.riskLevel === 'high').length, label: '高风险', cls: 'danger' },
      { value: persons.filter(p => p.riskLevel === 'low').length, label: '低风险', cls: 'success' },
      { value: pendingReminders.length, label: '待确认接送', cls: 'warning' }
    ]));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🔔 待确认接送提醒',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'reminders'; render(); } }, '前往处理')
      ),
      pendingReminders.length ? table(
        ['人员', '释放日期', '阶段', '操作'],
        pendingReminders.slice(0, 6).map(r => [r.personName, fmtDate(r.releaseDate), stageLabel(r.stage),
          el('button', { class: 'btn btn-success btn-sm', onclick: () => {
            Storage.confirmReminder(r.id, user);
            toast('已确认接送安排');
            render();
          } }, '✓ 点击确认')])
      ) : emptyState('暂无待确认提醒')
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🤖 待AI风险评级建议',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'risk'; render(); } }, '前往评级')
      ),
      persons.filter(p => !p.riskLevel).length
        ? table(['人员', '所犯罪行', '当前评级', 'AI建议'], persons.filter(p => !p.riskLevel).slice(0, 6).map(p => {
            const s = AI.riskSuggestion(p);
            return [p.name, p.crime, tag('未评级', 'tag-pending'), tag(s.levelText, 'tag-' + s.level)];
          }))
        : emptyState('所有人员均已评级')
    ));
    return frag;
  }

  function judicialRemindersPage(user) {
    const reminders = Storage.getReminders();
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '🔔 接送确认提醒处理'));
    frag.appendChild(el('div', { class: 'hint' }, '监狱系统发送的接送确认提醒，请逐一点击确认。'));
    frag.appendChild(reminders.length ? table(
      ['人员', '释放日期', '阶段', '提醒内容', '状态', '操作'],
      reminders.map(r => [r.personName, fmtDate(r.releaseDate), stageLabel(r.stage), r.message,
        r.confirmed ? tag('已确认', 'tag-confirmed') : tag('待确认', 'tag-unconfirmed'),
        r.confirmed ? el('span', { style: 'color:#999;' }, r.confirmedAt || '-') :
          el('button', { class: 'btn btn-success btn-sm', onclick: () => {
            Storage.confirmReminder(r.id, user); toast('已确认'); render();
          } }, '✓ 点击确认')])
    ) : emptyState('暂无提醒'));
    return frag;
  }

  function riskPage(user) {
    const persons = Storage.getPersons();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🤖 AI风险评级建议',
        el('button', { class: 'btn btn-outline btn-sm', onclick: () => showAIRiskAll(user) }, '一键查看全部AI建议')
      ),
      el('div', { class: 'hint' }, '系统结合所犯罪行、狱内表现、个人年龄等，由AI给出风险评级建议，工作人员可参考后确定最终评级。')
    ));
    persons.forEach(p => {
      const s = AI.riskSuggestion(p);
      const card = el('div', { class: 'card' },
        el('div', { class: 'card-title' }, p.name + '（' + p.crime + '）',
          el('button', { class: 'btn btn-outline btn-sm', onclick: () => personDetailModal(p.id) }, '查看详情')
        ),
        el('div', { class: 'row' },
          el('div', { class: 'form-group' }, el('label', {}, '当前评级'), el('div', {}, riskTag(p.riskLevel || 'medium'))),
          el('div', { class: 'form-group' }, el('label', {}, 'AI建议评级'), el('div', {}, tag(s.levelText, 'tag-' + s.level))),
          el('div', { class: 'form-group' }, el('label', {}, 'AI风险评分'), el('div', {}, s.score + ' / 100'))
        ),
        el('div', { class: 'risk-meter' },
          el('div', { class: 'pointer', style: 'left:' + s.score + '%;' })
        ),
        el('div', { style: 'margin:12px 0;' },
          el('strong', {}, '影响因素：'),
          ...s.factors.map(f => el('div', { style: 'font-size:13px;color:#555;margin-top:3px;' },
            '· ' + f.factor + '（' + f.value + '）：' + f.impact + ' — ' + f.desc))
        ),
        el('div', { class: 'hint' }, '💡 ' + s.advice),
        el('div', { class: 'modal-footer' },
          el('button', { class: 'btn btn-success btn-sm', onclick: () => { Storage.setRiskLevel(p.id, 'low', user); toast('已评定为低风险'); render(); } }, '评定为低风险'),
          el('button', { class: 'btn btn-danger btn-sm', onclick: () => { Storage.setRiskLevel(p.id, 'high', user); toast('已评定为高风险'); render(); } }, '评定为高风险')
        )
      );
      frag.appendChild(card);
    });
    return frag;
  }

  function showAIRiskAll(user) {
    const list = AI.riskSuggestionsAll();
    const body = el('div', {},
      el('div', { class: 'hint' }, 'AI对所有在册人员的风险评级建议汇总（仅供参考）。'),
      table(['姓名', '所犯罪行', '年龄', '狱内表现', 'AI评分', 'AI建议', '当前评级'],
        list.map(item => [item.person.name, item.person.crime, item.person.age + '岁',
          item.person.prisonPerformance || '-',
          item.suggestion.score,
          tag(item.suggestion.levelText, 'tag-' + item.suggestion.level),
          riskTag(item.person.riskLevel || 'medium')]))
    );
    showModal('AI风险评级建议汇总', body, { wide: true });
  }

  function jobsManagePage(user) {
    const jobs = Storage.getJobs();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '💼 企业招聘信息管理',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => jobForm(user) }, '➕ 发布招聘信息')
      ),
      el('div', { class: 'hint' }, '筛选并上传由人社部门发送的企业招聘信息，供刑释人员查看。'),
      jobs.length ? table(
        ['企业', '职位', '薪资', '地点', '要求', '发布日期', '操作'],
        jobs.map(j => [j.company, j.position, j.salary, j.location, j.requirement, fmtDate(j.publishDate),
          el('button', { class: 'btn btn-danger btn-sm', onclick: () => confirmModal('确定删除该招聘信息？', () => { Storage.deleteJob(j.id, user); toast('已删除'); render(); }) }, '删除')])
      ) : emptyState('暂无招聘信息')
    ));
    return frag;
  }

  function jobForm(user) {
    const body = el('div', {},
      el('div', { class: 'form-group' }, el('label', {}, '企业名称 *'), el('input', { id: 'j_company' })),
      el('div', { class: 'form-group' }, el('label', {}, '职位 *'), el('input', { id: 'j_position' })),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '薪资'), el('input', { id: 'j_salary', placeholder: '如：4000-6000元/月' })),
        el('div', { class: 'form-group' }, el('label', {}, '工作地点'), el('input', { id: 'j_location' }))
      ),
      el('div', { class: 'form-group' }, el('label', {}, '要求'), el('textarea', { id: 'j_requirement' }))
    );
    const m = showModal('发布招聘信息', body, null);
    m.root.querySelector('.modal-content').appendChild(el('div', { class: 'modal-footer' },
      el('button', { class: 'btn btn-outline', onclick: m.close }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        if (!$('#j_company').value.trim() || !$('#j_position').value.trim()) { toast('请填写企业名称和职位', 'error'); return; }
        Storage.addJob({
          company: $('#j_company').value.trim(), position: $('#j_position').value.trim(),
          salary: $('#j_salary').value.trim(), location: $('#j_location').value.trim(),
          requirement: $('#j_requirement').value.trim()
        }, user);
        toast('招聘信息已发布');
        m.close(); render();
      } }, '发布')
    ));
  }

  function policiesManagePage(user) {
    const policies = Storage.getPolicies();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📢 政策信息发布',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => policyForm(user) }, '➕ 发布政策')
      ),
      policies.length ? policies.map(p => el('div', { class: 'card', style: 'box-shadow:none;border:1px solid var(--border);' },
        el('div', { class: 'card-title' }, p.title, el('span', { style: 'font-size:12px;color:var(--text-light);' }, fmtDate(p.publishDate))),
        el('p', { style: 'color:#555;white-space:pre-wrap;' }, p.content)
      )) : emptyState('暂无政策')
    ));
    return frag;
  }

  function policyForm(user) {
    const body = el('div', {},
      el('div', { class: 'form-group' }, el('label', {}, '政策标题 *'), el('input', { id: 'p_title' })),
      el('div', { class: 'form-group' }, el('label', {}, '政策内容 *'), el('textarea', { id: 'p_content', style: 'min-height:140px;' }))
    );
    const m = showModal('发布政策信息', body, null);
    m.root.querySelector('.modal-content').appendChild(el('div', { class: 'modal-footer' },
      el('button', { class: 'btn btn-outline', onclick: m.close }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        if (!$('#p_title').value.trim() || !$('#p_content').value.trim()) { toast('请填写标题和内容', 'error'); return; }
        Storage.addPolicy({ title: $('#p_title').value.trim(), content: $('#p_content').value.trim() }, user);
        toast('政策已发布'); m.close(); render();
      } }, '发布')
    ));
  }

  function analysisPage(user) {
    const stats = AI.analyzeStats();
    const frag = el('div', {});
    frag.appendChild(statGrid([
      { value: stats.total + '人', label: '在册总人数', cls: '' },
      { value: stats.employmentRate + '%', label: '就业率', cls: 'success' },
      { value: stats.migrationRate + '%', label: '异地居住率', cls: 'warning' },
      { value: stats.updateCompletion[0] ? stats.updateCompletion[0].rate + '%' : '0%', label: '1个月信息更新率', cls: '' }
    ]));

    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📊 人口结构与就业分析'),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' },
          el('label', {}, '婚姻状况分布'),
          barChart([
            { label: '已婚', value: stats.married, color: 'var(--success)' },
            { label: '未婚', value: stats.single, color: 'var(--primary)' },
            { label: '离异', value: stats.divorced, color: 'var(--warning)' }
          ])
        )
      )
    ));

    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📈 各时间节点信息更新完成率'),
      ...stats.updateCompletion.map(tp => el('div', { class: 'form-group' },
        el('label', {}, tp.label + '（完成 ' + tp.completed + '/' + stats.total + '）'),
        el('div', { class: 'progress-bar' }, el('div', { style: 'width:' + tp.rate + '%;' }))
      ))
    ));

    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🤖 AI数据分析报告'),
      el('div', { class: 'hint' }, generateAIReport(stats)),
      el('div', { style: 'margin-top:12px;' },
        el('strong', {}, '帮教服务类型分布：'),
        el('div', { style: 'margin-top:6px;' },
          ...barChart([
            { label: '灵活帮教', value: stats.flexibleCount, color: 'var(--primary)' },
            { label: '严格帮教', value: stats.strictCount, color: 'var(--danger)' }
          ]).childNodes
        )
      )
    ));

    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '⚠️ AI风险评级建议汇总',
        el('button', { class: 'btn btn-outline btn-sm', onclick: () => showAIRiskAll(user) }, '查看详情')
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '高风险'), el('div', { class: 'stat-value', style: 'color:var(--danger);font-size:24px;' }, stats.highRisk + '人')),
        el('div', { class: 'form-group' }, el('label', {}, '低风险'), el('div', { class: 'stat-value', style: 'color:var(--success);font-size:24px;' }, stats.lowRisk + '人'))
      )
    ));
    return frag;
  }

  function generateAIReport(stats) {
    const tips = [];
    if (stats.employmentRate >= 60) tips.push('就业率良好，说明安置帮教就业帮扶成效显著。');
    else if (stats.employmentRate >= 30) tips.push('就业率一般，建议加强与人社部门合作，拓宽就业渠道。');
    else tips.push('就业率偏低，需重点加强就业培训与岗位推荐。');
    if (stats.migrationRate > 30) tips.push('异地居住率较高，建议加强跨区域信息协查与跟踪。');
    if (stats.updateCompletion[0] && stats.updateCompletion[0].rate < 50) tips.push('1个月信息更新完成率偏低，建议督促刑释人员按时更新信息。');
    if (stats.highRisk > stats.lowRisk) tips.push('高风险人员占比较高，建议增加走访频次与心理辅导资源投入。');
    return '💡 ' + tips.join(' ');
  }

  function barChart(items) {
    const max = Math.max(...items.map(i => i.value), 1);
    return el('div', {}, ...items.map(item =>
      el('div', { style: 'margin-bottom:8px;' },
        el('div', { style: 'display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;' },
          el('span', {}, item.label), el('span', {}, item.value + '人')
        ),
        el('div', { class: 'progress-bar' }, el('div', { style: 'width:' + (item.value / max * 100) + '%;background:' + item.color + ';' }))
      )
    ));
  }

  function statGrid(items) {
    return el('div', { class: 'stat-grid' },
      ...items.map(i => el('div', { class: 'stat-card ' + (i.cls || '') },
        el('div', { class: 'stat-value' }, i.value),
        el('div', { class: 'stat-label' }, i.label)
      ))
    );
  }

  // ==================== 刑释人员端口 ====================
  function releasedDashboard(user) {
    const p = Storage.getPerson(user.personId);
    if (!p) return el('div', { class: 'card' }, el('p', {}, '未找到您的档案信息'));
    const updates = Storage.getUpdatesByPerson(p.id);
    const frag = el('div', {});

    // 风险评级后一个月内未选择服务 -> 弹窗选择
    if (p.riskLevel === 'low' && !p.serviceChoiceMade) {
      setTimeout(() => showServiceChoice(user, p), 300);
    }

    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🏠 我的主页'),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '姓名'), el('div', {}, p.name)),
        el('div', { class: 'form-group' }, el('label', {}, '风险评级'), el('div', {}, riskTag(p.riskLevel || 'medium'))),
        el('div', { class: 'form-group' }, el('label', {}, '帮教服务'), el('div', {},
          p.serviceType ? (p.serviceType === 'strict' ? tag('严格帮教', 'tag-strict') : tag('灵活帮教', 'tag-flexible')) : tag('未选择', 'tag-pending')))
      )
    ));

    if (p.riskLevel === 'high') {
      frag.appendChild(el('div', { class: 'card', style: 'border-left:4px solid var(--danger);' },
        el('div', { class: 'card-title' }, '⚠️ 重要提示'),
        el('p', { style: 'color:#666;' }, '您被评定为高风险人员，系统已为您默认选择要求更加严格、强制程度更高的安置帮教服务。请在以下特定时间点登录系统更新个人信息。')
      ));
    }

    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📅 信息更新时间节点'),
      el('div', { class: 'hint' }, '请在以下时间点登录系统更新个人信息（居住地、职业、婚姻等）：'),
      ...[
        { key: '1month', label: '刑满释放后1个月' },
        { key: '3month', label: '刑满释放后3个月' },
        { key: '6month', label: '刑满释放后6个月' },
        { key: '1year', label: '刑满释放后1年' },
        { key: '3year', label: '刑满释放后3年' },
        { key: '5year', label: '刑满释放后5年' }
      ].map(tp => {
        const done = updates.find(u => u.timePoint === tp.key);
        return el('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);' },
          el('span', {}, tp.label),
          done ? tag('已完成', 'tag-replied') : el('button', { class: 'btn btn-outline btn-sm', onclick: () => { state.page = 'update'; render(); } }, '去更新')
        );
      })
    ));
    return frag;
  }

  function showServiceChoice(user, p) {
    const body = el('div', { class: 'service-choice-box' },
      el('h3', {}, '📋 安置帮教服务选择'),
      el('p', {}, '经风险评级，您属于低风险人员。您可以选择对正常生活干扰更小的灵活帮教服务（仅需在特定时间点更新信息），也可以选择强制程度更高的帮教服务。'),
      el('p', { style: 'font-weight:600;' }, '请问您是否愿意接受强制程度更高的安置帮教服务？'),
      el('div', { class: 'choice-buttons' },
        el('button', { class: 'choice-btn yes', onclick: () => {
          Storage.chooseService(p.id, 'strict', user);
          toast('已选择严格帮教服务');
          modal.close(); render();
        } }, '是'),
        el('button', { class: 'choice-btn no', onclick: () => {
          Storage.chooseService(p.id, 'flexible', user);
          toast('已选择灵活帮教服务');
          modal.close(); render();
        } }, '否')
      )
    );
    const modal = showModal('安置帮教服务选择（限1个月内）', body);
  }

  function releasedUpdatePage(user) {
    const p = Storage.getPerson(user.personId);
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '✏️ 更新个人信息'));
    frag.appendChild(el('div', { class: 'hint' }, '在特定时间点（1个月、3个月、6个月、1年、3年、5年）登录系统更新个人信息。'));
    frag.appendChild(el('div', { class: 'row' },
      el('div', { class: 'form-group' }, el('label', {}, '选择时间节点 *'),
        el('select', { id: 'u_tp' },
          ...[['1month', '刑满释放后1个月'], ['3month', '刑满释放后3个月'], ['6month', '刑满释放后6个月'], ['1year', '刑满释放后1年'], ['3year', '刑满释放后3年'], ['5year', '刑满释放后5年']].map(s => el('option', { value: s[0] }, s[1]))
        )
      ),
      el('div', { class: 'form-group' }, el('label', {}, '居住地'), el('input', { id: 'u_address', value: p.address || '' }))
    ));
    frag.appendChild(el('div', { class: 'row' },
      el('div', { class: 'form-group' }, el('label', {}, '职业情况'), el('input', { id: 'u_occupation', value: p.occupation || '' })),
      el('div', { class: 'form-group' }, el('label', {}, '婚姻状况'),
        el('select', { id: 'u_marital' }, ...['未婚', '已婚', '离异', '丧偶'].map(s => el('option', { value: s, selected: p.maritalStatus === s }, s))))
    ));
    frag.appendChild(el('button', { class: 'btn btn-primary', onclick: () => {
      const tp = $('#u_tp').value;
      const tpMap = { '1month': '刑满释放后1个月', '3month': '刑满释放后3个月', '6month': '刑满释放后6个月', '1year': '刑满释放后1年', '3year': '刑满释放后3年', '5year': '刑满释放后5年' };
      Storage.addUpdate({
        personId: p.id, timePoint: tp, timePointLabel: tpMap[tp],
        address: $('#u_address').value.trim(), occupation: $('#u_occupation').value.trim(),
        maritalStatus: $('#u_marital').value
      }, user);
      toast('信息更新成功');
      state.page = 'dashboard'; render();
    } }, '提交更新'));
    return frag;
  }

  function releasedPoliciesPage(user) {
    const policies = Storage.getPolicies();
    const jobs = Storage.getJobs();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📢 最新政策调整'),
      policies.length ? policies.map(p => el('div', { class: 'card', style: 'box-shadow:none;border:1px solid var(--border);' },
        el('div', { class: 'card-title' }, p.title, el('span', { style: 'font-size:12px;color:var(--text-light);' }, fmtDate(p.publishDate))),
        el('p', { style: 'color:#555;white-space:pre-wrap;' }, p.content)
      )) : emptyState('暂无政策')
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '💼 企业招聘信息'),
      jobs.length ? table(['企业', '职位', '薪资', '地点', '要求', '发布日期'],
        jobs.map(j => [j.company, j.position, j.salary, j.location, j.requirement, fmtDate(j.publishDate)]))
        : emptyState('暂无招聘信息')
    ));
    return frag;
  }

  function releasedQuestionsPage(user) {
    const p = Storage.getPerson(user.personId);
    const qs = Storage.getQuestionsByPerson(p.id);
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '❓ 我的疑问',
      el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'ask'; render(); } }, '➕ 提交新疑问')
    ));
    frag.appendChild(qs.length ? table(
      ['类别', '标题', '内容', '状态', '回复', '提交时间'],
      qs.map(q => [q.category, q.title, q.content, q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'),
        q.reply || '-', fmtDate(q.createdAt)])
    ) : emptyState('您还没有提交过疑问'));
    return frag;
  }

  function releasedAskPage(user) {
    const p = Storage.getPerson(user.personId);
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '➕ 提交心理/法律疑问'));
    frag.appendChild(el('div', { class: 'hint' }, '您可以上传心理或法律方面的疑问，专业志愿者将在一周之内回复。'));
    frag.appendChild(el('div', { class: 'form-group' }, el('label', {}, '类别 *'),
      el('select', { id: 'q_cat' }, ...[['心理', '心理'], ['法律', '法律']].map(s => el('option', { value: s[0] }, s[1])))
    ));
    frag.appendChild(el('div', { class: 'form-group' }, el('label', {}, '标题 *'), el('input', { id: 'q_title', placeholder: '请输入疑问标题' })));
    frag.appendChild(el('div', { class: 'form-group' }, el('label', {}, '详细内容 *'), el('textarea', { id: 'q_content', style: 'min-height:120px;' })));
    frag.appendChild(el('button', { class: 'btn btn-primary', onclick: () => {
      if (!$('#q_title').value.trim() || !$('#q_content').value.trim()) { toast('请填写标题和内容', 'error'); return; }
      Storage.addQuestion({
        personId: p.id, category: $('#q_cat').value,
        title: $('#q_title').value.trim(), content: $('#q_content').value.trim()
      }, user);
      toast('疑问已提交，志愿者将在一周内回复');
      state.page = 'questions'; render();
    } }, '提交疑问'));
    return frag;
  }

  // ==================== 社会志愿者端口 ====================
  function volunteerQuestionsPage(user, onlyPending) {
    let qs = Storage.getQuestions();
    if (onlyPending) qs = qs.filter(q => q.status === 'pending');
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, onlyPending ? '❓ 待回复疑问' : '📋 全部疑问'));
    frag.appendChild(el('div', { class: 'hint' }, '志愿者每周定期登录，对刑释人员的疑问进行专业答疑，并在一周之内回复。'));
    frag.appendChild(qs.length ? table(
      ['人员', '类别', '标题', '内容', '状态', '提交时间', '操作'],
      qs.map(q => [q.personName, q.category, q.title, q.content.length > 20 ? q.content.slice(0, 20) + '...' : q.content,
        q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'),
        fmtDate(q.createdAt),
        q.status === 'pending' ? el('button', { class: 'btn btn-primary btn-sm', onclick: () => replyForm(user, q) }, '回复') :
          el('button', { class: 'btn btn-outline btn-sm', onclick: () => viewReply(q) }, '查看回复')])
    ) : emptyState('暂无' + (onlyPending ? '待回复' : '') + '疑问'));
    return frag;
  }

  function viewReply(q) {
    const body = el('div', {},
      el('ul', { class: 'info-list' },
        li('提问人', q.personName), li('类别', q.category), li('标题', q.title),
        li('内容', q.content), li('提交时间', fmtDate(q.createdAt)),
        li('回复人', q.replierName || '-'), li('回复时间', q.repliedAt || '-'),
        li('回复内容', q.reply || '-')
      )
    );
    showModal('疑问详情', body, { wide: true });
  }

  function replyForm(user, q) {
    const body = el('div', {},
      el('ul', { class: 'info-list' },
        li('提问人', q.personName), li('类别', q.category), li('标题', q.title), li('内容', q.content)
      ),
      el('div', { class: 'form-group' }, el('label', {}, '回复人身份 *'),
        el('input', { id: 'rep_name', placeholder: '如：心理咨询师 张医生 / 法律顾问 李律师' })
      ),
      el('div', { class: 'form-group' }, el('label', {}, '回复内容 *'),
        el('textarea', { id: 'rep_content', style: 'min-height:120px;', placeholder: '请输入专业回复内容' })
      )
    );
    const m = showModal('回复疑问 - ' + q.title, body, { wide: true });
    m.root.querySelector('.modal-content').appendChild(el('div', { class: 'modal-footer' },
      el('button', { class: 'btn btn-outline', onclick: m.close }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        if (!$('#rep_name').value.trim() || !$('#rep_content').value.trim()) { toast('请填写回复人身份和内容', 'error'); return; }
        Storage.replyQuestion(q.id, $('#rep_content').value.trim(), $('#rep_name').value.trim(), user);
        toast('回复已提交'); m.close(); render();
      } }, '提交回复')
    ));
  }

  // ==================== 操作日志 ====================
  function logsPage(user) {
    const logs = Storage.getLogs();
    const frag = el('div', { class: 'card' });
    frag.appendChild(el('div', { class: 'card-title' }, '📜 操作日志'));
    frag.appendChild(logs.length ? table(
      ['时间', '操作人', '操作内容'],
      logs.map(l => [l.time, l.user, l.action])
    ) : emptyState('暂无操作日志'));
    return frag;
  }

  // ===== 初始化 =====
  function init() {
    render();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
