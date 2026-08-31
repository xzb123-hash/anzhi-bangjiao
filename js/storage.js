/**
 * 安置帮教综合管理平台 - 数据存储层
 * 使用 localStorage 模拟后端数据存储
 */
const Storage = (function () {
  const DB_KEY = 'anzhuang_bangjiao_db';

  function getDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try {
        const db = JSON.parse(raw);
        if (db.trainings === undefined) db.trainings = [];
        if (db.reports === undefined) db.reports = [];
        ensureExtraUsers(db);
        return db;
      } catch (e) {}
    }
    return initDB();
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  // 老版本浏览器数据兼容：自动补齐三个部门账号
  function ensureExtraUsers(db) {
    if (!db.users) db.users = [];
    const extra = [
      { id: 'u_hrss', username: 'hrss', password: '123456', name: '人社管理员', role: 'hrss', org: '市人力资源和社会保障局' },
      { id: 'u_medicare', username: 'medicare', password: '123456', name: '医保管理员', role: 'medicare', org: '市医疗保障局' },
      { id: 'u_civil', username: 'civil', password: '123456', name: '民政管理员', role: 'civil', org: '市民政局' }
    ];
    extra.forEach(u => {
      if (!db.users.some(x => x.username === u.username)) db.users.push(u);
    });
  }

  function initDB() {
    const today = new Date();
    const d = (offset) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().slice(0, 10);
    };

    const db = {
      users: [
        { id: 'u_police', username: 'police', password: '123456', name: '公安管理员', role: 'police', org: '市公安局' },
        { id: 'u_prison', username: 'prison', password: '123456', name: '监狱管理员', role: 'prison', org: '市第一监狱' },
        { id: 'u_judicial', username: 'judicial', password: '123456', name: '司法管理员', role: 'judicial', org: '市司法局' },
        { id: 'u_volunteer', username: 'volunteer', password: '123456', name: '志愿者账号', role: 'volunteer', org: '社会志愿者协会' },
        { id: 'u_hrss', username: 'hrss', password: '123456', name: '人社管理员', role: 'hrss', org: '市人力资源和社会保障局' },
        { id: 'u_medicare', username: 'medicare', password: '123456', name: '医保管理员', role: 'medicare', org: '市医疗保障局' },
        { id: 'u_civil', username: 'civil', password: '123456', name: '民政管理员', role: 'civil', org: '市民政局' },
        { id: 'u_rel1', username: 'released1', password: '123456', name: '张三', role: 'released', personId: 'p1' },
        { id: 'u_rel2', username: 'released2', password: '123456', name: '李四', role: 'released', personId: 'p2' },
        { id: 'u_rel3', username: 'released3', password: '123456', name: '王五', role: 'released', personId: 'p3' }
      ],
      persons: [
        {
          id: 'p1', name: '张三', gender: '男', age: 28, idCard: '110101199601011234',
          crime: '盗窃罪', sentence: '有期徒刑2年', releaseDate: d(-30),
          prisonPerformance: '表现良好，积极参加教育改造，无违规记录',
          riskLevel: 'low', serviceType: 'flexible', serviceChoiceMade: true,
          address: '北京市朝阳区建国路88号', occupation: '待业', maritalStatus: '未婚',
          province: '北京市', city: '北京市', region: '北京市·北京市',
          createdBy: 'u_police', createdAt: d(-60)
        },
        {
          id: 'p2', name: '李四', gender: '男', age: 35, idCard: '110105198905055678',
          crime: '故意伤害罪', sentence: '有期徒刑3年6个月', releaseDate: d(-15),
          prisonPerformance: '表现一般，有过1次违规，经教育后改正',
          riskLevel: 'high', serviceType: 'strict', serviceChoiceMade: true,
          address: '北京市海淀区中关村大街1号', occupation: '待业', maritalStatus: '已婚',
          province: '北京市', city: '北京市', region: '北京市·北京市',
          createdBy: 'u_police', createdAt: d(-90)
        },
        {
          id: 'p3', name: '王五', gender: '男', age: 22, idCard: '110108200203039012',
          crime: '寻衅滋事罪', sentence: '有期徒刑1年6个月', releaseDate: d(-7),
          prisonPerformance: '表现较差，有3次违规记录，需重点关注',
          riskLevel: null, serviceType: null, serviceChoiceMade: false,
          address: '北京市西城区西长安街1号', occupation: '待业', maritalStatus: '未婚',
          province: '北京市', city: '北京市', region: '北京市·北京市',
          createdBy: 'u_police', createdAt: d(-50)
        }
      ],
      updates: [
        { id: 'up1', personId: 'p1', timePoint: '1month', timePointLabel: '刑满释放后1个月',
          address: '北京市朝阳区建国路88号', occupation: '销售员', maritalStatus: '未婚',
          submittedAt: d(-25) }
      ],
      questions: [
        { id: 'q1', personId: 'p1', personName: '张三', category: '心理',
          title: '如何调整出狱后的心态', content: '出狱后总感觉无法融入社会，经常焦虑失眠，请问如何调整？',
          status: 'replied', reply: '建议您多参加社区组织的互助活动，逐步建立自信心。如失眠严重，可前往医院心理科就诊。同时保持规律作息，适当运动。',
          replierName: '心理咨询师 刘医生', repliedAt: d(-3), createdAt: d(-10) },
        { id: 'q2', personId: 'p2', personName: '李四', category: '法律',
          title: '劳动合同纠纷咨询', content: '我在工厂工作了3个月，老板一直不签合同，也不交社保，该怎么办？',
          status: 'pending', reply: null, replierName: null, repliedAt: null, createdAt: d(-5) }
      ],
      reminders: [
        { id: 'r1', personId: 'p2', personName: '李四', releaseDate: d(-15),
          stage: '30day', message: '李四将于' + d(-15) + '刑满释放，请司法行政部门确认接送安排。',
          confirmed: true, confirmedAt: d(-20), createdBy: 'u_prison', createdAt: d(-45) }
      ],
      jobs: [
        { id: 'j1', company: '华为技术有限公司', position: '装配工', salary: '4500-6000元/月',
          location: '深圳', requirement: '身体健康，能吃苦耐劳，无不良记录', publishDate: d(-5), createdBy: 'u_judicial' },
        { id: 'j2', company: '京东物流', position: '分拣员', salary: '3500-5000元/月',
          location: '北京', requirement: '能适应夜班，工作认真负责', publishDate: d(-3), createdBy: 'u_judicial' },
        { id: 'j3', company: '比亚迪股份有限公司', position: '生产操作工', salary: '5000-7000元/月',
          location: '深圳', requirement: '身体健康，服从管理，可接受倒班', publishDate: d(-4), createdBy: 'u_hrss' },
        { id: 'j4', company: '美团配送', position: '外卖骑手', salary: '6000-9000元/月',
          location: '南昌', requirement: '会使用智能手机，熟悉当地路况', publishDate: d(-2), createdBy: 'u_hrss' }
      ],
      trainings: [
        { id: 't1', school: '南昌市高级技工学校', major: '电工技能培训', location: '南昌市青山湖区', startDate: '2026-09-15', quota: 30, requirement: '年满16周岁，身体健康' },
        { id: 't2', school: '赣州市就业训练中心', major: '中式烹饪培训', location: '赣州市章贡区', startDate: '2026-09-20', quota: 20, requirement: '有意从事餐饮行业' },
        { id: 't3', school: '江西省机电技师学院', major: '新能源汽车维修', location: '南昌市新建区', startDate: '2026-10-10', quota: 25, requirement: '初中以上学历' },
        { id: 't4', school: '南昌市东湖区就业训练中心', major: '家政服务培训', location: '南昌市东湖区', startDate: '2026-09-28', quota: 40, requirement: '身体健康' },
        { id: 't5', school: '深圳市技工学校', major: '物流仓储管理', location: '深圳市龙岗区', startDate: '2026-10-15', quota: 30, requirement: '初中以上学历' }
      ],
      reports: [],
      policies: [
        { id: 'pol1', title: '关于进一步做好刑释人员安置帮教工作的通知',
          content: '为进一步加强刑释人员安置帮教工作，现就有关事项通知如下：\n一、提高认识，加强组织领导\n二、完善衔接机制，确保无缝对接\n三、强化就业帮扶，拓宽就业渠道\n四、加强心理辅导，促进顺利回归\n五、完善信息管理，建立跟踪机制',
          region: '全国', publishDate: d(-10), createdBy: 'u_judicial' },
        { id: 'pol2', title: '2026年安置帮教工作要点',
          content: '2026年安置帮教工作将重点围绕以下几个方面展开：\n1. 推进"阳光帮扶"工程\n2. 加强就业技能培训\n3. 完善社会力量参与机制\n4. 强化信息化管理手段',
          region: '全国', publishDate: d(-2), createdBy: 'u_judicial' },
        { id: 'pol3', title: '江西省刑释人员就业创业帮扶若干措施',
          content: '为进一步做好我省刑释人员就业创业帮扶工作，现提出以下措施：\n一、落实一次性创业补贴政策\n二、创业担保贷款优先支持\n三、组织技能培训并落实培训补贴\n四、搭建企业与刑释人员就业对接平台',
          region: '江西省', publishDate: d(-6), createdBy: 'u_hrss' },
        { id: 'pol4', title: '广东省刑释人员社会救助申请指引',
          content: '为保障刑释人员基本生活，现就相关救助申请明确如下：\n一、符合条件的可申请特困人员救助供养\n二、生活困难的按规定纳入低保范围\n三、申请渠道：户籍地或居住地乡镇（街道）民政窗口\n四、提供刑满释放证明等材料可优先受理',
          region: '广东省', publishDate: d(-4), createdBy: 'u_civil' }
      ],
      logs: []
    };
    saveDB(db);
    return db;
  }

  function addLog(action, user) {
    const db = getDB();
    db.logs.unshift({
      time: new Date().toLocaleString('zh-CN'),
      user: user ? user.name : '系统',
      action
    });
    if (db.logs.length > 200) db.logs.pop();
    saveDB(db);
  }

  function genId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  // ===== 用户认证 =====
  function login(username, password) {
    const db = getDB();
    const u = db.users.find(x => x.username === username && x.password === password);
    return u || null;
  }

  function getCurrentUser() {
    const raw = sessionStorage.getItem('anzhuang_current_user');
    return raw ? JSON.parse(raw) : null;
  }

  function setCurrentUser(user) {
    if (user) sessionStorage.setItem('anzhuang_current_user', JSON.stringify(user));
    else sessionStorage.removeItem('anzhuang_current_user');
  }

  // ===== 人员档案 =====
  function getPersons() { return getDB().persons; }

  function getPerson(id) {
    return getDB().persons.find(p => p.id === id);
  }

  function addPerson(person, user) {
    const db = getDB();
    const p = {
      id: genId('p'),
      ...person,
      createdBy: user ? user.id : null,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.persons.push(p);
    saveDB(db);
    addLog('上传档案：' + p.name, user);
    return p;
  }

  function updatePerson(id, updates, user) {
    const db = getDB();
    const p = db.persons.find(x => x.id === id);
    if (p) {
      Object.assign(p, updates);
      saveDB(db);
      addLog('更新档案：' + p.name, user);
    }
    return p;
  }

  function setRiskLevel(id, level, user) {
    const p = updatePerson(id, { riskLevel: level }, user);
    addLog('评定' + p.name + '为' + (level === 'high' ? '高风险' : '低风险'), user);
  }

  function chooseService(id, type, user) {
    const p = updatePerson(id, { serviceType: type, serviceChoiceMade: true }, user);
    addLog(p.name + '选择' + (type === 'strict' ? '严格' : '灵活') + '帮教服务', user);
  }

  // ===== 信息更新 =====
  function getUpdatesByPerson(personId) {
    return getDB().updates.filter(u => u.personId === personId);
  }

  function addUpdate(update, user) {
    const db = getDB();
    const u = {
      id: genId('up'),
      ...update,
      submittedAt: new Date().toISOString().slice(0, 10)
    };
    db.updates.push(u);
    saveDB(db);
    addLog('提交信息更新：' + u.timePointLabel, user);
    return u;
  }

  // ===== 疑问 =====
  function getQuestions() { return getDB().questions; }

  function getQuestionsByPerson(personId) {
    return getDB().questions.filter(q => q.personId === personId);
  }

  function getPendingQuestions() {
    return getDB().questions.filter(q => q.status === 'pending');
  }

  function addQuestion(question, user) {
    const db = getDB();
    const person = db.persons.find(p => p.id === question.personId);
    const q = {
      id: genId('q'),
      ...question,
      personName: person ? person.name : '未知',
      status: 'pending',
      reply: null,
      replierName: null,
      repliedAt: null,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.questions.push(q);
    saveDB(db);
    addLog('提交疑问：' + q.title, user);
    return q;
  }

  function replyQuestion(id, reply, replierName, user) {
    const db = getDB();
    const q = db.questions.find(x => x.id === id);
    if (q) {
      q.status = 'replied';
      q.reply = reply;
      q.replierName = replierName;
      q.repliedAt = new Date().toISOString().slice(0, 10);
      saveDB(db);
      addLog('回复疑问：' + q.title, user);
    }
    return q;
  }

  // ===== 接送确认提醒 =====
  function getReminders() { return getDB().reminders; }

  function getPendingReminders() {
    return getDB().reminders.filter(r => !r.confirmed);
  }

  function addReminder(reminder, user) {
    const db = getDB();
    const r = {
      id: genId('r'),
      ...reminder,
      confirmed: false,
      confirmedAt: null,
      createdBy: user ? user.id : null,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.reminders.push(r);
    saveDB(db);
    addLog('发送接送确认提醒：' + r.personName, user);
    return r;
  }

  function confirmReminder(id, user) {
    const db = getDB();
    const r = db.reminders.find(x => x.id === id);
    if (r) {
      r.confirmed = true;
      r.confirmedAt = new Date().toISOString().slice(0, 10);
      saveDB(db);
      addLog('确认接送：' + r.personName, user);
    }
    return r;
  }

  // ===== 招聘信息 =====
  function getJobs() { return getDB().jobs; }

  function addJob(job, user) {
    const db = getDB();
    const j = {
      id: genId('j'),
      ...job,
      publishDate: new Date().toISOString().slice(0, 10),
      createdBy: user ? user.id : null
    };
    db.jobs.push(j);
    saveDB(db);
    addLog('发布招聘：' + j.company, user);
    return j;
  }

  function deleteJob(id, user) {
    const db = getDB();
    const idx = db.jobs.findIndex(x => x.id === id);
    if (idx >= 0) {
      addLog('删除招聘：' + db.jobs[idx].company, user);
      db.jobs.splice(idx, 1);
      saveDB(db);
    }
  }

  // ===== 政策 =====
  function getPolicies() { return getDB().policies; }

  function addPolicy(policy, user) {
    const db = getDB();
    const p = {
      id: genId('pol'),
      ...policy,
      publishDate: new Date().toISOString().slice(0, 10),
      createdBy: user ? user.id : null
    };
    db.policies.push(p);
    saveDB(db);
    addLog('发布政策：' + p.title, user);
    return p;
  }

  // ===== 技校培训 =====
  function getTrainings() { return getDB().trainings || []; }

  function addTraining(training, user) {
    const db = getDB();
    const t = {
      id: genId('tr'),
      ...training,
      publishDate: new Date().toISOString().slice(0, 10),
      createdBy: user ? user.id : null
    };
    db.trainings = db.trainings || [];
    db.trainings.push(t);
    saveDB(db);
    addLog('发布培训信息：' + t.major + '（' + t.school + '）', user);
    return t;
  }

  function deleteTraining(id, user) {
    const db = getDB();
    const list = db.trainings || [];
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
      addLog('删除培训信息：' + list[idx].major + '（' + list[idx].school + '）', user);
      list.splice(idx, 1);
      saveDB(db);
    }
  }

  function signTraining(id, personId, user) {
    const db = getDB();
    const t = (db.trainings || []).find(x => x.id === id);
    if (t) {
      t.signups = t.signups || [];
      if (!t.signups.includes(personId)) t.signups.push(personId);
      saveDB(db);
      addLog('培训报名：' + t.major + '（' + t.school + '）', user);
    }
    return t;
  }

  // ===== 违法举报 =====
  function getReports() { return getDB().reports || []; }

  function getReportsByPerson(personId) {
    return (getDB().reports || []).filter(r => r.personId === personId);
  }

  function updateReportStatus(id, status, reply, user) {
    const db = getDB();
    const r = (db.reports || []).find(x => x.id === id);
    if (r) {
      r.status = status;
      if (reply !== undefined) r.reply = reply;
      r.updatedAt = new Date().toISOString().slice(0, 10);
      saveDB(db);
      addLog('处理举报：' + r.company + '（' + status + '）', user);
    }
    return r;
  }

  function addReport(report, user) {
    const db = getDB();
    const r = {
      id: genId('rep'),
      ...report,
      status: '待处理',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.reports = db.reports || [];
    db.reports.push(r);
    saveDB(db);
    addLog('提交违法举报：' + r.company, user);
    return r;
  }

  // ===== 演示数据填充（裁判文书风格匿名化数据） =====
  const DEMO_SEED_FLAG = 'azbj_demo_seed_v1';

  function ensureDemoData() {
    try {
      if (localStorage.getItem(DEMO_SEED_FLAG)) return { added: 0 };
      const db = getDB();
      if ((db.persons || []).length >= 20) { localStorage.setItem(DEMO_SEED_FLAG, '1'); return { added: 0 }; }

      const surnames = ['王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','马','朱','胡','郭','何','罗','高','林'];
      const crimeList = [
        ['盗窃罪', 30], ['故意伤害罪', 60], ['寻衅滋事罪', 50], ['聚众斗殴罪', 55],
        ['诈骗罪', 45], ['危险驾驶罪', 40], ['交通肇事罪', 35], ['贩卖毒品罪', 80],
        ['组织卖淫罪', 75], ['抢劫罪', 70], ['开设赌场罪', 50], ['非法拘禁罪', 50],
        ['掩饰、隐瞒犯罪所得罪', 40], ['帮助信息网络犯罪活动罪', 42]
      ];
      const regions = [
        ['江西省', '南昌市'], ['江西省', '赣州市'], ['江西省', '九江市'], ['江西省', '上饶市'],
        ['江西省', '宜春市'], ['江西省', '吉安市'], ['江西省', '抚州市'], ['江西省', '景德镇市'],
        ['江西省', '萍乡市'], ['江西省', '新余市'], ['江西省', '鹰潭市'],
        ['广东省', '深圳市'], ['广东省', '广州市'], ['广东省', '东莞市'], ['广东省', '佛山市'],
        ['浙江省', '杭州市'], ['浙江省', '宁波市'], ['浙江省', '温州市'],
        ['江苏省', '南京市'], ['福建省', '厦门市'], ['上海市', '上海市'], ['北京市', '北京市'],
        ['四川省', '成都市'], ['湖南省', '长沙市'], ['湖北省', '武汉市'], ['山东省', '青岛市']
      ];
      const perfs = [
        '表现良好，积极参加教育改造，无违规记录',
        '服从管理，改造态度端正',
        '表现一般，有1次违规，经教育后改正',
        '表现较差，有多次违规记录，需重点关注'
      ];
      const occupations = ['待业', '销售员', '工厂工人', '外卖骑手', '快递员', '厨师', '保安', '个体经营'];
      const districts = ['青山湖区', '红谷滩区', '章贡区', '浔阳区', '信州区', '袁州区', '吉州区', '临川区', '珠山区', '安源区', '渝水区', '月湖区'];
      const streets = ['解放路', '建设路', '中山路', '和平路', '朝阳街', '滨江路', '文化巷', '人民大道'];

      let seed = 20260831;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
      function randInt(min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
      function sentenceOf(score) {
        if (score >= 75) return pick(['有期徒刑7年', '有期徒刑10年', '有期徒刑15年', '无期徒刑']);
        if (score >= 55) return pick(['有期徒刑3年', '有期徒刑3年6个月', '有期徒刑5年', '有期徒刑6年']);
        if (score >= 40) return pick(['有期徒刑1年', '有期徒刑1年6个月', '有期徒刑2年', '有期徒刑2年6个月']);
        return pick(['拘役4个月', '拘役6个月', '有期徒刑8个月', '有期徒刑10个月']);
      }
      function phoneOf() {
        let p = '1' + pick(['3', '5', '7', '8', '9']);
        for (let i = 0; i < 9; i++) p += Math.floor(rnd() * 10);
        return p;
      }

      const today = new Date();
      const iso = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
      const added = [];
      const total = 26;
      for (let i = 0; i < total; i++) {
        const crime = pick(crimeList);
        const rg = pick(regions);
        const prov = rg[0], city = rg[1];
        const gender = rnd() < 0.82 ? '男' : '女';
        const age = randInt(21, 54);
        const riskSeed = crime[1] + (perfs.indexOf(pick(perfs)) >= 2 ? 15 : 0);
        const riskLevel = riskSeed >= 65 ? 'high' : riskSeed >= 48 ? 'medium' : 'low';
        const releaseOffset = randInt(-85, 55);
        const p = {
          id: 'seedp_' + (i + 1),
          name: pick(surnames) + '某某',
          gender: gender, age: age,
          idCard: String(randInt(110101, 361199)) + String(randInt(19800101, 20031231)) + String(randInt(1000, 9999)),
          crime: crime[0],
          sentence: sentenceOf(crime[1]),
          releaseDate: iso(releaseOffset),
          prisonPerformance: pick(perfs),
          riskLevel: riskLevel,
          serviceType: riskLevel === 'high' ? 'strict' : pick(['flexible', 'flexible', 'strict']),
          serviceChoiceMade: true,
          address: city + '市' + pick(districts) + pick(streets) + randInt(1, 199) + '号',
          occupation: pick(occupations),
          maritalStatus: pick(['未婚', '未婚', '已婚', '已婚', '离异']),
          phone: phoneOf(),
          province: prov, city: city, region: prov + '·' + city,
          createdBy: 'u_police',
          createdAt: iso(releaseOffset - randInt(30, 90))
        };
        db.persons.push(p);
        added.push(p);
        // 部分人员有信息更新记录
        if (rnd() < 0.65) {
          const tp = rnd() < 0.55 ? '1month' : rnd() < 0.5 ? '6month' : '1year';
          db.updates.push({
            id: genId('up'), personId: p.id, timePoint: tp,
            timePointLabel: tp === '1month' ? '刑满释放后1个月' : tp === '6month' ? '刑满释放后6个月' : '刑满释放后1年',
            address: p.address, occupation: p.occupation, maritalStatus: p.maritalStatus,
            phone: p.phone, income: pick(['无收入', '2000元以下', '2000-5000元', '2000-5000元', '5000元以上']),
            skills: pick(['电工', '驾驶', '烹饪', '物流分拣', '家政服务', '']),
            employmentIntent: pick(['制造业岗位', '服务业岗位', '物流配送', '']),
            submittedAt: iso(randInt(-60, -2))
          });
        }
        // 部分未释放人员生成接送提醒
        if (releaseOffset > 0 && rnd() < 0.5) {
          db.reminders.push({
            id: genId('r'), personId: p.id, personName: p.name, releaseDate: p.releaseDate,
            stage: pick(['30day', '15day', '7day']),
            message: p.name + '将于' + p.releaseDate + '刑满释放，请司法行政部门确认接送安排。',
            confirmed: rnd() < 0.4, confirmedAt: rnd() < 0.4 ? iso(-1) : null,
            createdBy: 'u_prison', createdAt: iso(-randInt(2, 20))
          });
        }
      }
      // 补充几条待回复疑问与举报记录，让各端口有数据可看
      const qPersons = db.persons.slice(0, 3);
      qPersons.forEach((p, idx) => {
        db.questions.push({
          id: genId('q'), personId: p.id, personName: p.name,
          category: idx === 1 ? '法律' : '心理',
          title: idx === 1 ? '工厂拖欠工资如何维权' : '出狱后如何调整心态重新生活',
          content: idx === 1 ? '我在工厂工作两个月，老板一直拖欠工资不发，也没有签劳动合同，我该怎么办？' : '出狱后总觉得被社会排斥，找工作屡屡碰壁，情绪很低落，请问如何调整？',
          status: 'pending', reply: null, replierName: null, repliedAt: null,
          createdAt: iso(-randInt(2, 6))
        });
      });
      db.reports.push({
        id: genId('rep'), personId: db.persons[0].id, personName: db.persons[0].name,
        company: '某建筑工程有限公司', address: '市经开区建设大道66号', phone: '0791-88XXXXXX',
        time: iso(-12), detail: '单位以试用期为由不签劳动合同，且连续两个月未足额发放工资。',
        evidence: null, status: '待处理', createdAt: iso(-3)
      });
      saveDB(db);
      localStorage.setItem(DEMO_SEED_FLAG, '1');
      return { added: added.length };
    } catch (e) {
      return { added: 0, error: e.message };
    }
  }

  // ===== 日志 =====
  function getLogs() { return getDB().logs; }

  // ===== 重置数据（开发用） =====
  function resetDB() {
    localStorage.removeItem(DB_KEY);
  }

  return {
    login, getCurrentUser, setCurrentUser,
    getPersons, getPerson, addPerson, updatePerson, setRiskLevel, chooseService,
    getUpdatesByPerson, addUpdate,
    getQuestions, getQuestionsByPerson, getPendingQuestions, addQuestion, replyQuestion,
    getReminders, getPendingReminders, addReminder, confirmReminder,
    getJobs, addJob, deleteJob,
    getPolicies, addPolicy,
    getTrainings, addTraining, deleteTraining, signTraining,
    getReports, getReportsByPerson, addReport, updateReportStatus,
    ensureDemoData,
    getLogs, resetDB
  };
})();
