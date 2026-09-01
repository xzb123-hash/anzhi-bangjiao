/**
 * 安置帮教综合管理平台 - AI分析引擎
 * 风险评级建议、数据分析等智能功能
 */
const AI = (function () {

  // 罪行严重程度评分
  const CRIME_SCORES = {
    '盗窃罪': 30, '抢劫罪': 70, '故意伤害罪': 60, '故意杀人罪': 95,
    '强奸罪': 85, '寻衅滋事罪': 50, '聚众斗殴罪': 55, '诈骗罪': 45,
    '毒品犯罪': 80, '走私罪': 65, '贪污罪': 55, '受贿罪': 55,
    '交通肇事罪': 35, '危险驾驶罪': 40, '非法拘禁罪': 50,
    '拐卖妇女儿童罪': 90, '组织卖淫罪': 75, '开设赌场罪': 50
  };

  // 服刑表现评分
  function performanceScore(performance) {
    if (!performance) return 50;
    const p = performance;
    let score = 60;
    if (p.includes('良好') || p.includes('优秀')) score += 20;
    if (p.includes('一般')) score += 5;
    if (p.includes('较差') || p.includes('差')) score -= 15;
    if (p.includes('违规')) score -= 15;
    if (p.includes('多次违规') || p.includes('3次')) score -= 25;
    if (p.includes('积极参加') || p.includes('无违规')) score += 10;
    return Math.max(0, Math.min(100, score));
  }

  // 刑期评分（越长风险越高）
  function sentenceScore(sentence) {
    if (!sentence) return 50;
    const m = sentence.match(/(\d+)/);
    if (!m) return 50;
    const num = parseInt(m[1]);
    if (sentence.includes('死刑') || sentence.includes('无期')) return 90;
    if (sentence.includes('年')) {
      if (num >= 10) return 85;
      if (num >= 5) return 70;
      if (num >= 3) return 55;
      if (num >= 1) return 40;
      return 25;
    }
    if (sentence.includes('个月')) return 30;
    return 50;
  }

  // 年龄评分（青年和中年风险较高）
  function ageScore(age) {
    if (!age) return 50;
    if (age < 18) return 30;
    if (age >= 18 && age < 25) return 60;
    if (age >= 25 && age < 35) return 55;
    if (age >= 35 && age < 50) return 45;
    if (age >= 50) return 30;
    return 50;
  }

  // 婚姻状况评分
  function maritalScore(marital) {
    const scores = { '已婚': 30, '未婚': 55, '离异': 65, '丧偶': 50 };
    return scores[marital] || 50;
  }

  // 综合风险评级建议
  function riskSuggestion(person) {
    const crimeScore = CRIME_SCORES[person.crime] || 50;
    const perfScore = performanceScore(person.prisonPerformance);
    const sentScore = sentenceScore(person.sentence);
    const ageS = ageScore(person.age);
    const marScore = maritalScore(person.maritalStatus);

    // 加权计算总分
    const score = Math.round(
      crimeScore * 0.25 +
      perfScore * 0.25 +
      sentScore * 0.20 +
      ageS * 0.15 +
      marScore * 0.15
    );

    let level, levelText;
    if (score >= 60) { level = 'high'; levelText = '高风险'; }
    else { level = 'low'; levelText = '低风险'; }

    // 影响因素分析
    const factors = [];
    factors.push({
      factor: '所犯罪行',
      value: person.crime,
      impact: crimeScore >= 60 ? '高' : crimeScore >= 40 ? '中' : '低',
      desc: '罪行严重程度评估'
    });
    factors.push({
      factor: '狱内表现',
      value: person.prisonPerformance || '暂无记录',
      impact: perfScore >= 70 ? '低' : perfScore >= 50 ? '中' : '高',
      desc: '服刑期间改造表现'
    });
    factors.push({
      factor: '刑期长短',
      value: person.sentence || '暂无',
      impact: sentScore >= 60 ? '高' : sentScore >= 40 ? '中' : '低',
      desc: '刑期越长再犯风险越高'
    });
    factors.push({
      factor: '年龄因素',
      value: person.age + '岁',
      impact: ageS >= 55 ? '中' : '低',
      desc: '青年年龄段再犯率较高'
    });
    factors.push({
      factor: '婚姻状况',
      value: person.maritalStatus || '未知',
      impact: marScore >= 55 ? '中' : '低',
      desc: '家庭稳定性评估'
    });

    // AI建议
    let advice;
    if (level === 'high') {
      advice = '建议实行严格帮教服务，加强日常走访和心理辅导，定期进行法治教育，同时积极协助解决就业和家庭问题，降低再犯风险。';
    } else {
      advice = '建议实行灵活帮教服务，以自我报告为主，定期收集信息更新。重点提供就业推荐和社会适应指导，帮助顺利回归社会。';
    }

    return { level, levelText, score, factors, advice };
  }

  // 批量风险评级建议
  function riskSuggestionsAll() {
    const persons = Storage.getPersons();
    return persons.map(p => ({ person: p, suggestion: riskSuggestion(p) }));
  }

  // 数据分析统计
  function analyzeStats() {
    const persons = Storage.getPersons();
    const updates = [];
    persons.forEach(p => {
      const ups = Storage.getUpdatesByPerson(p.id);
      ups.forEach(u => updates.push(u));
    });

    const total = persons.length;
    const employed = persons.filter(p => p.occupation && p.occupation !== '待业' && p.occupation !== '无').length;
    const employmentRate = total > 0 ? Math.round(employed / total * 100) : 0;

    const addresses = persons.filter(p => p.address);
    const localAddresses = addresses.filter(p => p.address && (p.address.includes('北京') || p.address.includes('上海') || p.address.includes('广州')));
    const migrationRate = addresses.length > 0 ? Math.round((addresses.length - localAddresses.length) / addresses.length * 100) : 0;

    const married = persons.filter(p => p.maritalStatus === '已婚').length;
    const single = persons.filter(p => p.maritalStatus === '未婚').length;
    const divorced = persons.filter(p => p.maritalStatus === '离异').length;

    const highRisk = persons.filter(p => p.riskLevel === 'high').length;
    const lowRisk = persons.filter(p => p.riskLevel === 'low').length;

    const flexibleCount = persons.filter(p => p.serviceType === 'flexible').length;
    const strictCount = persons.filter(p => p.serviceType === 'strict').length;

    const timePoints = [
      { key: '1month', label: '1个月' },
      { key: '6month', label: '6个月' },
      { key: '1year', label: '1年' },
      { key: '3year', label: '3年' },
      { key: '5year', label: '5年' }
    ];

    const updateCompletion = timePoints.map(tp => {
      const completed = persons.filter(p =>
        Storage.getUpdatesByPerson(p.id).some(u => u.timePoint === tp.key)
      ).length;
      return {
        key: tp.key,
        label: '刑满释放后' + tp.label + '信息更新',
        completed,
        total,
        rate: total > 0 ? Math.round(completed / total * 100) : 0
      };
    });

    return {
      total,
      employmentRate,
      migrationRate,
      married,
      single,
      divorced,
      highRisk,
      lowRisk,
      flexibleCount,
      strictCount,
      updateCompletion
    };
  }

  // 解析豆包返回的 JSON 片段
  function parseJsonReply(text) {
    try { return JSON.parse(text); } catch (e) {}
    const m = String(text).match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
    return null;
  }

  // 豆包 AI 深度风险评级（规则评级为兜底）
  async function riskSuggestionAsync(person) {
    const base = riskSuggestion(person);
    try {
      const data = {
        name: person.name || '',
        age: person.age || '',
        gender: person.gender || '',
        crime: person.crime || '',
        sentence: person.sentence || '',
        prisonPerformance: person.prisonPerformance || '',
        maritalStatus: person.maritalStatus || '',
        occupation: person.occupation || '',
        ruleScore: base.score
      };
      const sys = '你是安置帮教领域的资深司法社工。请根据刑释人员信息给出风险评级建议，只输出 JSON：{"level":"high|low","score":0-100(整数), "analysis":"影响因素简要分析(100字内)", "advice":"帮教建议(150字内)"}';
      const reply = await XiaoAn.request([
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify(data) }
      ]);
      const parsed = parseJsonReply(reply);
      if (parsed && parsed.level && parsed.score !== undefined) {
        const level = parsed.level === 'high' ? 'high' : 'low';
        const score = Math.max(0, Math.min(100, parseInt(parsed.score, 10) || base.score));
        return {
          level,
          levelText: level === 'high' ? '高风险' : '低风险',
          score,
          analysis: parsed.analysis || '',
          advice: parsed.advice || base.advice,
          source: 'llm'
        };
      }
      return Object.assign({}, base, { source: 'rule', error: '豆包返回格式异常' });
    } catch (e) {
      return Object.assign({}, base, { source: 'rule', error: e.message });
    }
  }

  return { riskSuggestion, riskSuggestionsAll, analyzeStats, riskSuggestionAsync };
})();
