/**
 * 安置帮教综合管理平台 - 主应用
 */
const App = (function () {
  const R = {
    police: { name: '公安端口', icon: '👮', org: '公安系统' },
    prison: { name: '监狱端口', icon: '🔒', org: '监狱系统' },
    judicial: { name: '司法行政部门', icon: '⚖️', org: '司法行政系统' },
    volunteer: { name: '社会志愿者', icon: '🤝', org: '志愿者公共账号' },
    hrss: { name: '人社部门', icon: '🏢', org: '人力资源和社会保障系统' },
    medicare: { name: '医疗保障部门', icon: '🏥', org: '医疗保障系统' },
    civil: { name: '民政部门', icon: '🏠', org: '民政系统' },
    released: { name: '刑释人员', icon: '👤', org: '刑释人员端' }
  };
  const RD = {
    police: '上传刑释人员档案信息并传送至监狱系统',
    prison: '上传服刑档案、发送接送确认提醒至司法系统',
    judicial: '风险评级、招聘信息管理、政策发布、数据分析',
    volunteer: '定期登录为刑释人员疑问进行专业答疑',
    hrss: '就业与培训信息推送、劳动监察举报处理、就业创业与社会保障业务',
    medicare: '医疗保障政策发布与医保业务处理',
    civil: '低保/特困等社会救助政策发布与申请处理',
    released: '更新信息、查看政策招聘、上传心理/法律疑问'
  };

  const REGIONS = [
    '江西省·南昌市', '江西省·赣州市', '江西省·九江市', '江西省·上饶市', '江西省·宜春市',
    '江西省·吉安市', '江西省·抚州市', '江西省·景德镇市', '江西省·萍乡市', '江西省·新余市', '江西省·鹰潭市',
    '广东省·深圳市', '广东省·广州市', '广东省·东莞市', '广东省·佛山市', '广东省·珠海市',
    '浙江省·杭州市', '浙江省·宁波市', '浙江省·温州市', '江苏省·南京市', '福建省·厦门市',
    '上海市·上海市', '北京市·北京市', '四川省·成都市', '湖南省·长沙市', '湖北省·武汉市', '山东省·青岛市'
  ];

  const DEPT_NAMES = { u_judicial: '司法行政', u_hrss: '人社', u_medicare: '医保', u_civil: '民政', u_police: '公安', u_prison: '监狱' };

  let state = { view: 'portal', role: null, page: null };

  function $(s) { return document.querySelector(s); }
  function el(tag, attrs, ...ch) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'selected') { if (attrs[k]) e.selected = true; }
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'dataset') for (const d in attrs[k]) e.dataset[d] = attrs[k][d];
      else e.setAttribute(k, attrs[k]);
    }
    ch.flat().forEach(c => {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(String(c)));
      else e.appendChild(c);
    });
    return e;
  }
  function toast(msg, type) {
    const t = el('div', { class: 'toast' + (type ? ' ' + type : ''), role: 'status', 'aria-live': 'polite' }, msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function fmtDate(d) { return d ? String(d).slice(0, 10) : '-'; }

  function showModal(title, body, opts) {
    opts = opts || {};
    let m;
    const close = () => m.remove();
    m = el('div', { class: 'modal' },
      el('div', { class: 'modal-content' + (opts.wide ? ' wide' : '') },
        el('div', { class: 'modal-header' },
          el('h3', {}, title),
          el('button', { class: 'modal-close', onclick: close }, '×')
        ),
        body,
        opts.footer ? el('div', { class: 'modal-footer' }, opts.footer) : null
      )
    );
    m.addEventListener('click', e => { if (e.target === m) close(); });
    const onKeydown = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeydown);
    const remove = m.remove.bind(m);
    m.remove = () => { document.removeEventListener('keydown', onKeydown); remove(); };
    document.body.appendChild(m);
    return { close, root: m };
  }
  function confirmModal(msg, onOk) {
    let modal;
    modal = showModal('确认操作', el('p', {}, msg), {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => modal.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => { onOk(); modal.close(); } }, '确认')
      ]
    });
  }

  function emptyState(msg) {
    return el('div', { class: 'empty-state' },
      el('div', { class: 'icon' }, '📭'),
      el('p', {}, msg || '暂无数据')
    );
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
    if (level === 'high') return tag('高风险', 'tag-high');
    if (level === 'low') return tag('低风险', 'tag-low');
    return tag('未评级', 'tag-pending');
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

  function statGrid(items) {
    return el('div', { class: 'stat-grid' },
      ...items.map(i => el('div', { class: 'stat-card ' + (i.cls || '') },
        el('div', { class: 'stat-value' }, i.value),
        el('div', { class: 'stat-label' }, i.label)
      ))
    );
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

  function stageLabel(s) {
    return { '30day': '出狱前30天', '15day': '出狱前15天', '7day': '出狱前7天' }[s] || s;
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

  // ===== 渲染入口 =====
  function render() {
    const app = $('#app');
    app.innerHTML = '';
    const user = Storage.getCurrentUser();
    if (user && user.role === 'released') setTimeout(() => XiaoAn.mount(user), 0);
    else XiaoAn.destroy();
    if (user) {
      app.appendChild(renderDashboard(user));
    } else if (state.view === 'login') {
      app.appendChild(renderLogin(state.role));
    } else {
      app.appendChild(renderPortal());
    }
  }

  // ===== 门户选择页 =====
  function portalCard(role, cfg, order, highlighted) {
    const cls = 'portal-card' + (highlighted ? ' highlighted' : '');
    return el('div', {
      class: cls,
      onclick: () => { state.view = 'login'; state.role = role; render(); },
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.view = 'login'; state.role = role; render(); } },
      role: 'button', tabindex: '0', 'aria-label': '进入' + cfg.name,
      style: 'animation-delay:' + (order * 0.12 + 0.3) + 's;'
    },
      highlighted ? el('div', { class: 'highlight-badge' }, '核心中枢') : null,
      el('div', { class: 'card-glow' }),
      el('span', { class: 'icon' }, cfg.icon),
      el('h3', {}, cfg.name),
      el('div', { class: 'role-tag' }, cfg.org),
      el('p', {}, RD[role]),
      el('div', { class: 'card-footer' },
        el('span', { class: 'arrow' }, '进入端口'),
        el('span', { class: 'arrow-icon' }, '→')
      )
    );
  }

  function renderPortal() {
    const wrap = el('div', { class: 'portal-page' });
    wrap.appendChild(el('div', { class: 'bg-grid' }));
    wrap.appendChild(el('div', { class: 'header' },
      el('div', { class: 'logo-row' },
        el('div', { class: 'logo-badge' }, '⚖️'),
        el('div', {},
          el('div', { class: 'platform-name' }, '安置帮教综合管理平台'),
          el('div', { class: 'platform-sub' }, 'REHABILITATION ASSISTANCE SYSTEM · 智慧司法'),
          el('div', { class: 'platform-tags' },
            el('span', {}, '✓ 五方协同'),
            el('span', {}, '✓ AI智能风控'),
            el('span', {}, '✓ 小安AI助手'),
            el('span', {}, '✓ 全程可追溯')
          )
        )
      ),
      el('div', { class: 'slogan-wrap' },
        el('h1', { class: 'main-slogan' }, '让每一次回归，都被温柔以待'),
        el('div', { class: 'slogan-line' },
          el('div', { class: 'line-dot' }),
          el('span', {}, '欢迎回来，请选择登录端口'),
          el('div', { class: 'line-dot' })
        )
      )
    ));

    // ===== 滚动公告栏 =====
    wrap.appendChild(el('div', { class: 'notice-bar' },
      el('div', { class: 'notice-tag' }, '📢 公告'),
      el('div', { class: 'notice-scroll' },
        el('div', { class: 'notice-track' },
          el('span', { class: 'notice-item' }, '📌 司法部发布最新《安置帮教工作办法》，自2026年1月1日起施行'),
          el('span', { class: 'notice-divider' }, '◆'),
          el('span', { class: 'notice-item' }, '📋 人社部联合发布2026年第一季度刑释人员专项招聘计划'),
          el('span', { class: 'notice-divider' }, '◆'),
          el('span', { class: 'notice-item' }, '🤖 刑释人员端「小安」AI助手已上线，可咨询补助、社保与政策问题'),
          el('span', { class: 'notice-divider' }, '◆'),
          el('span', { class: 'notice-item' }, '⚠️ 请各端口工作人员及时更新在册人员动态信息'),
          el('span', { class: 'notice-divider' }, '◆')
        )
      )
    ));

    // ===== 数据统计概览栏 =====
    wrap.appendChild(el('div', { class: 'stats-bar' },
      el('div', { class: 'stat-item' },
        el('div', { class: 'stat-num', 'data-target': '7945' }, '0'),
        el('div', { class: 'stat-label' }, '累计帮教人数'),
        el('div', { class: 'stat-unit' }, '人')
      ),
      el('div', { class: 'stat-divider' }),
      el('div', { class: 'stat-item' },
        el('div', { class: 'stat-num', 'data-target': '342' }, '0'),
        el('div', { class: 'stat-label' }, '在册志愿者'),
        el('div', { class: 'stat-unit' }, '人')
      ),
      el('div', { class: 'stat-divider' }),
      el('div', { class: 'stat-item' },
        el('div', { class: 'stat-num', 'data-target': '87', 'data-suffix': '%' }, '0'),
        el('div', { class: 'stat-label' }, '就业安置率'),
        el('div', { class: 'stat-unit' })
      ),
      el('div', { class: 'stat-divider' }),
      el('div', { class: 'stat-item' },
        el('div', { class: 'stat-num', 'data-target': '25' }, '0'),
        el('div', { class: 'stat-label' }, '政策文件库'),
        el('div', { class: 'stat-unit' }, '篇')
      )
    ));

    // 五方端口布局：上2（公安+监狱）- 中1（司法行政，居中突出）- 下2（志愿者+刑释人员）
    const flowRow = el('div', { class: 'flow-row' },
      el('div', { class: 'flow-label left' }, '📥 档案接入层'),
      el('div', { class: 'flow-label right' }, '📤 管理执行层')
    );
    const topRow = el('div', { class: 'portal-row top' });
    ['police', 'prison'].forEach((role, i) => {
      const cfg = R[role];
      topRow.appendChild(portalCard(role, cfg, i + 1));
    });
    const centerRow = el('div', { class: 'portal-row center' });
    centerRow.appendChild(el('div', { class: 'flow-connector left' }));
    centerRow.appendChild(portalCard('judicial', R['judicial'], 3, true));
    centerRow.appendChild(el('div', { class: 'flow-connector right' }));

    const deptRow = el('div', { class: 'portal-row three' });
    ['hrss', 'medicare', 'civil'].forEach((role, i) => {
      const cfg = R[role];
      deptRow.appendChild(portalCard(role, cfg, i + 4));
    });

    const bottomRow = el('div', { class: 'portal-row bottom' });
    ['volunteer', 'released'].forEach((role, i) => {
      const cfg = R[role];
      bottomRow.appendChild(portalCard(role, cfg, i + 7));
    });

    const grid = el('div', { class: 'portal-layout' }, topRow, centerRow, deptRow, bottomRow);
    wrap.appendChild(grid);

    // ===== 业务流程图 =====
    wrap.appendChild(el('div', { class: 'section-title' },
      el('span', { class: 'title-bar' }), '业务流程', el('span', { class: 'title-bar' })
    ));
    wrap.appendChild(el('div', { class: 'flow-chart' },
      el('div', { class: 'flow-node' },
        el('div', { class: 'flow-icon' }, '👮'), el('div', { class: 'flow-text' }, '公安'), el('div', { class: 'flow-desc' }, '上传档案')
      ),
      el('div', { class: 'flow-arrow' }, el('div', { class: 'arrow-line' }), el('div', { class: 'arrow-head' })),
      el('div', { class: 'flow-node' },
        el('div', { class: 'flow-icon' }, '🔒'), el('div', { class: 'flow-text' }, '监狱'), el('div', { class: 'flow-desc' }, '服刑档案')
      ),
      el('div', { class: 'flow-arrow' }, el('div', { class: 'arrow-line' }), el('div', { class: 'arrow-head' })),
      el('div', { class: 'flow-node highlight' },
        el('div', { class: 'flow-icon' }, '⚖️'), el('div', { class: 'flow-text' }, '司法行政'), el('div', { class: 'flow-desc' }, '风险评级')
      ),
      el('div', { class: 'flow-arrow' }, el('div', { class: 'arrow-line' }), el('div', { class: 'arrow-head' })),
      el('div', { class: 'flow-node' },
        el('div', { class: 'flow-icon' }, '👤'), el('div', { class: 'flow-text' }, '刑释人员'), el('div', { class: 'flow-desc' }, '定期更新')
      ),
      el('div', { class: 'flow-arrow' }, el('div', { class: 'arrow-line' }), el('div', { class: 'arrow-head' })),
      el('div', { class: 'flow-node' },
        el('div', { class: 'flow-icon' }, '🤝'), el('div', { class: 'flow-text' }, '志愿者'), el('div', { class: 'flow-desc' }, '答疑帮扶')
      )
    ));


    wrap.appendChild(el('div', { class: 'footer-note' },
      el('div', { style: 'margin-bottom:6px;' }, '✨ 提示：本平台为演示系统，数据存储于本地浏览器'),
      el('div', {}, '刑释人员账号：released1 / released2 / released3，密码：123456 ｜ 其余端口账号同端口名，密码：123456')
    ));

    // 数字滚动动画
    setTimeout(() => {
      document.querySelectorAll('.stat-num').forEach(el => {
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        let cur = 0;
        const step = Math.ceil(target / 40);
        const tick = () => {
          cur += step;
          if (cur >= target) { cur = target; el.textContent = cur + suffix; return; }
          el.textContent = cur + suffix;
          requestAnimationFrame(tick);
        };
        tick();
      });
    }, 400);

    return wrap;
  }

  // ===== 门户页普法详情弹窗 =====
  function renderLawDetail(caseObj) {
    const body = el('div', { class: 'law-popup' },
      el('div', { class: 'law-popup-header' },
        el('h3', {}, '⚖️ 每日普法 · 真实案例'),
        el('div', { class: 'law-case-date' }, '警钟长鸣 · 守法于心')
      ),
      el('div', { class: 'law-case-meta' },
        el('span', {}, '⚖️ ' + caseObj.category),
        el('span', {}, '📍 ' + caseObj.location),
        el('span', {}, '🗓 ' + caseObj.date)
      ),
      el('div', { class: 'popup-case-title' },
        el('h2', {}, caseObj.title)
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '📌 基本案情'),
        el('p', {}, caseObj.caseContent)
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '👨‍⚖️ 裁判结果'),
        el('p', {}, caseObj.courtResult)
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '📜 法律依据'),
        el('p', { class: 'pre-wrap' }, caseObj.lawBasis)
      ),
      el('div', { class: 'law-tip' }, '💡 ' + caseObj.lesson)
    );
    showModal('📖 ' + caseObj.category, body, { wide: true });
  }

  // ===== 登录页 =====
  function renderLogin(role) {
    const cfg = R[role];
    const wrap = el('div', { class: 'portal-page' });
    const presetUser = role === 'released' ? 'released1' : role;
    const hint = role === 'released'
      ? '演示账号：released1 / released2 / released3，密码：123456'
      : '演示账号：' + role + '，密码：123456';
    const box = el('div', { class: 'login-box' },
      el('div', { class: 'login-icon' }, cfg.icon),
      el('h2', {}, cfg.name + '登录'),
      el('p', { class: 'login-sub' }, cfg.org),
      el('div', { class: 'hint' }, hint),
      el('div', { class: 'form-group' },
        el('label', {}, '用户名'),
        el('input', { id: 'loginUser', placeholder: '请输入用户名', value: presetUser })
      ),
      el('div', { class: 'form-group' },
        el('label', {}, '密码'),
        el('input', { id: 'loginPwd', type: 'password', placeholder: '请输入密码', value: '123456' })
      ),
      el('button', { class: 'btn btn-primary btn-block', onclick: doLogin }, '登 录'),
      el('button', { class: 'btn btn-outline btn-block', style: 'margin-top:8px;', onclick: () => { state.view = 'portal'; state.role = null; render(); } }, '← 返回选择端口')
    );
    wrap.appendChild(el('div', { class: 'login-modal' }, box));
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
    // 仅刑释人员端在登录后自动弹出今日普法（每天每个用户仅弹一次）
    if (user.role === 'released') setTimeout(() => showDailyLawOnce(user), 600);
  }

  function defaultPage(role) {
    return { police: 'dashboard', prison: 'dashboard', judicial: 'dashboard', volunteer: 'questions', hrss: 'dashboard', medicare: 'dashboard', civil: 'dashboard', released: 'dashboard' }[role];
  }

  function logout() {
    if (confirm('确定要退出登录吗？')) {
      Storage.setCurrentUser(null);
      state = { view: 'portal', role: null, page: null };
      render();
    }
  }

  // ===== 后台布局 =====
  function renderDashboard(user) {
    const cfg = R[user.role];
    const navItems = getNavItems(user.role);
    const layout = el('div', { class: 'layout' },
      el('div', { class: 'sidebar' },
        el('div', { class: 'brand' }, el('h2', {}, '⚖️ 安置帮教平台'), el('p', {}, cfg.name)),
        el('div', { class: 'nav' },
          ...navItems.map(item =>
            el('div', { class: 'nav-item' + (state.page === item.key ? ' active' : ''), onclick: () => { if (item.key === 'xiaoan') { XiaoAn.open(); } else { state.page = item.key; render(); } } },
              el('span', { class: 'nav-icon' }, item.icon), el('span', {}, item.label)
            )
          )
        ),
        el('div', { class: 'user-box' },
          el('div', { class: 'user-name' }, user.name),
          el('div', { class: 'user-role' }, cfg.org),
          el('a', { class: 'logout-link', onclick: logout }, '退出登录')
        )
      ),
      el('div', { class: 'main-area' },
        el('div', { class: 'topbar' },
          el('h1', {}, (navItems.find(i => i.key === state.page) || navItems[0]).icon + ' ' + (navItems.find(i => i.key === state.page) || navItems[0]).label),
          el('div', { class: 'topbar-right' }, el('span', { class: 'online-dot' }), ' ' + user.name + '，您好 · ' + new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }))
        ),
        el('div', { class: 'content' }, renderPage(user, state.page))
      )
    );
    return layout;
  }

  function getNavItems(role) {
    const law = { key: 'law', icon: '⚖️', label: '每日普法' };
    const common = [{ key: 'dashboard', icon: '📊', label: '工作台' }];
    const maps = {
      police: [...common, { key: 'persons', icon: '📁', label: '人员档案管理' }, { key: 'upload', icon: '⬆️', label: '上传档案信息' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      prison: [...common, { key: 'records', icon: '📋', label: '服刑档案管理' }, { key: 'reminders', icon: '🔔', label: '接送确认提醒' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      judicial: [{ key: 'dashboard', icon: '📊', label: '工作台' }, { key: 'macro', icon: '🗺️', label: '宏观大屏' }, { key: 'persons', icon: '👥', label: '人员管理' }, { key: 'risk', icon: '⚠️', label: '风险评级' }, { key: 'reminders', icon: '🔔', label: '接送确认' }, { key: 'shared', icon: '🔗', label: '部门信息共享' }, { key: 'policies', icon: '📢', label: '政策发布' }, { key: 'analysis', icon: '🤖', label: 'AI数据分析' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      volunteer: [{ key: 'questions', icon: '❓', label: '待回复疑问' }, { key: 'allQuestions', icon: '📋', label: '全部疑问' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      hrss: [...common, { key: 'jobs', icon: '💼', label: '就业信息推送' }, { key: 'trainings', icon: '🎓', label: '培训信息发布' }, { key: 'reports', icon: '📢', label: '劳动监察举报处理' }, { key: 'policies', icon: '📢', label: '人社政策发布' }, { key: 'services', icon: '🧭', label: '业务办理' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      medicare: [...common, { key: 'policies', icon: '📢', label: '医保政策发布' }, { key: 'services', icon: '🧭', label: '业务办理' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      civil: [...common, { key: 'policies', icon: '📢', label: '民政政策发布' }, { key: 'services', icon: '🧭', label: '业务办理' }, { key: 'logs', icon: '📜', label: '操作日志' }],
      released: [{ key: 'dashboard', icon: '🏠', label: '我的主页' }, { key: 'update', icon: '✏️', label: '更新信息' }, { key: 'policies', icon: '📢', label: '政策·招聘·培训' }, { key: 'report', icon: '📢', label: '违法举报' }, { key: 'help', icon: '🧭', label: '办事服务' }, { key: 'questions', icon: '❓', label: '我的疑问' }, { key: 'ask', icon: '➕', label: '提交疑问' }, { key: 'xiaoan', icon: '🤖', label: '小安助手' }, { key: 'laws', icon: '📚', label: '相关法律' }, law, { key: 'logs', icon: '📜', label: '操作日志' }]
    };
    return maps[role] || common;
  }

  function renderPage(user, page) {
    const pages = {
      police: { dashboard: policeDashboard, persons: () => personsListPage(user, 'police'), upload: () => policeUploadPage(user), logs: () => logsPage(user) },
      prison: { dashboard: prisonDashboard, records: prisonRecordsPage, reminders: prisonRemindersPage, logs: () => logsPage(user) },
      judicial: { dashboard: judicialDashboard, persons: () => personsListPage(user, 'judicial'), risk: riskPage, reminders: judicialRemindersPage, shared: judicialSharedPage, policies: policiesManagePage, analysis: analysisPage, macro: macroPage, logs: () => logsPage(user) },
      volunteer: { questions: () => volunteerQuestionsPage(user, true), allQuestions: () => volunteerQuestionsPage(user, false), logs: () => logsPage(user) },
      hrss: { dashboard: () => orgDashboard(user), jobs: jobsManagePage, trainings: trainingsManagePage, reports: reportsManagePage, policies: policiesManagePage, services: () => servicesLinksPage(user, 'hrss'), logs: () => logsPage(user) },
      medicare: { dashboard: () => orgDashboard(user), policies: policiesManagePage, services: () => servicesLinksPage(user, 'medicare'), logs: () => logsPage(user) },
      civil: { dashboard: () => orgDashboard(user), policies: policiesManagePage, services: () => servicesLinksPage(user, 'civil'), logs: () => logsPage(user) },
      released: { dashboard: releasedDashboard, update: releasedUpdatePage, policies: releasedPoliciesPage, report: releasedReportPage, help: releasedHelpPage, questions: releasedQuestionsPage, ask: releasedAskPage, xiaoan: () => el('div', {}), laws: releasedLawsPage, law: lawPage, logs: () => logsPage(user) }
    };
    try {
      const fn = pages[user.role] && pages[user.role][page];
      if (!fn) return el('div', {}, '页面不存在');
      const pageContent = fn(user);
      return page === 'dashboard' ? dashboardShell(user, pageContent) : pageContent;
    } catch (e) {
      return el('div', { class: 'card' }, el('p', {}, '页面加载出错：' + e.message));
    }
  }

  function dashboardShell(user, pageContent) {
    const actions = {
      police: [{ icon: '⬆️', label: '上传档案', page: 'upload' }, { icon: '📁', label: '查看档案', page: 'persons' }],
      prison: [{ icon: '📋', label: '更新服刑档案', page: 'records' }, { icon: '🔔', label: '处理接送提醒', page: 'reminders' }],
      judicial: [{ icon: '⚠️', label: '开展风险评级', page: 'risk' }, { icon: '🗺️', label: '宏观大屏', page: 'macro' }],
      released: [{ icon: '✏️', label: '更新我的信息', page: 'update' }, { icon: '❓', label: '提交疑问', page: 'ask' }],
      hrss: [{ icon: '💼', label: '推送就业信息', page: 'jobs' }, { icon: '📢', label: '处理劳动监察举报', page: 'reports' }],
      medicare: [{ icon: '📢', label: '发布医保政策', page: 'policies' }, { icon: '🧭', label: '业务办理', page: 'services' }],
      civil: [{ icon: '📢', label: '发布民政政策', page: 'policies' }, { icon: '🧭', label: '业务办理', page: 'services' }]
    }[user.role] || [];
    const messages = { police: '及时完善档案信息，为后续衔接提供可靠依据。', prison: '关注临释人员动态，确保交接环节顺畅完成。', judicial: '聚焦待办事项，为回归社会提供持续支持。', released: '保持信息更新，主动获取帮扶与就业资源。', hrss: '及时推送就业与培训信息，跟进劳动监察举报处理。', medicare: '发布医保政策，跟进医保业务办理。', civil: '发布低保/特困等救助政策，跟进救助申请。' };
    return el('div', {},
      el('section', { class: 'workspace-hero' },
        el('div', { class: 'workspace-copy' }, el('span', { class: 'eyebrow' }, '今日工作概览'), el('h2', {}, '欢迎回来，' + user.name), el('p', {}, messages[user.role] || '从左侧导航进入所需服务。')),
        el('div', { class: 'quick-actions' }, ...actions.map(action => el('button', { class: 'quick-action', onclick: () => { state.page = action.page; render(); } }, el('span', {}, action.icon), el('span', {}, action.label))))
      ), pageContent
    );
  }

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
      el('h4', { class: 'section-subtitle' }, '📝 信息更新记录'),
      updates.length ? table(
        ['时间节点', '居住地', '职业', '婚姻', '提交时间'],
        updates.map(u => [u.timePointLabel, u.address, u.occupation, u.maritalStatus, fmtDate(u.submittedAt)])
      ) : emptyState('暂无更新记录'),
      el('h4', { class: 'section-subtitle' }, '❓ 疑问记录'),
      questions.length ? table(
        ['类别', '标题', '状态', '提交时间'],
        questions.map(q => [q.category, q.title, q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'), fmtDate(q.createdAt)])
      ) : emptyState('暂无疑问')
    );
    showModal('人员档案详情 - ' + p.name, body, { wide: true });
  }

  // ===== 公安端口 =====
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
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📁 上传刑释人员档案信息（传送至监狱系统）'),
      el('div', { class: 'hint' }, '说明：填写完成后点击"上传并传送至监狱"，档案将同步传送至监狱系统端口。'),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '姓名 *'), el('input', { id: 'f_name', placeholder: '请输入姓名' })),
        el('div', { class: 'form-group' }, el('label', {}, '性别 *'), el('select', { id: 'f_gender' }, el('option', { value: '男' }, '男'), el('option', { value: '女' }, '女'))),
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
          el('select', { id: 'f_marital' }, el('option', { value: '未婚' }, '未婚'), el('option', { value: '已婚' }, '已婚'), el('option', { value: '离异' }, '离异'), el('option', { value: '丧偶' }, '丧偶')))
      ),
      el('button', { class: 'btn btn-primary', onclick: () => submitPoliceForm(user) }, '⬆️ 上传并传送至监狱')
    );
    return frag;
  }

  function submitPoliceForm(user) {
    const name = $('#f_name').value.trim();
    const age = parseInt($('#f_age').value);
    if (!name) { toast('请输入姓名', 'error'); return; }
    if (!age) { toast('请输入有效年龄', 'error'); return; }
    if (!$('#f_crime').value.trim()) { toast('请输入所犯罪行', 'error'); return; }
    if (!$('#f_releaseDate').value) { toast('请选择释放日期', 'error'); return; }
    Storage.addPerson({
      name, gender: $('#f_gender').value, age,
      idCard: $('#f_idCard').value.trim(),
      crime: $('#f_crime').value.trim(),
      sentence: $('#f_sentence').value.trim(),
      releaseDate: $('#f_releaseDate').value,
      prisonPerformance: $('#f_performance').value.trim(),
      address: $('#f_address').value.trim(),
      occupation: $('#f_occupation').value.trim() || '待业',
      maritalStatus: $('#f_marital').value,
      riskLevel: null, serviceType: null, serviceChoiceMade: false
    }, user);
    toast('档案上传成功，已传送至监狱系统');
    state.page = 'persons';
    render();
  }

  // 分页条（1 2 3 4 5 … N 样式）
  function pagerEl(page, totalPages, onChange) {
    const wrap = el('div', { class: 'pager' });
    const add = (label, target, active, disabled) => {
      const b = el('button', { class: 'pager-btn' + (active ? ' active' : ''), onclick: () => { if (target !== page) onChange(target); } }, label);
      if (disabled) b.disabled = true;
      wrap.appendChild(b);
    };
    add('‹ 上一页', page - 1, false, page <= 1);
    const nums = [...new Set([1, 2, 3, 4, 5, totalPages, page])].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    let prev = 0;
    nums.forEach(n => {
      if (prev && n - prev > 1) wrap.appendChild(el('span', { class: 'pager-dots' }, '…'));
      add(String(n), n, n === page, false);
      prev = n;
    });
    add('下一页 ›', page + 1, false, page >= totalPages);
    return wrap;
  }

  // 分页档案列表（20条/页；前5页完整信息，其余页仅登记姓名）
  function paginatedPersonsCard(user, persons, opts) {
    const PAGE_SIZE = 20;
    const totalPages = Math.max(1, Math.ceil(persons.length / PAGE_SIZE));
    const holder = el('div', {});
    let page = 1;
    const draw = () => {
      holder.innerHTML = '';
      const start = (page - 1) * PAGE_SIZE;
      const slice = persons.slice(start, start + PAGE_SIZE);
      holder.appendChild(el('div', { class: 'hint' }, opts.hint(persons.length, page, totalPages)));
      holder.appendChild(table(opts.headers, slice.map(p => opts.row(p))));
      if (totalPages > 1) holder.appendChild(pagerEl(page, totalPages, p => { page = p; draw(); }));
    };
    draw();
    return holder;
  }

  function personsListPage(user, role) {
    const persons = Storage.getPersons();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📁 刑释人员档案列表',
        role === 'police' ? el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'upload'; render(); } }, '⬆️ 上传档案') : null
      ),
      persons.length ? paginatedPersonsCard(user, persons, {
        headers: ['姓名', '性别', '年龄', '所犯罪行', '释放日期', '风险', '帮教服务', '操作'],
        hint: (n, page, totalPages) => '共 ' + n + ' 名在册人员，第 ' + page + ' / ' + totalPages + ' 页。',
        row: (p) => [p.name, p.gender, p.age, p.crime, fmtDate(p.releaseDate), riskTag(p.riskLevel),
          p.serviceType ? (p.serviceType === 'strict' ? tag('严格', 'tag-strict') : tag('灵活', 'tag-flexible')) : '-',
          el('button', { class: 'btn btn-outline btn-sm', onclick: () => personDetailModal(p.id) }, '详情')]
      }) : emptyState('暂无档案')
    );
    return frag;
  }

  // ===== 监狱端口 =====
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

  function prisonRecordsPage(user) {
    const persons = Storage.getPersons();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📋 服刑档案管理'),
      paginatedPersonsCard(user, persons, {
        headers: ['姓名', '所犯罪行', '刑期', '释放日期', '狱内表现', '操作'],
        hint: (n, page, totalPages) => '上传/更新服刑期间档案信息，保存后将同步传送至司法行政部门系统。共 ' + n + ' 名在册人员，第 ' + page + ' / ' + totalPages + ' 页。',
        row: (p) => [
          p.name, p.crime, p.sentence, fmtDate(p.releaseDate), p.prisonPerformance || '-',
          el('button', { class: 'btn btn-primary btn-sm', onclick: () => prisonUploadRecord(user, p) }, '上传/更新服刑档案')
        ]
      })
    );
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
    const m = showModal('上传服刑档案 - ' + p.name, body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
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
          m.close(); render();
        } }, '保存并传送至司法')
      ]
    });
  }

  function prisonRemindersPage(user) {
    const persons = Storage.getPersons();
    const reminders = Storage.getReminders();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🔔 发送接送确认提醒',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => sendReminderForm(user, persons) }, '➕ 发送新提醒')
      ),
      el('div', { class: 'hint' }, '在出狱前特定时候（30天/15天/7天）向司法行政部门发送"接送确认提醒"。'),
      reminders.length ? table(
        ['人员', '释放日期', '提醒阶段', '提醒内容', '状态', '创建时间'],
        reminders.map(r => [r.personName, fmtDate(r.releaseDate), stageLabel(r.stage), r.message,
          r.confirmed ? tag('已确认', 'tag-confirmed') : tag('待确认', 'tag-unconfirmed'), fmtDate(r.createdAt)])
      ) : emptyState('暂无提醒记录')
    );
    return frag;
  }

  function sendReminderForm(user, persons) {
    const body = el('div', {},
      el('div', { class: 'form-group' }, el('label', {}, '选择刑释人员 *'),
        el('select', { id: 'rm_person' }, ...persons.map(p => el('option', { value: p.id }, p.name + '（释放：' + fmtDate(p.releaseDate) + '）')))
      ),
      el('div', { class: 'form-group' }, el('label', {}, '提醒阶段 *'),
        el('select', { id: 'rm_stage' },
          el('option', { value: '30day' }, '出狱前30天'),
          el('option', { value: '15day' }, '出狱前15天'),
          el('option', { value: '7day' }, '出狱前7天'))
      ),
      el('div', { class: 'form-group' }, el('label', {}, '提醒内容'),
        el('textarea', { id: 'rm_msg', placeholder: '系统将自动生成提醒内容' }))
    );
    const m = showModal('发送接送确认提醒', body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => {
          const pid = $('#rm_person').value;
          const p = persons.find(x => x.id === pid);
          const stage = $('#rm_stage').value;
          let msg = $('#rm_msg').value.trim();
          if (!msg) msg = p.name + '将于' + p.releaseDate + '刑满释放，请司法行政部门确认接送安排。';
          Storage.addReminder({ personId: p.id, personName: p.name, releaseDate: p.releaseDate, stage, message: msg }, user);
          toast('提醒已发送至司法行政部门');
          m.close(); render();
        } }, '发送至司法系统')
      ]
    });
  }

  // ===== 司法行政部门 =====
  function judicialDashboard(user) {
    const persons = Storage.getPersons();
    const pendingReminders = Storage.getPendingReminders();
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
          el('button', { class: 'btn btn-success btn-sm', onclick: () => { Storage.confirmReminder(r.id, user); toast('已确认接送安排'); render(); } }, '✓ 点击确认')])
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
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🔔 接送确认提醒处理'),
      el('div', { class: 'hint' }, '监狱系统发送的接送确认提醒，请逐一点击确认。'),
      reminders.length ? table(
        ['人员', '释放日期', '阶段', '提醒内容', '状态', '操作'],
        reminders.map(r => [r.personName, fmtDate(r.releaseDate), stageLabel(r.stage), r.message,
          r.confirmed ? tag('已确认', 'tag-confirmed') : tag('待确认', 'tag-unconfirmed'),
          r.confirmed ? el('span', { style: 'color:#999;' }, r.confirmedAt || '-') :
            el('button', { class: 'btn btn-success btn-sm', onclick: () => { Storage.confirmReminder(r.id, user); toast('已确认'); render(); } }, '✓ 点击确认')])
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
      el('div', { class: 'hint' }, '系统结合所犯罪行、狱内表现、个人年龄等，由AI给出风险评级建议。共 ' + persons.length + ' 名在册人员，列表仅展示前 30 人。')
    ));
    persons.slice(0, 30).forEach(p => {
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
        el('div', { class: 'risk-meter' }, el('div', { class: 'pointer', style: 'left:' + s.score + '%;' })),
        el('div', { style: 'margin:12px 0;' },
          el('strong', {}, '影响因素：'),
          ...s.factors.map(f => el('div', { style: 'font-size:13px;color:#555;margin-top:3px;' },
            '· ' + f.factor + '（' + f.value + '）：' + f.impact + ' — ' + f.desc))
        ),
        el('div', { class: 'hint' }, '💡 ' + s.advice),
        el('div', { class: 'modal-footer' },
          el('button', { class: 'btn btn-primary btn-sm', onclick: () => aiRiskModal(p, user) }, '🤖 豆包AI深度评级'),
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
          item.person.prisonPerformance || '-', item.suggestion.score,
          tag(item.suggestion.levelText, 'tag-' + item.suggestion.level),
          riskTag(item.person.riskLevel || 'medium')]))
    );
    showModal('AI风险评级建议汇总', body, { wide: true });
  }

  function jobsManagePage(user) {
    const jobs = Storage.getJobs();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '💼 企业招聘信息管理',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => jobForm(user) }, '➕ 发布招聘信息')
      ),
      el('div', { class: 'hint' }, '人社部门推送企业招聘信息，刑释人员端可实时查看。'),
      jobs.length ? table(
        ['企业', '职位', '薪资', '地点', '要求', '发布日期', '操作'],
        jobs.map(j => [j.company, j.position, j.salary, j.location, j.requirement, fmtDate(j.publishDate),
          el('button', { class: 'btn btn-danger btn-sm', onclick: () => { if (confirm('确定删除该招聘信息？')) { Storage.deleteJob(j.id, user); toast('已删除'); render(); } } }, '删除')])
      ) : emptyState('暂无招聘信息')
    );
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
    const m = showModal('发布招聘信息', body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => {
          if (!$('#j_company').value.trim() || !$('#j_position').value.trim()) { toast('请填写企业名称和职位', 'error'); return; }
          Storage.addJob({ company: $('#j_company').value.trim(), position: $('#j_position').value.trim(),
            salary: $('#j_salary').value.trim(), location: $('#j_location').value.trim(),
            requirement: $('#j_requirement').value.trim() }, user);
          toast('招聘信息已发布'); m.close(); render();
        } }, '发布')
      ]
    });
  }

  // 政策卡片：点击整张卡片展开/收起原文
  function renderPolicyCard(pol) {
    const arrow = el('span', { class: 'policy-arrow' }, '▾');
    const detail = el('div', { class: 'policy-detail' }, pol.content || '暂无详细内容');
    detail.style.display = 'none';
    const card = el('div', { class: 'card card-plain policy-card' },
      el('div', { class: 'card-title' }, pol.title,
        el('span', { class: 'publish-date' }, (DEPT_NAMES[pol.createdBy] || pol.createdBy || '') + ' · ' + (pol.region || '全国') + ' · ' + fmtDate(pol.publishDate))),
      pol.source ? el('div', { class: 'policy-source' }, '📄 ' + pol.source) : null,
      el('div', { class: 'policy-hint' }, '点击卡片查看原文', arrow),
      detail
    );
    card._expanded = false;
    card._setExpanded = (open) => {
      card._expanded = !!open;
      detail.style.display = card._expanded ? 'block' : 'none';
      card.classList.toggle('expanded', card._expanded);
      arrow.textContent = card._expanded ? '▴' : '▾';
    };
    card.addEventListener('click', () => card._setExpanded(!card._expanded));
    return card;
  }

  function policiesManagePage(user) {
    const all = Storage.getPolicies();
    const policies = all.filter(p => p.createdBy === user.id);
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📢 政策信息发布',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => policyForm(user) }, '➕ 发布政策')
      ),
      el('div', { class: 'hint' }, '仅展示本部门（' + (DEPT_NAMES[user.id] || R[user.role].name) + '）发布的政策，共 ' + policies.length + ' 条。'),
      policies.length ? policies.map(p => renderPolicyCard(p)) : emptyState('暂无政策')
    );
    return frag;
  }

  function policyForm(user) {
    const body = el('div', {},
      el('div', { class: 'form-group' }, el('label', {}, '政策标题 *'), el('input', { id: 'p_title' })),
      el('div', { class: 'form-group' }, el('label', {}, '政策内容 *'), el('textarea', { id: 'p_content', class: 'h-140' }))
    );
    const m = showModal('发布政策信息', body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => {
          if (!$('#p_title').value.trim() || !$('#p_content').value.trim()) { toast('请填写标题和内容', 'error'); return; }
          Storage.addPolicy({ title: $('#p_title').value.trim(), content: $('#p_content').value.trim() }, user);
          toast('政策已发布'); m.close(); render();
        } }, '发布')
      ]
    });
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
      el('div', { class: 'form-group' }, el('label', {}, '婚姻状况分布'),
        barChart([
          { label: '已婚', value: stats.married, color: 'var(--success)' },
          { label: '未婚', value: stats.single, color: 'var(--primary)' },
          { label: '离异', value: stats.divorced, color: 'var(--warning)' }
        ]))
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
      el('div', { style: 'margin-top:12px;' }, el('strong', {}, '帮教服务类型分布：')),
      barChart([
        { label: '灵活帮教', value: stats.flexibleCount, color: 'var(--primary)' },
        { label: '严格帮教', value: stats.strictCount, color: 'var(--danger)' }
      ])
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '⚠️ AI风险评级建议汇总',
        el('button', { class: 'btn btn-outline btn-sm', onclick: () => showAIRiskAll(user) }, '查看详情')
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '高风险'), el('div', { class: 'stat-inline danger' }, stats.highRisk + '人')),
        el('div', { class: 'form-group' }, el('label', {}, '低风险'), el('div', { class: 'stat-inline success' }, stats.lowRisk + '人'))
      )
    ));
    return frag;
  }

  // ===== 司法端：部门信息共享 =====
  function judicialSharedPage(user) {
    const applications = Storage.getApplications();
    const questions = Storage.getQuestions();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🔗 部门业务申请信息共享'),
      el('div', { class: 'hint' }, '人社、医保、民政等部门业务申请信息（刑释人员在线提交），供司法工作者实时掌握帮扶动态。'),
      applications.length ? table(['人员', '申请类别', '情况说明', '联系电话', '状态', '提交时间'],
        applications.slice(0, 50).map(a => [a.personName, a.category,
          (a.note || '').length > 24 ? a.note.slice(0, 24) + '...' : (a.note || '-'),
          a.phone || '-',
          a.status === '待处理' ? tag('待处理', 'tag-pending') : a.status === '处理中' ? tag('处理中', 'tag-warning') : tag('已处理', 'tag-replied'),
          fmtDate(a.createdAt)]))
        : emptyState('暂无申请信息')
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '❓ 志愿者答疑问题共享'),
      el('div', { class: 'hint' }, '刑释人员向志愿者提出的心理/法律疑问，便于司法工作者了解人员动态。'),
      questions.length ? table(['人员', '类别', '标题', '状态', '回复', '提交时间'],
        questions.slice(0, 50).map(q => [q.personName, q.category, q.title,
          q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'),
          q.reply ? (q.reply.length > 16 ? q.reply.slice(0, 16) + '...' : q.reply) : '-',
          fmtDate(q.createdAt)]))
        : emptyState('暂无疑问')
    ));
    return frag;
  }

  // ===== 刑释人员：相关法律 =====
  function releasedLawsPage(user) {
    const laws = Storage.getLaws();
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📚 相关法律'),
      el('div', { class: 'hint' }, '与刑释人员社会保障、安置帮教相关的法律法规原文，点击查看全文。')
    ));
    laws.forEach(l => {
      frag.appendChild(el('div', { class: 'card card-plain law-item', onclick: () => showLawText(l) },
        el('div', { class: 'card-title' }, '📖 ' + l.name, el('span', { class: 'publish-date' }, l.tag)),
        el('p', { class: 'u-text-muted' }, l.summary)
      ));
    });
    return frag;
  }

  function showLawText(l) {
    const body = el('div', {},
      el('div', { class: 'hint' }, l.summary),
      el('pre', { class: 'law-code-block', style: 'white-space:pre-wrap;font-family:inherit;' }, l.text)
    );
    showModal('📖 ' + l.name, body, { wide: true });
  }

  // ===== 人社/医保/民政 公共工作台 =====
  function orgDashboard(user) {
    const persons = Storage.getPersons();
    const jobs = Storage.getJobs();
    const trainings = Storage.getTrainings();
    const reports = Storage.getReports();
    const policies = Storage.getPolicies();
    const statMap = {
      hrss: [
        { value: jobs.length, label: '推送招聘信息', cls: '' },
        { value: trainings.length, label: '培训信息', cls: 'success' },
        { value: reports.filter(r => r.status === '待处理').length, label: '待处理举报', cls: 'danger' },
        { value: policies.filter(p => p.region && p.region !== '全国').length, label: '地区政策', cls: '' }
      ],
      medicare: [
        { value: policies.length, label: '政策文件', cls: '' },
        { value: persons.length, label: '在册人员', cls: 'success' },
        { value: reports.length, label: '举报记录', cls: '' },
        { value: jobs.length, label: '就业岗位', cls: '' }
      ],
      civil: [
        { value: policies.length, label: '政策文件', cls: '' },
        { value: persons.filter(p => p.occupation === '待业').length, label: '待业人员', cls: 'warning' },
        { value: persons.filter(p => p.riskLevel === 'high').length, label: '高风险', cls: 'danger' },
        { value: persons.length, label: '在册人员', cls: 'success' }
      ]
    };
    const frag = el('div', {});
    frag.appendChild(statGrid(statMap[user.role] || []));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, R[user.role].name + ' · 工作提示'),
      el('p', { class: 'u-text-muted' }, RD[user.role] + '。左侧导航进入对应业务页面；如有政策或平台操作问题，请联系平台管理员。')
    ));
    return frag;
  }

  // ===== 人社：培训信息管理 =====
  function trainingsManagePage(user) {
    const trainings = Storage.getTrainings();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🎓 技校培训信息管理',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => trainingForm(user) }, '➕ 发布培训信息')
      ),
      el('div', { class: 'hint' }, '发布下属技校/就业训练中心的培训信息，供刑释人员查看报名。'),
      trainings.length ? table(['学校/机构', '培训专业', '地点', '开班时间', '名额', '要求', '报名人数', '操作'],
        trainings.map(t => [t.school, t.major, t.location, t.startDate || '-', (t.quota || '-') + '人', t.requirement || '-',
          (t.signups || []).length + '人',
          el('button', { class: 'btn btn-danger btn-sm', onclick: () => { if (confirm('确定删除该培训信息？')) { Storage.deleteTraining(t.id, user); toast('已删除'); render(); } } }, '删除')]))
        : emptyState('暂无培训信息')
    );
    return frag;
  }

  function trainingForm(user) {
    const body = el('div', {},
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '学校/机构 *'), el('input', { id: 't_school' })),
        el('div', { class: 'form-group' }, el('label', {}, '培训专业 *'), el('input', { id: 't_major' }))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '培训地点'), el('input', { id: 't_location' })),
        el('div', { class: 'form-group' }, el('label', {}, '开班时间'), el('input', { id: 't_start', type: 'date' }))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '名额'), el('input', { id: 't_quota', type: 'number', placeholder: '如 30' })),
        el('div', { class: 'form-group' }, el('label', {}, '要求'), el('input', { id: 't_req' }))
      )
    );
    const m = showModal('发布培训信息', body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => {
          if (!$('#t_school').value.trim() || !$('#t_major').value.trim()) { toast('请填写学校和专业', 'error'); return; }
          Storage.addTraining({ school: $('#t_school').value.trim(), major: $('#t_major').value.trim(),
            location: $('#t_location').value.trim(), startDate: $('#t_start').value,
            quota: parseInt($('#t_quota').value) || 0, requirement: $('#t_req').value.trim() }, user);
          toast('培训信息已发布'); m.close(); render();
        } }, '发布')
      ]
    });
  }

  // ===== 人社：劳动监察举报处理 =====
  function reportsManagePage(user) {
    const reports = Storage.getReports();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📢 劳动监察举报处理'),
      el('div', { class: 'hint' }, '刑释人员提交的劳动监察举报，请核实处理并及时反馈。'),
      reports.length ? table(['举报人', '单位名称', '单位地址', '违法时间', '材料', '状态', '提交时间', '操作'],
        reports.map(r => [r.personName, r.company, r.address, r.time || '-', r.evidence ? '已上传' : '未上传',
          r.status === '待处理' ? tag('待处理', 'tag-pending') : r.status === '处理中' ? tag('处理中', 'tag-warning') : tag('已处理', 'tag-replied'),
          fmtDate(r.createdAt),
          el('button', { class: 'btn btn-primary btn-sm', onclick: () => reportHandleForm(user, r) }, '处理')]))
        : emptyState('暂无举报')
    );
    return frag;
  }

  function reportHandleForm(user, r) {
    const body = el('div', {},
      el('ul', { class: 'info-list' },
        li('举报人', r.personName), li('单位名称', r.company), li('单位地址', r.address),
        li('联系电话', r.phone), li('违法时间', r.time || '-'), li('违法事实与过程', r.detail),
        li('当前状态', r.status || '待处理'), li('处理结果', r.reply || '暂无')),
      r.evidence ? el('img', { class: 'report-img', src: r.evidence, alt: '证明材料' }) : el('p', { class: 'u-text-muted' }, '未上传证明材料'),
      el('div', { class: 'form-group' }, el('label', {}, '处理结果 *'),
        el('textarea', { id: 'rep_result', class: 'h-120', placeholder: '填写核查情况与处理结果' }))
    );
    const m = showModal('处理举报 - ' + r.company, body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-outline', onclick: () => { Storage.updateReportStatus(r.id, '处理中', null, user); toast('已标记处理中'); m.close(); render(); } }, '标记处理中'),
        el('button', { class: 'btn btn-success', onclick: () => {
          const res = $('#rep_result').value.trim();
          if (!res) { toast('请填写处理结果', 'error'); return; }
          Storage.updateReportStatus(r.id, '已处理', res, user);
          toast('举报已处理并反馈'); m.close(); render();
        } }, '完成处理')
      ]
    });
  }

  // ===== 部门业务办理跳转 =====
  function servicesLinksPage(user, kind) {
    const groups = {
      hrss: [
        ['失业保险金申领', 'https://si.12333.gov.cn/', '跳转至国家社会保险公共服务平台（失业保险金申领）'],
        ['创业担保贷款申请', 'https://www.mohrss.gov.cn/', '跳转至人社部门网站，按当地指引办理'],
        ['一次性创业补贴申请', 'https://www.mohrss.gov.cn/', '跳转至人社部门网站，按当地指引办理'],
        ['社保办理 / 恢复', 'https://si.12333.gov.cn/', '跳转至国家社会保险公共服务平台（社保办理/恢复）']
      ],
      medicare: [
        ['医保参保登记', 'https://www.nhsa.gov.cn/', '跳转至国家医保服务平台，按当地指引办理'],
        ['医保报销业务', 'https://www.nhsa.gov.cn/', '跳转至国家医保服务平台，按当地指引办理']
      ],
      civil: [
        ['特困人员申请处理', 'https://www.mca.gov.cn/', '跳转至民政部门网站，按当地指引办理'],
        ['低保申请处理', 'https://www.mca.gov.cn/', '跳转至民政部门网站，按当地指引办理']
      ]
    };
    const titles = { hrss: '人社业务办理', medicare: '医保业务办理', civil: '民政业务办理' };
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🧭 ' + titles[kind]),
      el('div', { class: 'hint' }, '以下业务跳转至国家或相关部门官方平台；具体办理以当地部门要求为准。')
    ));
    frag.appendChild(helpGroup(titles[kind], groups[kind] || []));
    return frag;
  }

  // ===== 刑释人员：政策地区切换 =====
  function regionSelectControl(user, p) {
    const region = (p && p.region) || '江西省·南昌市';
    return el('div', { class: 'region-row' },
      el('span', { class: 'region-label' }, '📍 当前政策/申请地区：'),
      el('select', { class: 'region-select', onchange: () => {
        const v = document.querySelector('.region-select').value;
        Storage.updatePerson(p.id, { region: v }, user);
        toast('已切换政策地区为 ' + v); render();
      } },
        ...REGIONS.map(r => el('option', { value: r, selected: r === region }, r)))
    );
  }

  // ===== 司法端：宏观大屏 =====
  let macroChart = null;
  let macroData = null;

  function macroPage(user) {
    const persons = Storage.getPersons();
    const employed = persons.filter(p => p.occupation && p.occupation !== '待业' && p.occupation !== '无').length;
    const employmentRate = persons.length ? Math.round(employed / persons.length * 100) : 0;
    const moved = persons.filter(p => p.province && p.region && p.province !== String(p.region).split('·')[0]).length;
    const migrationRate = persons.length ? Math.round(moved / persons.length * 100) : 0;
    const byProvince = {};
    const jxCities = {};
    persons.forEach(p => {
      const prov = p.province || '未知';
      const city = p.city || '未知';
      byProvince[prov] = (byProvince[prov] || 0) + 1;
      if (prov === '江西省') jxCities[city] = (jxCities[city] || 0) + 1;
    });
    const highRisk = persons.filter(p => p.riskLevel === 'high').length;
    const lowRisk = persons.filter(p => p.riskLevel === 'low').length;
    const frag = el('div', {});
    frag.appendChild(statGrid([
      { value: '7945', label: '历史帮教人数', cls: '' },
      { value: '1286', label: '当前帮教人数', cls: 'success' },
      { value: employmentRate + '%', label: '就业率（在册实时）', cls: '' },
      { value: '6842', label: '历史成功帮教', cls: 'success' }
    ]));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🗺️ 安置帮教分布大屏（数据随在册档案实时统计）'),
      el('div', { class: 'macro-tabs' },
        el('button', { class: 'btn btn-primary btn-sm macro-tab active', dataset: { map: 'china' }, onclick: () => switchMacroMap('china') }, '全国分布'),
        el('button', { class: 'btn btn-outline btn-sm macro-tab', dataset: { map: 'jiangxi' }, onclick: () => switchMacroMap('jiangxi') }, '江西省内分布')
      ),
      el('div', { id: 'macroMapBox', class: 'macro-map-box' },
        el('div', { class: 'u-text-muted' }, '地图加载中…（依赖 ECharts 与在线地理数据，如无法加载将显示下方省份明细表）')
      )
    ));
    frag.appendChild(el('div', { class: 'row' },
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, '📈 就业与居住情况'),
        barChart([
          { label: '已就业', value: employed, color: 'var(--success)' },
          { label: '待业', value: Math.max(0, persons.length - employed), color: 'var(--warning)' },
          { label: '异地居住', value: moved, color: 'var(--danger)' }
        ])
      ),
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, '⚠️ 风险分布'),
        barChart([
          { label: '高风险', value: highRisk, color: 'var(--danger)' },
          { label: '低风险', value: lowRisk, color: 'var(--success)' }
        ])
      )
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📋 省份分布明细'),
      table(['省份', '在册人数'], Object.keys(byProvince).map(k => [k, byProvince[k]]))
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📅 信息更新完成情况'),
      ...AI.analyzeStats().updateCompletion.map(tp => el('div', { class: 'form-group' },
        el('label', {}, tp.label + '（完成 ' + tp.completed + '/' + tp.total + '）'),
        el('div', { class: 'progress-bar' }, el('div', { style: 'width:' + tp.rate + '%;' }))
      ))
    ));
    macroData = { china: byProvince, jiangxi: jxCities };
    setTimeout(() => initMacroMap(), 0);
    return frag;
  }

  function initMacroMap() {
    const box = document.getElementById('macroMapBox');
    if (!box || !macroData) return;
    const loadEcharts = () => {
      if (window.echarts) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js';
        s.onload = resolve; s.onerror = () => reject(new Error('ECharts 加载失败'));
        document.head.appendChild(s);
      });
    };
    loadEcharts().then(() => {
      box.innerHTML = '';
      const chartBox = el('div', { class: 'macro-chart' });
      box.appendChild(chartBox);
      macroChart = echarts.init(chartBox);
      drawMacroMap('china');
    }).catch(() => {
      box.innerHTML = '';
      box.appendChild(el('p', { class: 'u-text-muted' }, '地图组件加载失败，请检查网络连接（页面其余功能不受影响，可查看下方省份明细表）。'));
    });
  }

  const geoCache = {};
  function fetchGeo(kind) {
    const name = kind === 'china' ? 'china' : 'jiangxi';
    if (geoCache[name]) return Promise.resolve(geoCache[name]);
    return fetch('js/geo/' + name + '.json')
      .then(r => { if (!r.ok) throw new Error('local geo missing'); return r.json(); })
      .then(geo => { geoCache[name] = geo; return geo; })
      .catch(() => fetch('https://geo.datav.aliyun.com/areas_v3/bound/' + (kind === 'china' ? '100000' : '360000') + '_full.json')
        .then(r => { if (!r.ok) throw new Error('remote geo missing'); return r.json(); })
        .then(geo => { geoCache[name] = geo; return geo; }));
  }
  function drawMacroMap(kind) {
    if (!macroChart || !macroData) return;
    const mapName = kind === 'china' ? 'china' : 'jiangxi';
    const data = macroData[kind === 'china' ? 'china' : 'jiangxi'] || {};
    const list = Object.keys(data).map(k => ({ name: k, value: data[k] }));
    const applyGeo = (geo) => {
      if (!echarts.getMap(mapName)) echarts.registerMap(mapName, geo);
      const maxV = Math.max.apply(null, list.map(i => i.value).concat([1]));
      macroChart.setOption({
        tooltip: { trigger: 'item', formatter: p => p.name + '：' + p.value + ' 人' },
        visualMap: { min: 0, max: maxV, left: 16, bottom: 16, calculable: true, inRange: { color: ['#e8f1ff', '#2563eb'] } },
        series: [{ type: 'map', map: mapName, roam: true, label: { show: true, fontSize: 10 }, emphasis: { label: { fontSize: 13, fontWeight: 'bold' } }, data: list }]
      }, true);
    };
    const showFallback = () => {
      const box = document.getElementById('macroMapBox');
      if (!box) return;
      box.innerHTML = '';
      const rows = Object.keys(data).map(k => [k, data[k]]);
      box.appendChild(el('p', { class: 'u-text-muted' }, '地图加载失败，以下为' + (kind === 'china' ? '省份' : '江西各市') + '分布明细：'));
      box.appendChild(table(['地区', '在册人数'], rows));
    };
    // 优先使用项目内置地图数据（同源、无跨域限制），失败时回退到在线数据源
    fetchGeo(kind).then(applyGeo).catch(showFallback);
  }

  function switchMacroMap(kind) {
    document.querySelectorAll('.macro-tab').forEach(b => {
      const active = b.dataset.map === kind;
      b.className = 'btn btn-sm macro-tab ' + (active ? 'btn-primary active' : 'btn-outline');
    });
    drawMacroMap(kind);
  }

  // ===== 豆包 AI 深度评级 =====
  function aiRiskModal(p, user) {
    const body = el('div', {},
      el('div', { class: 'hint' }, '正在调用豆包大模型进行深度风险评级分析…'),
      el('div', { style: 'margin:18px 0;text-align:center;' }, '⏳ 请稍候')
    );
    const m = showModal('🤖 豆包AI深度评级 - ' + p.name, body, { wide: true });
    AI.riskSuggestionAsync(p).then(r => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, 'AI建议评级'), el('div', {}, tag(r.levelText, 'tag-' + r.level))),
        el('div', { class: 'form-group' }, el('label', {}, 'AI风险评分'), el('div', {}, r.score + ' / 100')),
        el('div', { class: 'form-group' }, el('label', {}, '评级来源'), el('div', {}, r.source === 'llm' ? tag('豆包大模型', 'tag-replied') : tag('规则引擎', 'tag-medium')))
      ));
      if (r.analysis) body.appendChild(el('div', { style: 'margin:10px 0;' }, el('strong', {}, '影响因素分析：'), el('p', { class: 'u-text-muted' }, r.analysis)));
      body.appendChild(el('div', { style: 'margin:10px 0;' }, el('strong', {}, '帮教建议：'), el('p', { class: 'u-text-muted' }, r.advice)));
      if (r.error) body.appendChild(el('p', { style: 'margin:10px 0;color:#dc2626;' }, '注：本次使用规则评级兜底（' + r.error + '）'));
      body.appendChild(el('div', { class: 'modal-footer' },
        el('button', { class: 'btn btn-success btn-sm', onclick: () => { Storage.setRiskLevel(p.id, 'low', user); toast('已评定为低风险'); m.close(); render(); } }, '评定为低风险'),
        el('button', { class: 'btn btn-danger btn-sm', onclick: () => { Storage.setRiskLevel(p.id, 'high', user); toast('已评定为高风险'); m.close(); render(); } }, '评定为高风险')
      ));
    }).catch(e => {
      body.innerHTML = '';
      body.appendChild(el('p', { class: 'u-text-muted' }, '调用失败：' + e.message));
    });
  }

  // ===== 刑释人员端口 =====
  function releasedDashboard(user) {
    const p = Storage.getPerson(user.personId);
    if (!p) return el('div', { class: 'card' }, el('p', {}, '未找到您的档案信息'));
    const updates = Storage.getUpdatesByPerson(p.id);
    const frag = el('div', {});
    frag.appendChild(todayLawCard());
    frag.appendChild(el('div', { class: 'card xa-welcome-card' },
      el('div', { class: 'card-title' }, '🤖 我是小安'),
      el('p', { class: 'u-text-muted' }, '您身边的安置帮教政策助手，可以解答社会补助、社会保障、就业创业以及相关政策问题。'),
      el('button', { class: 'btn btn-primary btn-sm', onclick: () => XiaoAn.open() }, '开始咨询小安 →')
    ));
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
      frag.appendChild(el('div', { class: 'card card-danger' },
        el('div', { class: 'card-title' }, '⚠️ 重要提示'),
        el('p', { class: 'u-text-muted' }, '您被评定为高风险人员，系统已为您默认选择要求更加严格、强制程度更高的安置帮教服务。请在以下特定时间点登录系统更新个人信息。')
      ));
    }
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📅 信息更新时间节点'),
      el('div', { class: 'hint' }, '请在以下时间点登录系统更新个人信息（居住地、职业、婚姻等）：'),
      ...[
        { key: '1month', label: '刑满释放后1个月' },
        { key: '6month', label: '刑满释放后6个月' },
        { key: '1year', label: '刑满释放后1年' },
        { key: '3year', label: '刑满释放后3年' },
        { key: '5year', label: '刑满释放后5年' }
      ].map(tp => {
        const done = updates.find(u => u.timePoint === tp.key);
        return el('div', { class: 'timeline-row' },
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
      el('p', {}, '经风险评级，您属于低风险人员。您可以选择对正常生活干扰更小的灵活帮教服务，也可以选择强制程度更高的帮教服务。'),
      el('p', { class: 'u-font-semibold' }, '请问您是否愿意接受强制程度更高的安置帮教服务？'),
      el('div', { class: 'choice-buttons' },
        el('button', { class: 'choice-btn yes', onclick: () => { Storage.chooseService(p.id, 'strict', user); toast('已选择严格帮教服务'); modal.close(); render(); } }, '是'),
        el('button', { class: 'choice-btn no', onclick: () => { Storage.chooseService(p.id, 'flexible', user); toast('已选择灵活帮教服务'); modal.close(); render(); } }, '否')
      )
    );
    const modal = showModal('安置帮教服务选择（限1个月内）', body);
  }

  function releasedUpdatePage(user) {
    const p = Storage.getPerson(user.personId);
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '✏️ 更新个人信息'),
      el('div', { class: 'hint' }, '在特定时间点登录系统更新个人信息。'),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '选择时间节点 *'),
          el('select', { id: 'u_tp' },
            el('option', { value: '1month' }, '刑满释放后1个月'),
            el('option', { value: '6month' }, '刑满释放后6个月'),
            el('option', { value: '1year' }, '刑满释放后1年'),
            el('option', { value: '3year' }, '刑满释放后3年'),
            el('option', { value: '5year' }, '刑满释放后5年'))
        )
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '政策/申请地区'),
          el('select', { id: 'u_region' },
            ...REGIONS.map(r => el('option', { value: r, selected: r === (p.region || '江西省·南昌市') }, r)))
        ),
        el('div', { class: 'form-group' }, el('label', {}, '居住地'), el('input', { id: 'u_address', value: p.address || '' }))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '职业情况'), el('input', { id: 'u_occupation', value: p.occupation || '' })),
        el('div', { class: 'form-group' }, el('label', {}, '婚姻状况'),
          el('select', { id: 'u_marital' }, el('option', { value: '未婚', selected: p.maritalStatus === '未婚' }, '未婚'),
            el('option', { value: '已婚', selected: p.maritalStatus === '已婚' }, '已婚'),
            el('option', { value: '离异', selected: p.maritalStatus === '离异' }, '离异'),
            el('option', { value: '丧偶', selected: p.maritalStatus === '丧偶' }, '丧偶')))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '联系电话'), el('input', { id: 'u_phone', value: p.phone || '' })),
        el('div', { class: 'form-group' }, el('label', {}, '收入情况'),
          el('select', { id: 'u_income' }, el('option', { value: '', selected: !p.income }, '请选择'),
            el('option', { value: '无收入', selected: p.income === '无收入' }, '无收入'),
            el('option', { value: '2000元以下', selected: p.income === '2000元以下' }, '2000元以下'),
            el('option', { value: '2000-5000元', selected: p.income === '2000-5000元' }, '2000-5000元'),
            el('option', { value: '5000元以上', selected: p.income === '5000元以上' }, '5000元以上')))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '技能特长'), el('input', { id: 'u_skills', value: p.skills || '', placeholder: '如：电工、驾驶、烹饪等' })),
        el('div', { class: 'form-group' }, el('label', {}, '就业意向'), el('input', { id: 'u_intent', value: p.employmentIntent || '', placeholder: '如：想找制造业/服务业岗位' }))
      ),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const tp = $('#u_tp').value;
        const tpMap = { '1month': '刑满释放后1个月', '6month': '刑满释放后6个月', '1year': '刑满释放后1年', '3year': '刑满释放后3年', '5year': '刑满释放后5年' };
        Storage.updatePerson(p.id, { region: $('#u_region').value }, user);
        Storage.addUpdate({ personId: p.id, timePoint: tp, timePointLabel: tpMap[tp],
          address: $('#u_address').value.trim(), occupation: $('#u_occupation').value.trim(),
          maritalStatus: $('#u_marital').value, phone: $('#u_phone').value.trim(),
          income: $('#u_income').value, skills: $('#u_skills').value.trim(),
          employmentIntent: $('#u_intent').value.trim(), region: $('#u_region').value }, user);
        toast('信息更新成功'); state.page = 'dashboard'; render();
      } }, '提交更新')
    );
    return frag;
  }

  function releasedPoliciesPage(user) {
    const person = Storage.getPerson(user.personId);
    const region = (person && person.region) || '江西省·南昌市';
    const policies = Storage.getPolicies().filter(pol => pol.region === '全国' || region.indexOf(pol.region) === 0);
    const jobs = Storage.getJobs();
    const frag = el('div', {});
    frag.appendChild(regionSelectControl(user, person));
    const policyList = el('div', {});
    const policyToggleBtn = el('button', { class: 'btn btn-outline btn-sm', onclick: (e) => {
      e.stopPropagation();
      const cards = policyList.querySelectorAll('.policy-card');
      const anyClosed = Array.from(cards).some(c => !c._expanded);
      cards.forEach(c => c._setExpanded(anyClosed));
      policyToggleBtn.textContent = anyClosed ? '收起全部 ▲' : '显示更多 ▾';
    } }, '显示更多 ▾');
    policies.forEach(pol => policyList.appendChild(renderPolicyCard(pol)));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📢 最新政策调整（当前地区：' + region + '）', policyToggleBtn),
      policies.length ? policyList : emptyState('暂无政策')
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '💼 企业招聘信息'),
      jobs.length ? table(['企业', '职位', '薪资', '地点', '要求', '发布日期'],
        jobs.map(j => [j.company, j.position, j.salary, j.location, j.requirement, fmtDate(j.publishDate)]))
        : emptyState('暂无招聘信息')
    ));
    frag.appendChild(renderTrainingSection(user));
    return frag;
  }

  function releasedQuestionsPage(user) {
    const p = Storage.getPerson(user.personId);
    const qs = Storage.getQuestionsByPerson(p.id);
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '❓ 我的疑问',
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => { state.page = 'ask'; render(); } }, '➕ 提交新疑问')
      ),
      qs.length ? table(
        ['类别', '标题', '内容', '状态', '回复', '提交时间'],
        qs.map(q => [q.category, q.title, q.content, q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'),
          q.reply || '-', fmtDate(q.createdAt)])
      ) : emptyState('您还没有提交过疑问')
    );
    return frag;
  }

  function releasedAskPage(user) {
    const p = Storage.getPerson(user.personId);
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '➕ 提交心理/法律疑问'),
      el('div', { class: 'hint' }, '您可以上传心理或法律方面的疑问，专业志愿者将在一周之内回复。'),
      el('div', { class: 'form-group' }, el('label', {}, '类别 *'),
        el('select', { id: 'q_cat' }, el('option', { value: '心理' }, '心理'), el('option', { value: '法律' }, '法律'))),
      el('div', { class: 'form-group' }, el('label', {}, '标题 *'), el('input', { id: 'q_title', placeholder: '请输入疑问标题' })),
      el('div', { class: 'form-group' }, el('label', {}, '详细内容 *'), el('textarea', { id: 'q_content', class: 'h-120' })),
      el('button', { class: 'btn btn-primary', onclick: () => {
        if (!$('#q_title').value.trim() || !$('#q_content').value.trim()) { toast('请填写标题和内容', 'error'); return; }
        Storage.addQuestion({ personId: p.id, category: $('#q_cat').value,
          title: $('#q_title').value.trim(), content: $('#q_content').value.trim() }, user);
        toast('疑问已提交，志愿者将在一周内回复'); state.page = 'questions'; render();
      } }, '提交疑问')
    );
    return frag;
  }

  // ===== 刑释人员：技校培训 =====
  function renderTrainingSection(user) {
    const p = Storage.getPerson(user.personId);
    const trainings = Storage.getTrainings();
    return el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🎓 技校培训信息'),
      el('div', { class: 'hint' }, '人社部门推送的技校培训信息，可在线报名。开班前将由学校/机构通知。'),
      trainings.length ? table(['学校/机构', '培训专业', '地点', '开班时间', '名额', '要求', '操作'],
        trainings.map(t => [t.school, t.major, t.location, t.startDate || '-', (t.quota || '-') + '人', t.requirement || '-',
          (t.signups || []).includes(p.id) ? tag('已报名', 'tag-replied') :
            el('button', { class: 'btn btn-primary btn-sm', onclick: () => {
              Storage.signTraining(t.id, p.id, user);
              toast('报名成功，请留意开班通知'); render();
            } }, '报名')]))
        : emptyState('暂无培训信息')
    );
  }

  // ===== 刑释人员：违法举报 =====
  function releasedReportPage(user) {
    const p = Storage.getPerson(user.personId);
    const reports = Storage.getReportsByPerson(p.id);
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📢 违法举报（劳动监察）'),
      el('div', { class: 'hint' }, '如您遭遇拖欠工资、违法用工等情况，可在此提交劳动监察举报。请如实填写，并上传相关证明材料（图片 jpg，单张不超过 1MB）。'),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '单位名称 *'), el('input', { id: 'r_company' })),
        el('div', { class: 'form-group' }, el('label', {}, '单位地址 *'), el('input', { id: 'r_address' }))
      ),
      el('div', { class: 'row' },
        el('div', { class: 'form-group' }, el('label', {}, '联系电话 *'), el('input', { id: 'r_phone', placeholder: '您的联系方式' })),
        el('div', { class: 'form-group' }, el('label', {}, '违法时间 *'), el('input', { id: 'r_time', type: 'date' }))
      ),
      el('div', { class: 'form-group' }, el('label', {}, '违法事实与过程 *'), el('textarea', { id: 'r_detail', class: 'h-120', placeholder: '请描述单位的违法事实、经过……' })),
      el('div', { class: 'form-group' }, el('label', {}, '证明材料（图片 jpg）'),
        el('input', { id: 'r_img', type: 'file', accept: '.jpg,.jpeg', onchange: () => {
          const f = $('#r_img').files[0];
          if (f && f.size > 1024 * 1024) { toast('图片不能超过 1MB', 'error'); $('#r_img').value = ''; }
        } })),
      el('button', { class: 'btn btn-primary', onclick: () => submitReport(user, p) }, '提交举报')
    ));
    if (reports.length) {
      frag.appendChild(el('div', { class: 'card' },
        el('div', { class: 'card-title' }, '📋 我的举报记录'),
        table(['单位名称', '违法时间', '材料', '状态', '提交时间', '操作'],
          reports.map(r => [r.company, r.time || '-', r.evidence ? '已上传' : '未上传',
            tag('待处理', 'tag-pending'), fmtDate(r.createdAt),
            el('button', { class: 'btn btn-outline btn-sm', onclick: () => viewReport(r) }, '查看')]))
      ));
    }
    return frag;
  }

  function submitReport(user, p) {
    if (!$('#r_company').value.trim() || !$('#r_address').value.trim() || !$('#r_phone').value.trim() || !$('#r_time').value || !$('#r_detail').value.trim()) {
      toast('请完整填写举报信息', 'error'); return;
    }
    const file = $('#r_img').files[0];
    const onDone = (evidence) => {
      Storage.addReport({ personId: p.id, personName: p.name,
        company: $('#r_company').value.trim(), address: $('#r_address').value.trim(),
        phone: $('#r_phone').value.trim(), time: $('#r_time').value,
        detail: $('#r_detail').value.trim(), evidence }, user);
      toast('举报已提交，相关部门将尽快处理'); state.page = 'report'; render();
    };
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onDone(reader.result);
      reader.readAsDataURL(file);
    } else {
      onDone(null);
    }
  }

  function viewReport(r) {
    const body = el('div', {},
      r.evidence ? el('img', { class: 'report-img', src: r.evidence, alt: '证明材料' }) : el('p', { class: 'u-text-muted' }, '未上传证明材料'),
      el('ul', { class: 'info-list' },
        li('单位名称', r.company), li('单位地址', r.address), li('联系电话', r.phone),
        li('违法时间', r.time), li('违法事实与过程', r.detail),
        li('状态', r.status || '待处理'), li('提交时间', fmtDate(r.createdAt)))
    );
    showModal('举报详情', body, { wide: true });
  }

  // ===== 刑释人员：办事服务（生活困难 / 创业 / 社保） =====
  function releasedHelpPage(user) {
    const person = Storage.getPerson(user.personId);
    const region = (person && person.region) || '江西省·南昌市';
    const frag = el('div', {});
    frag.appendChild(regionSelectControl(user, person));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🧭 办事服务（当前地区：' + region + '）'),
      el('div', { class: 'hint' }, '以下服务将跳转至国家或相关部门官方平台办理。具体办理地点与材料以您当前所在地（户籍地或居住地）的当地部门要求为准。')
    ));
    frag.appendChild(helpGroup('🏠 生活困难帮助', [
      ['失业保险金申领', 'https://si.12333.gov.cn/', '跳转至国家社会保险公共服务平台（失业保险金申领）', '失业保险金申领'],
      ['特困人员申请', 'https://www.mca.gov.cn/', '跳转至民政部门网站，按当地民政部门指引申请', '特困人员申请']
    ], { user, person }));
    frag.appendChild(helpGroup('🚀 创业帮助', [
      ['创业担保贷款申请', 'https://www.mohrss.gov.cn/', '跳转至人社部门网站，按当地人社部门指引申请', '创业担保贷款申请'],
      ['一次性创业补贴申请', 'https://www.mohrss.gov.cn/', '跳转至人社部门网站，按当地人社部门指引申请', '一次性创业补贴申请']
    ], { user, person }));
    frag.appendChild(helpGroup('🛡️ 社会保障申请', [
      ['社保办理', 'https://si.12333.gov.cn/', '跳转至国家社会保险公共服务平台（社保办理/恢复）', '社保办理'],
      ['医保办理', 'https://www.nhsa.gov.cn/', '跳转至国家医保服务平台，按当地医保部门指引办理', '医保办理']
    ], { user, person }));
    return frag;
  }

  function helpGroup(title, items, applyCtx) {
    return el('div', { class: 'card' },
      el('div', { class: 'card-title' }, title),
      ...items.map(it => el('div', { class: 'help-link-row' },
        el('div', {},
          el('div', { class: 'help-link-name' }, it[0]),
          el('div', { class: 'help-link-desc' }, it[2])
        ),
        el('div', { class: 'help-link-actions' },
          (applyCtx && it[3]) ? el('button', { class: 'btn btn-primary btn-sm', onclick: () => applyServiceModal(applyCtx.user, applyCtx.person, it[3], it[0]) }, '在线申请') : null,
          el('a', { class: 'btn btn-outline btn-sm', href: it[1], target: '_blank', rel: 'noopener noreferrer' }, '前往办理 →')
        )
      ))
    );
  }

  // 刑释人员：在线提交部门业务申请（司法端信息共享可见）
  function applyServiceModal(user, person, category, itemName) {
    const body = el('div', {},
      el('div', { class: 'hint' }, '申请事项：' + category + '（' + (itemName || '') + '）。提交后司法行政部门与对应保障部门可查看，办理流程以当地部门要求为准。'),
      el('div', { class: 'form-group' }, el('label', {}, '情况说明 *'),
        el('textarea', { id: 'app_note', class: 'h-120', placeholder: '简单说明您的情况：户籍地、居住地、当前状况等' })),
      el('div', { class: 'form-group' }, el('label', {}, '联系电话'),
        el('input', { id: 'app_phone', value: (person && person.phone) || '' }))
    );
    const m = showModal('在线申请 - ' + category, body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => {
          const note = $('#app_note').value.trim();
          if (!note) { toast('请填写情况说明', 'error'); return; }
          Storage.addApplication({
            personId: person.id, personName: person.name,
            category: category, itemName: itemName || category,
            note: note, phone: $('#app_phone').value.trim() || (person && person.phone) || ''
          }, user);
          toast('申请已提交，相关部门将跟进'); m.close();
        } }, '提交申请')
      ]
    });
  }

  // ===== 社会志愿者端口 =====
  function volunteerQuestionsPage(user, onlyPending) {
    let qs = Storage.getQuestions();
    if (onlyPending) qs = qs.filter(q => q.status === 'pending');
    const frag = el('div', {});
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, onlyPending ? '❓ 待回复疑问' : '📋 全部疑问'),
      el('div', { class: 'hint' }, '志愿者每周定期登录，对刑释人员的疑问进行专业答疑，请尽量在一周内完成回复。'),
      qs.length ? table(
        ['人员', '类别', '标题', '内容', '状态', '提交时间', '操作'],
        qs.map(q => [q.personName, q.category, q.title, q.content.length > 20 ? q.content.slice(0, 20) + '...' : q.content,
          q.status === 'replied' ? tag('已回复', 'tag-replied') : tag('待回复', 'tag-pending'),
          fmtDate(q.createdAt),
          q.status === 'pending' ? el('button', { class: 'btn btn-primary btn-sm', onclick: () => replyForm(user, q) }, '回复') :
            el('button', { class: 'btn btn-outline btn-sm', onclick: () => viewReply(q) }, '查看回复')])
      ) : emptyState('暂无' + (onlyPending ? '待回复' : '') + '疑问')
    ));
    return frag;
  }

  function viewReply(q) {
    const body = el('div', {},
      el('ul', { class: 'info-list' },
        li('提问人', q.personName), li('类别', q.category), li('标题', q.title),
        li('内容', q.content), li('提交时间', fmtDate(q.createdAt)),
        li('回复人', q.replierName || '-'), li('回复时间', q.repliedAt || '-'),
        li('回复内容', q.reply || '-')));
    showModal('疑问详情', body, { wide: true });
  }

  function replyForm(user, q) {
    const body = el('div', {},
      el('ul', { class: 'info-list' },
        li('提问人', q.personName), li('类别', q.category), li('标题', q.title), li('内容', q.content)),
      el('div', { class: 'form-group' }, el('label', {}, '回复人身份 *'),
        el('input', { id: 'rep_name', placeholder: '如：心理咨询师 张医生 / 法律顾问 李律师' })),
      el('div', { class: 'form-group' }, el('label', {}, '回复内容 *'),
        el('textarea', { id: 'rep_content', class: 'h-120', placeholder: '请输入专业回复内容' }))
    );
    const m = showModal('回复疑问 - ' + q.title, body, {
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => m.close() }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => {
          if (!$('#rep_name').value.trim() || !$('#rep_content').value.trim()) { toast('请填写回复人身份和内容', 'error'); return; }
          Storage.replyQuestion(q.id, $('#rep_content').value.trim(), $('#rep_name').value.trim(), user);
          toast('回复已提交'); m.close(); render();
        } }, '提交回复')
      ]
    });
  }

  // ===== 每日普法模块 =====
  function todayLawCard() {
    const tc = LawLibrary.getTodayCase();
    return el('div', { class: 'law-card', onclick: () => openCaseDetail(tc.id) },
      el('div', { class: 'law-card-left' },
        el('div', { class: 'law-card-title' }, '📖 今日普法：' + tc.category + ' · ' + tc.title),
        el('div', { class: 'law-card-desc' }, '📍 ' + tc.location + ' · 🗓 ' + tc.date + ' · 点击查看完整案例、法律依据及警示意义')
      ),
      el('span', { class: 'law-card-badge' }, '每日必读 →')
    );
  }

  function openCaseDetail(caseId) {
    const c = LawLibrary.getCaseById(caseId);
    if (!c) { toast('案例不存在', 'error'); return; }
    const body = el('div', { class: 'law-popup' },
      el('div', { class: 'law-popup-header' },
        el('h3', {}, '⚖️ ' + c.category + ' · ' + c.title),
        el('div', { class: 'law-case-date' }, '🗓 案发时间：' + c.date + ' ｜ 📍 案发地点：' + c.location)
      ),
      el('div', { class: 'law-case-meta' },
        el('span', {}, '⚖️ 涉及罪名：' + c.relatedCrime),
        el('span', {}, '📋 案例编号：#' + String(c.id).padStart(3, '0'))
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '📌 基本案情'),
        el('p', {}, c.caseContent)
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '👨‍⚖️ 裁判结果'),
        el('p', {}, c.courtResult)
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '📜 法律依据'),
        el('pre', { class: 'law-code-block' }, c.lawBasis)
      ),
      el('div', { class: 'law-tip' }, '💡 警示与教训：' + c.lesson)
    );
    showModal('普法案例详情', body, { wide: true });
  }

  function lawPage(user) {
    const today = LawLibrary.getTodayCase();
    const cats = LawLibrary.getCategories();
    const all = LawLibrary.getAllCases();
    const frag = el('div', {});
    frag.appendChild(todayLawCard());
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📚 按罪名分类浏览案例库'),
      el('div', { class: 'law-cat-grid' },
        ...cats.map(cat =>
          el('div', { class: 'law-cat-item', onclick: () => showLawCategory(cat.key) },
            el('div', { class: 'law-cat-icon' }, cat.icon),
            el('div', { class: 'law-cat-name' }, cat.key),
            el('div', { class: 'law-cat-desc' }, cat.desc)
          )
        )
      )
    ));
    frag.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📖 全部真实案例（共 ' + all.length + ' 件）'),
      ...all.map(c =>
        el('div', { class: 'law-case-list-item', onclick: () => openCaseDetail(c.id) },
          el('div', { class: 'law-case-list-title' }, '⚖️ ' + c.category + '：' + c.title),
          el('div', { class: 'law-case-list-meta' }, '📍 ' + c.location + ' ｜ 🗓 ' + c.date + ' ｜ 👥 涉及罪名：' + c.relatedCrime)
        )
      )
    ));
    return frag;
  }

  function showLawCategory(catKey) {
    const list = LawLibrary.getCasesByCategory(catKey);
    const cats = LawLibrary.getCategories();
    const cat = cats.find(c => c.key === catKey);
    const body = el('div', {},
      el('div', { class: 'hint' }, (cat ? cat.icon + ' ' + cat.key + '：' + cat.desc : '') + '（共 ' + list.length + ' 个相关案例）'),
      list.length ? list.map(c =>
        el('div', { class: 'law-case-list-item', onclick: () => { m.close(); openCaseDetail(c.id); } },
          el('div', { class: 'law-case-list-title' }, '⚖️ ' + c.title),
          el('div', { class: 'law-case-list-meta' }, '📍 ' + c.location + ' ｜ 🗓 ' + c.date)
        )
      ) : emptyState('该分类暂无案例')
    );
    const m = showModal(catKey + ' 案例列表', body, { wide: true });
  }

  function showDailyLawOnce(user) {
    const key = 'law_shown_' + new Date().toISOString().slice(0, 10) + '_' + (user ? user.id : 'x');
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const tc = LawLibrary.getTodayCase();
    let m = null;
    const body = el('div', { class: 'law-popup' },
      el('div', { class: 'law-popup-header' },
        el('h3', {}, '🎯 今日普法 · ' + new Date().toLocaleDateString('zh-CN')),
        el('div', { class: 'law-case-date' }, '每日一条真实案例，警钟长鸣 · 守法于心')
      ),
      el('div', { class: 'law-case-meta' },
        el('span', {}, '⚖️ ' + tc.category),
        el('span', {}, '📍 ' + tc.location),
        el('span', {}, '🗓 ' + tc.date)
      ),
      el('div', { class: 'popup-case-title' },
        el('h2', {}, tc.title)
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '📌 基本案情'),
        el('p', {}, tc.caseContent.slice(0, 180) + '……')
      ),
      el('div', { class: 'law-case-section' },
        el('h4', {}, '👨‍⚖️ 裁判结果'),
        el('p', {}, tc.courtResult.slice(0, 150) + '……')
      ),
      el('div', { class: 'law-tip' }, '💡 ' + tc.lesson)
    );
    m = showModal('📖 每日普法 · ' + tc.category, body, {
      wide: true,
      footer: [
        el('button', { class: 'btn btn-outline', onclick: () => { if (m) m.close(); openCaseDetail(tc.id); } }, '查看完整案例'),
        el('button', { class: 'btn btn-primary', onclick: () => { if (m) m.close(); state.page = 'law'; render(); } }, '进入普法专栏')
      ]
    });
  }

  // ===== 操作日志 =====
  function logsPage(user) {
    const logs = Storage.getLogs();
    const frag = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '📜 操作日志'),
      logs.length ? table(['时间', '操作人', '操作内容'], logs.map(l => [l.time, l.user, l.action])) : emptyState('暂无操作日志')
    );
    return frag;
  }

  function init() {
    Storage.ensureDemoData();
    render();
  }
  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
