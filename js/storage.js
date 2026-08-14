/**
 * 安置帮教综合管理平台 - 数据存储层
 * 使用 localStorage 模拟后端数据存储
 */
const Storage = (function () {
  const DB_KEY = 'anzhuang_bangjiao_db';

  function getDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return initDB();
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
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
          createdBy: 'u_police', createdAt: d(-60)
        },
        {
          id: 'p2', name: '李四', gender: '男', age: 35, idCard: '110105198905055678',
          crime: '故意伤害罪', sentence: '有期徒刑3年6个月', releaseDate: d(-15),
          prisonPerformance: '表现一般，有过1次违规，经教育后改正',
          riskLevel: 'high', serviceType: 'strict', serviceChoiceMade: true,
          address: '北京市海淀区中关村大街1号', occupation: '待业', maritalStatus: '已婚',
          createdBy: 'u_police', createdAt: d(-90)
        },
        {
          id: 'p3', name: '王五', gender: '男', age: 22, idCard: '110108200203039012',
          crime: '寻衅滋事罪', sentence: '有期徒刑1年6个月', releaseDate: d(-7),
          prisonPerformance: '表现较差，有3次违规记录，需重点关注',
          riskLevel: null, serviceType: null, serviceChoiceMade: false,
          address: '北京市西城区西长安街1号', occupation: '待业', maritalStatus: '未婚',
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
          location: '北京', requirement: '能适应夜班，工作认真负责', publishDate: d(-3), createdBy: 'u_judicial' }
      ],
      policies: [
        { id: 'pol1', title: '关于进一步做好刑释人员安置帮教工作的通知',
          content: '为进一步加强刑释人员安置帮教工作，现就有关事项通知如下：\n一、提高认识，加强组织领导\n二、完善衔接机制，确保无缝对接\n三、强化就业帮扶，拓宽就业渠道\n四、加强心理辅导，促进顺利回归\n五、完善信息管理，建立跟踪机制',
          publishDate: d(-10), createdBy: 'u_judicial' },
        { id: 'pol2', title: '2026年安置帮教工作要点',
          content: '2026年安置帮教工作将重点围绕以下几个方面展开：\n1. 推进"阳光帮扶"工程\n2. 加强就业技能培训\n3. 完善社会力量参与机制\n4. 强化信息化管理手段',
          publishDate: d(-2), createdBy: 'u_judicial' }
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
    getLogs, resetDB
  };
})();
