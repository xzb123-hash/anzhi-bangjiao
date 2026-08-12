/**
 * AI 数据分析模块
 * 1. 自动分析刑释人员反馈信息：就业率、异地居住率等
 * 2. AI 风险评级建议（结合所犯罪行、狱内表现、个人年龄等）
 */
const AI = (function () {

  // ===== 数据分析统计 =====
  function analyzeStats() {
    const persons = Storage.getPersons();
    const updates = Storage.getUpdates();
    const total = persons.length;

    // 就业率：根据最新信息更新或档案中的职业情况判断
    let employed = 0;
    persons.forEach(p => {
      const latest = updates
        .filter(u => u.personId === p.id)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
      const occ = latest ? latest.occupation : p.occupation;
      if (occ && occ !== '待业' && occ !== '无业' && occ !== '失业') employed++;
    });
    const employmentRate = total ? Math.round((employed / total) * 100) : 0;

    // 异地居住率：居住地与原登记地址不同（以最新更新为准，这里用"非本市"近似判断）
    let migrated = 0;
    persons.forEach(p => {
      const latest = updates
        .filter(u => u.personId === p.id)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
      const addr = latest ? latest.address : p.address;
      // 简单判断：与原始登记地不同城市视为异地
      if (latest && p.address && addr && !addr.startsWith(p.address.slice(0, 2))) migrated++;
    });
    const migrationRate = total ? Math.round((migrated / total) * 100) : 0;

    // 婚姻状况统计
    let married = 0, single = 0, divorced = 0;
    persons.forEach(p => {
      const latest = updates
        .filter(u => u.personId === p.id)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
      const ms = latest ? latest.maritalStatus : p.maritalStatus;
      if (ms === '已婚') married++;
      else if (ms === '离异') divorced++;
      else single++;
    });

    // 风险分布
    const highRisk = persons.filter(p => p.riskLevel === 'high').length;
    const lowRisk = persons.filter(p => p.riskLevel === 'low').length;

    // 各时间节点信息更新完成率
    const timePoints = [
      { key: '1month', label: '1个月' },
      { key: '3month', label: '3个月' },
      { key: '6month', label: '6个月' },
      { key: '1year', label: '1年' },
      { key: '3year', label: '3年' },
      { key: '5year', label: '5年' }
    ];
    const updateCompletion = timePoints.map(tp => {
      const count = updates.filter(u => u.timePoint === tp.key).length;
      return {
        ...tp,
        completed: count,
        rate: total ? Math.round((count / total) * 100) : 0
      };
    });

    // 服务类型分布
    const strictCount = persons.filter(p => p.serviceType === 'strict').length;
    const flexibleCount = persons.filter(p => p.serviceType === 'flexible').length;

    return {
      total,
      employmentRate,
      employed,
      migrationRate,
      migrated,
      married,
      single,
      divorced,
      highRisk,
      lowRisk,
      updateCompletion,
      strictCount,
      flexibleCount
    };
  }

  // ===== AI 风险评级建议 =====
  // 规则引擎：结合所犯罪行、狱内表现、个人年龄等给出建议
  const HIGH_RISK_CRIMES = ['故意伤害罪', '故意杀人罪', '抢劫罪', '强奸罪', '放火罪', '爆炸罪', '贩卖毒品罪', '黑社会性质组织罪', '绑架罪'];
  const MEDIUM_RISK_CRIMES = ['盗窃罪', '诈骗罪', '聚众斗殴罪', '寻衅滋事罪', '敲诈勒索罪'];

  function riskSuggestion(person) {
    let score = 50; // 基础分 0-100，越高风险越大
    const factors = [];

    // 1. 所犯罪行
    if (HIGH_RISK_CRIMES.includes(person.crime)) {
      score += 30;
      factors.push({ factor: '所犯罪行', value: person.crime, impact: '+30', desc: '属高风险罪名' });
    } else if (MEDIUM_RISK_CRIMES.includes(person.crime)) {
      score += 15;
      factors.push({ factor: '所犯罪行', value: person.crime, impact: '+15', desc: '属中风险罪名' });
    } else {
      score += 5;
      factors.push({ factor: '所犯罪行', value: person.crime, impact: '+5', desc: '属低风险罪名' });
    }

    // 2. 狱内表现
    const perf = person.prisonPerformance || '';
    if (perf.indexOf('减刑') >= 0 || perf.indexOf('优秀') >= 0 || perf.indexOf('良好') >= 0) {
      score -= 15;
      factors.push({ factor: '狱内表现', value: perf, impact: '-15', desc: '表现良好/优秀，有悔改表现' });
    } else if (perf.indexOf('违纪') >= 0 || perf.indexOf('较差') >= 0 || perf.indexOf('警告') >= 0) {
      score += 20;
      factors.push({ factor: '狱内表现', value: perf, impact: '+20', desc: '有违纪记录，改造态度欠佳' });
    } else if (perf.indexOf('一般') >= 0) {
      factors.push({ factor: '狱内表现', value: perf, impact: '+0', desc: '表现一般' });
    } else {
      factors.push({ factor: '狱内表现', value: perf || '未记录', impact: '+0', desc: '暂无记录' });
    }

    // 3. 年龄
    const age = person.age || 0;
    if (age < 25) {
      score += 12;
      factors.push({ factor: '年龄', value: age + '岁', impact: '+12', desc: '青年群体，再犯风险相对较高' });
    } else if (age > 55) {
      score -= 8;
      factors.push({ factor: '年龄', value: age + '岁', impact: '-8', desc: '中老年群体，社会危害风险较低' });
    } else {
      factors.push({ factor: '年龄', value: age + '岁', impact: '+0', desc: '中年群体，风险一般' });
    }

    // 4. 刑期长短
    const sentence = person.sentence || '';
    const yearMatch = sentence.match(/(\d+)年/);
    if (yearMatch) {
      const years = parseInt(yearMatch[1]);
      if (years >= 5) {
        score += 10;
        factors.push({ factor: '刑期', value: sentence, impact: '+10', desc: '刑期较长，社会脱节严重' });
      } else if (years <= 2) {
        score -= 5;
        factors.push({ factor: '刑期', value: sentence, impact: '-5', desc: '刑期较短，社会融入相对容易' });
      } else {
        factors.push({ factor: '刑期', value: sentence, impact: '+0', desc: '刑期中等' });
      }
    }

    // 5. 婚姻状况
    if (person.maritalStatus === '离异') {
      score += 8;
      factors.push({ factor: '婚姻状况', value: '离异', impact: '+8', desc: '家庭支持系统薄弱' });
    } else if (person.maritalStatus === '已婚') {
      score -= 6;
      factors.push({ factor: '婚姻状况', value: '已婚', impact: '-6', desc: '有家庭支持系统' });
    }

    // 限定范围
    score = Math.max(0, Math.min(100, score));

    let suggestion;
    if (score >= 65) {
      suggestion = {
        level: 'high',
        levelText: '高风险',
        score,
        factors,
        advice: '建议采取严格安置帮教服务，加强定期走访与信息核查，重点关注就业与社会融入情况，必要时协调心理辅导与就业帮扶。'
      };
    } else if (score >= 45) {
      suggestion = {
        level: 'medium',
        levelText: '中风险',
        score,
        factors,
        advice: '建议加强跟踪观察，根据释放后1个月内的实际表现动态调整帮教强度。'
      };
    } else {
      suggestion = {
        level: 'low',
        levelText: '低风险',
        score,
        factors,
        advice: '建议采取灵活安置帮教服务，按特定时间节点更新信息即可，鼓励其主动融入社会。'
      };
    }

    return suggestion;
  }

  // 对所有人员进行风险评级建议
  function riskSuggestionsAll() {
    const persons = Storage.getPersons();
    return persons.map(p => ({
      person: p,
      suggestion: riskSuggestion(p)
    }));
  }

  return {
    analyzeStats,
    riskSuggestion,
    riskSuggestionsAll
  };
})();
