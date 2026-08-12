/**
 * 数据存储层 - 使用 localStorage 模拟后端数据库
 * 提供各端口数据的增删改查操作
 */
const Storage = (function () {
  const DB_KEY = 'anzhuang_bangjiao_db';

  // 默认初始数据
  const DEFAULT_DATA = {
    // 用户账号 (角色: police/prison/judicial/released/volunteer)
    users: [
      { id: 'u_police_1', username: 'police', password: '123456', role: 'police', name: '张警官', org: '市公安局' },
      { id: 'u_prison_1', username: 'prison', password: '123456', role: 'prison', name: '李狱警', org: '市监狱' },
      { id: 'u_judicial_1', username: 'judicial', password: '123456', role: 'judicial', name: '王司法', org: '市司法局' },
      { id: 'u_volunteer_1', username: 'volunteer', password: '123456', role: 'volunteer', name: '志愿者公共账号', org: '社会志愿者协会' },
      // 刑释人员账号
      { id: 'u_released_1', username: 'released1', password: '123456', role: 'released', personId: 'p_1', name: '陈某某' },
      { id: 'u_released_2', username: 'released2', password: '123456', role: 'released', personId: 'p_2', name: '林某某' },
      { id: 'u_released_3', username: 'released3', password: '123456', role: 'released', personId: 'p_3', name: '黄某某' }
    ],

    // 刑释人员档案
    persons: [
      {
        id: 'p_1',
        name: '陈某某',
        gender: '男',
        age: 35,
        idCard: '3301**********1234',
        crime: '盗窃罪',
        sentence: '有期徒刑3年',
        releaseDate: '2025-09-01',
        prisonPerformance: '表现良好，积极参加劳动改造',
        riskLevel: 'low', // low / high
        serviceType: 'flexible', // flexible(灵活) / strict(严格)
        serviceChoiceMade: true,
        address: '杭州市西湖区',
        occupation: '待业',
        maritalStatus: '未婚',
        createdAt: '2025-08-01',
        createdBy: 'u_police_1'
      },
      {
        id: 'p_2',
        name: '林某某',
        gender: '男',
        age: 42,
        idCard: '3301**********5678',
        crime: '故意伤害罪',
        sentence: '有期徒刑5年',
        releaseDate: '2025-08-25',
        prisonPerformance: '表现一般，曾有一次违纪',
        riskLevel: 'high',
        serviceType: 'strict',
        serviceChoiceMade: true,
        address: '宁波市海曙区',
        occupation: '个体经营',
        maritalStatus: '离异',
        createdAt: '2025-07-15',
        createdBy: 'u_police_1'
      },
      {
        id: 'p_3',
        name: '黄某某',
        gender: '女',
        age: 28,
        idCard: '3301**********9012',
        crime: '诈骗罪',
        sentence: '有期徒刑2年',
        releaseDate: '2025-08-10',
        prisonPerformance: '表现优秀，获得减刑',
        riskLevel: 'low',
        serviceType: 'flexible',
        serviceChoiceMade: true,
        address: '温州市鹿城区',
        occupation: '公司职员',
        maritalStatus: '已婚',
        createdAt: '2025-06-20',
        createdBy: 'u_police_1'
      }
    ],

    // 接送确认提醒 (监狱 -> 司法)
    reminders: [
      {
        id: 'r_1',
        personId: 'p_2',
        personName: '林某某',
        releaseDate: '2025-08-25',
        stage: '30day', // 30day / 15day / 7day
        message: '林某某将于2025-08-25刑满释放，请司法行政部门确认接送安排。',
        confirmed: false,
        confirmedAt: null,
        createdAt: '2025-07-26',
        createdBy: 'u_prison_1'
      },
      {
        id: 'r_2',
        personId: 'p_3',
        personName: '黄某某',
        releaseDate: '2025-08-10',
        stage: '15day',
        message: '黄某某将于2025-08-10刑满释放，请司法行政部门确认接送安排。',
        confirmed: true,
        confirmedAt: '2025-07-30',
        createdAt: '2025-07-26',
        createdBy: 'u_prison_1'
      }
    ],

    // 政策信息
    policies: [
      {
        id: 'pol_1',
        title: '关于进一步做好刑满释放人员安置帮教工作的通知',
        content: '为切实做好刑满释放人员安置帮教工作，促进其顺利融入社会，现就有关事项通知如下：一、加强衔接配合...二、落实帮扶措施...三、强化跟踪管理...',
        publishDate: '2025-07-01',
        publishedBy: 'u_judicial_1'
      },
      {
        id: 'pol_2',
        title: '2025年度安置帮教专项资金使用管理办法',
        content: '为规范安置帮教专项资金使用管理，提高资金使用效益，制定本办法。资金主要用于：就业培训、临时救助、心理辅导等。',
        publishDate: '2025-06-15',
        publishedBy: 'u_judicial_1'
      }
    ],

    // 企业招聘信息 (由人社部门发送，司法部门筛选上传)
    jobs: [
      {
        id: 'j_1',
        company: '杭州XX制造有限公司',
        position: '普工',
        salary: '4000-6000元/月',
        location: '杭州市余杭区',
        requirement: '身体健康，能适应倒班，无犯罪记录要求（安置帮教对象优先）',
        publishDate: '2025-08-01',
        publishedBy: 'u_judicial_1'
      },
      {
        id: 'j_2',
        company: '宁波YY餐饮集团',
        position: '后厨帮工',
        salary: '3500-5000元/月',
        location: '宁波市鄞州区',
        requirement: '吃苦耐劳，有健康证，欢迎安置帮教对象应聘',
        publishDate: '2025-07-28',
        publishedBy: 'u_judicial_1'
      }
    ],

    // 疑问 (刑释人员 -> 志愿者)
    questions: [
      {
        id: 'q_1',
        personId: 'p_1',
        personName: '陈某某',
        category: '心理', // 心理 / 法律
        title: '出狱后总是感觉焦虑，怎么办？',
        content: '刑满释放回家后，总觉得周围人用异样眼光看我，晚上失眠，心情低落，请问该如何调整？',
        createdAt: '2025-08-05',
        status: 'replied', // pending / replied
        reply: '您好，感谢您的信任。您所感受到的焦虑和失眠是刑释人员回归社会初期常见的心理反应，建议您：1.保持规律作息；2.主动与家人沟通；3.可到当地心理咨询机构接受专业辅导。如持续不适，可联系司法部门协调就医。',
        repliedAt: '2025-08-08',
        repliedBy: 'u_volunteer_1',
        replierName: '心理咨询师 张医生'
      },
      {
        id: 'q_2',
        personId: 'p_3',
        personName: '黄某某',
        category: '法律',
        title: '前科记录可以申请消除吗？',
        content: '请问我的犯罪记录是否可以申请消除？对今后找工作有什么影响？',
        createdAt: '2025-08-09',
        status: 'pending',
        reply: null,
        repliedAt: null,
        repliedBy: null,
        replierName: null
      }
    ],

    // 信息更新记录 (特定时间节点)
    updates: [
      {
        id: 'upd_1',
        personId: 'p_3',
        personName: '黄某某',
        timePoint: '1month', // 1month/3month/6month/1year/3year/5year
        timePointLabel: '刑满释放后1个月',
        address: '温州市鹿城区',
        occupation: '公司职员',
        maritalStatus: '已婚',
        submittedAt: '2025-08-10'
      }
    ],

    // 操作日志
    logs: []
  };

  function load() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function save(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  let data = load();

  function persist() {
    save(data);
  }

  function genId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  function addLog(action, user) {
    data.logs.unshift({
      id: genId('log'),
      action,
      user: user ? user.name : '系统',
      time: new Date().toLocaleString('zh-CN')
    });
    if (data.logs.length > 200) data.logs.length = 200;
    persist();
  }

  // ===== 公开 API =====
  return {
    reset() {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      persist();
    },
    getData() { return data; },

    // 用户认证
    login(username, password) {
      const u = data.users.find(x => x.username === username && x.password === password);
      return u ? JSON.parse(JSON.stringify(u)) : null;
    },

    getCurrentUser() {
      const raw = sessionStorage.getItem('current_user');
      return raw ? JSON.parse(raw) : null;
    },
    setCurrentUser(u) {
      if (u) sessionStorage.setItem('current_user', JSON.stringify(u));
      else sessionStorage.removeItem('current_user');
    },

    // 刑释人员
    getPersons() { return JSON.parse(JSON.stringify(data.persons)); },
    getPerson(id) { return JSON.parse(JSON.stringify(data.persons.find(p => p.id === id))); },
    addPerson(p, user) {
      p.id = genId('p_');
      p.createdAt = new Date().toISOString().slice(0, 10);
      p.createdBy = user.id;
      data.persons.push(p);
      // 自动传送至监狱：在日志中记录
      addLog(`公安上传刑释人员【${p.name}】档案并传送至监狱系统`, user);
      persist();
      return JSON.parse(JSON.stringify(p));
    },
    updatePerson(id, patch, user) {
      const p = data.persons.find(x => x.id === id);
      if (!p) return null;
      Object.assign(p, patch);
      persist();
      return JSON.parse(JSON.stringify(p));
    },

    // 提醒 (监狱->司法)
    getReminders() { return JSON.parse(JSON.stringify(data.reminders)); },
    getPendingReminders() {
      return JSON.parse(JSON.stringify(data.reminders.filter(r => !r.confirmed)));
    },
    addReminder(r, user) {
      r.id = genId('r_');
      r.confirmed = false;
      r.confirmedAt = null;
      r.createdAt = new Date().toISOString().slice(0, 10);
      r.createdBy = user.id;
      data.reminders.push(r);
      addLog(`监狱发送【${r.personName}】接送确认提醒至司法行政部门`, user);
      persist();
      return JSON.parse(JSON.stringify(r));
    },
    confirmReminder(id, user) {
      const r = data.reminders.find(x => x.id === id);
      if (!r) return null;
      r.confirmed = true;
      r.confirmedAt = new Date().toLocaleString('zh-CN');
      addLog(`司法行政部门确认【${r.personName}】接送安排`, user);
      persist();
      return JSON.parse(JSON.stringify(r));
    },

    // 风险评级
    setRiskLevel(personId, level, user) {
      const p = data.persons.find(x => x.id === personId);
      if (!p) return null;
      p.riskLevel = level;
      // 高风险默认严格服务
      if (level === 'high') {
        p.serviceType = 'strict';
        p.serviceChoiceMade = true;
      }
      addLog(`司法行政部门将【${p.name}】风险评级设为${level === 'low' ? '低风险' : '高风险'}`, user);
      persist();
      return JSON.parse(JSON.stringify(p));
    },

    // 招聘信息
    getJobs() { return JSON.parse(JSON.stringify(data.jobs)); },
    addJob(j, user) {
      j.id = genId('j_');
      j.publishDate = new Date().toISOString().slice(0, 10);
      j.publishedBy = user.id;
      data.jobs.push(j);
      addLog(`司法行政部门发布招聘信息【${j.company}-${j.position}】`, user);
      persist();
      return JSON.parse(JSON.stringify(j));
    },
    deleteJob(id, user) {
      const idx = data.jobs.findIndex(x => x.id === id);
      if (idx >= 0) {
        const j = data.jobs[idx];
        data.jobs.splice(idx, 1);
        addLog(`司法行政部门删除招聘信息【${j.company}-${j.position}】`, user);
        persist();
        return true;
      }
      return false;
    },

    // 政策信息
    getPolicies() { return JSON.parse(JSON.stringify(data.policies)); },
    addPolicy(p, user) {
      p.id = genId('pol_');
      p.publishDate = new Date().toISOString().slice(0, 10);
      p.publishedBy = user.id;
      data.policies.push(p);
      addLog(`司法行政部门发布政策【${p.title}】`, user);
      persist();
      return JSON.parse(JSON.stringify(p));
    },

    // 疑问
    getQuestions() { return JSON.parse(JSON.stringify(data.questions)); },
    getPendingQuestions() {
      return JSON.parse(JSON.stringify(data.questions.filter(q => q.status === 'pending')));
    },
    getQuestionsByPerson(personId) {
      return JSON.parse(JSON.stringify(data.questions.filter(q => q.personId === personId)));
    },
    addQuestion(q, user) {
      q.id = genId('q_');
      q.createdAt = new Date().toISOString().slice(0, 10);
      q.status = 'pending';
      q.reply = null;
      q.repliedAt = null;
      q.repliedBy = null;
      q.replierName = null;
      const p = data.persons.find(x => x.id === q.personId);
      q.personName = p ? p.name : '未知';
      data.questions.push(q);
      addLog(`刑释人员【${q.personName}】提交${q.category}类疑问`, user);
      persist();
      return JSON.parse(JSON.stringify(q));
    },
    replyQuestion(id, reply, replierName, user) {
      const q = data.questions.find(x => x.id === id);
      if (!q) return null;
      q.reply = reply;
      q.repliedAt = new Date().toLocaleString('zh-CN');
      q.repliedBy = user.id;
      q.replierName = replierName;
      q.status = 'replied';
      addLog(`志愿者回复【${q.personName}】的疑问`, user);
      persist();
      return JSON.parse(JSON.stringify(q));
    },

    // 信息更新
    getUpdates() { return JSON.parse(JSON.stringify(data.updates)); },
    getUpdatesByPerson(personId) {
      return JSON.parse(JSON.stringify(data.updates.filter(u => u.personId === personId)));
    },
    addUpdate(u, user) {
      u.id = genId('upd_');
      u.submittedAt = new Date().toLocaleString('zh-CN');
      const p = data.persons.find(x => x.id === u.personId);
      u.personName = p ? p.name : '未知';
      // 同步更新人员基本信息
      if (p) {
        if (u.address) p.address = u.address;
        if (u.occupation) p.occupation = u.occupation;
        if (u.maritalStatus) p.maritalStatus = u.maritalStatus;
      }
      data.updates.push(u);
      addLog(`刑释人员【${u.personName}】更新${u.timePointLabel}信息`, user);
      persist();
      return JSON.parse(JSON.stringify(u));
    },

    // 服务选择 (刑释人员一个月内选择)
    chooseService(personId, serviceType, user) {
      const p = data.persons.find(x => x.id === personId);
      if (!p) return null;
      p.serviceType = serviceType;
      p.serviceChoiceMade = true;
      addLog(`刑释人员【${p.name}】选择${serviceType === 'flexible' ? '灵活' : '严格'}安置帮教服务`, user);
      persist();
      return JSON.parse(JSON.stringify(p));
    },

    // 日志
    getLogs() { return JSON.parse(JSON.stringify(data.logs)); }
  };
})();
