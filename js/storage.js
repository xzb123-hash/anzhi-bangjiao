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
        if (db.applications === undefined) db.applications = [];
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

  function isoOffset(offset) {
    const dt = new Date();
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  }

  // 补充的部门政策（具体内容，供 initDB 与旧数据合并使用）
  const EXTRA_POLICIES = [
    { id: 'pol5', title: '刑释人员安置帮教工作实施细则（要点）',
      content: '一、衔接管理：刑满释放前30天、15天、7天，监狱应当向司法行政部门发送接送信息。\n二、帮教措施：根据风险等级实行严格、一般、灵活三类帮教，高风险人员实行"一人一策"重点帮教。\n三、权益保障：刑释人员依法享有就业、就医、住房、社保等权利，任何单位不得歧视。\n四、信息化管理：定期更新人员动态信息，及时掌握就业与居住变化。',
      region: '全国', publishDate: isoOffset(-18), createdBy: 'u_judicial' },
    { id: 'pol6', title: '江西省刑释人员过渡性安置基地补助办法',
      content: '一、对接收刑释人员就业的过渡性安置基地，按每人每月500元标准给予补助。\n二、基地需与刑释人员签订不少于6个月的劳动合同。\n三、补助资金由市县两级财政按比例分担。\n四、申请流程：基地向属地司法行政部门申报，审核通过后按季度拨付。',
      region: '江西省', publishDate: isoOffset(-9), createdBy: 'u_judicial' },
    { id: 'pol7', title: '就业援助对象认定与公益性岗位安置办法',
      content: '一、就业困难人员包括：登记失业的刑满释放人员、城镇零就业家庭成员等。\n二、经认定后可享受公益性岗位安置、社保补贴、岗位补贴。\n三、认定流程：本人申请→社区（村）初审→街道（乡镇）复核→人社部门认定。\n四、公益性岗位补贴标准不低于当地最低工资标准。',
      region: '全国', publishDate: isoOffset(-7), createdBy: 'u_hrss' },
    { id: 'pol8', title: '江西省一次性创业补贴申领指南',
      content: '一、对象：登记失业人员、刑满释放人员等首次创办小微企业或从事个体经营，正常经营满6个月。\n二、标准：一次性补贴5000元。\n三、材料：营业执照、身份证明、经营场所证明、正常经营流水等。\n四、渠道：向注册地县级人社部门申请，或通过江西政务服务网线上办理。',
      region: '江西省', publishDate: isoOffset(-5), createdBy: 'u_hrss' },
    { id: 'pol9', title: '创业担保贷款管理办法要点',
      content: '一、个人创业担保贷款额度最高20万元，小微企业最高300万元。\n二、符合条件人员（含刑满释放人员）可申请财政贴息。\n三、反担保方式可灵活选择，鼓励取消反担保。\n四、办理流程：申请人向创业地人社部门提交申请，银行审核放款。',
      region: '全国', publishDate: isoOffset(-3), createdBy: 'u_hrss' },
    { id: 'pol10', title: '城乡居民基本医疗保险参保与待遇政策问答',
      content: '一、参保对象：未参加职工医保的城乡居民，包括刑满释放人员。\n二、缴费标准：按当地年度公布标准缴纳，困难群体按规定给予资助。\n三、待遇：门诊统筹、住院报销、大病保险、医疗救助等多重保障。\n四、办理：携带身份证到户籍地或居住地医保经办机构办理参保登记。',
      region: '全国', publishDate: isoOffset(-6), createdBy: 'u_medicare' },
    { id: 'pol11', title: '医保异地就医直接结算服务指引',
      content: '一、异地长期居住人员、临时外出就医人员可在参保地备案后直接结算。\n二、备案渠道：国家医保服务平台APP、当地医保经办窗口、电话备案。\n三、结算政策：异地就医执行就医地目录、参保地政策。\n四、未备案也可按规定补办备案后结算。',
      region: '全国', publishDate: isoOffset(-2), createdBy: 'u_medicare' },
    { id: 'pol12', title: '特困人员救助供养办法要点',
      content: '一、对象：无劳动能力、无生活来源、无法定赡养扶养义务人，或义务人无履行能力的老年人、残疾人、未成年人。\n二、供养内容：基本生活、照料护理、疾病治疗、丧葬事宜。\n三、申请：本人或委托他人向户籍地乡镇（街道）提出书面申请。\n四、审核确认：乡镇（街道）调查核实，县级民政部门审批。',
      region: '全国', publishDate: isoOffset(-4), createdBy: 'u_civil' },
    { id: 'pol13', title: '最低生活保障申请审核确认办法要点',
      content: '一、共同生活的家庭成员人均收入低于当地低保标准，且家庭财产符合规定的，纳入低保。\n二、申请：向户籍地乡镇（街道）提出申请，签署家庭经济状况核对授权书。\n三、办理时限：一般不超过30个工作日。\n四、低保金按月发放，实行"一卡通"直发到户。',
      region: '全国', publishDate: isoOffset(-1), createdBy: 'u_civil' },
    { id: 'pol14', title: '大病保险与医疗救助衔接政策',
      content: '一、参保居民在基本医保报销后，个人负担的合规医疗费用超过起付线的，纳入大病保险报销。\n二、对困难群众按规定给予医疗救助，实现基本医保、大病保险、医疗救助三重保障有序衔接。\n三、符合条件的刑释人员与普通参保居民享受同等待遇，不因身份受到区别对待。',
      region: '全国', publishDate: isoOffset(-2), createdBy: 'u_medicare' },
    { id: 'pol15', title: '职业技能培训补贴申领政策',
      content: '一、登记失业人员、刑满释放人员等参加职业技能培训并取得相应证书的，按规定给予培训补贴。\n二、补贴标准按培训项目与技能等级确定，可向当地人社部门咨询。\n三、就业困难人员参加培训期间，可按规定申请生活费补贴。',
      region: '全国', publishDate: isoOffset(-1), createdBy: 'u_hrss' },
    { id: 'pol16', title: '临时救助政策',
      content: '一、因突发性、紧迫性、临时性原因导致基本生活暂时出现严重困难的家庭或个人，可申请临时救助。\n二、救助标准根据困难程度确定，原则上不超过当地月低保标准的一定倍数。\n三、申请渠道：户籍地或急难发生地乡镇（街道）民政窗口；情况紧急的可先行救助、后补办手续。',
      region: '全国', publishDate: isoOffset(-1), createdBy: 'u_civil' }
  ];

  // 补充的招聘/培训示例（用于老数据合并）
  const EXTRA_JOBS = [
    { id: 'j3', company: '比亚迪股份有限公司', position: '生产操作工', salary: '5000-7000元/月', location: '深圳', requirement: '身体健康，服从管理，可接受倒班', publishDate: isoOffset(-4), createdBy: 'u_hrss' },
    { id: 'j4', company: '美团配送', position: '外卖骑手', salary: '6000-9000元/月', location: '南昌', requirement: '会使用智能手机，熟悉当地路况', publishDate: isoOffset(-2), createdBy: 'u_hrss' }
  ];
  const EXTRA_TRAININGS = [
    { id: 't4', school: '南昌市东湖区就业训练中心', major: '家政服务培训', location: '南昌市东湖区', startDate: '2026-09-28', quota: 40, requirement: '身体健康' },
    { id: 't5', school: '深圳市技工学校', major: '物流仓储管理', location: '深圳市龙岗区', startDate: '2026-10-15', quota: 30, requirement: '初中以上学历' }
  ];

  // 相关法律原文库（供刑释人员端查看）
  const LAWS = [
    { id: 'law1', name: '中华人民共和国监狱法', tag: '监狱法', summary: '规范监狱刑罚执行与罪犯改造，保障刑满释放人员顺利回归。',
      text: '《中华人民共和国监狱法》（1994年通过，2012年修正）要点摘编\n\n第三条 监狱对罪犯实行惩罚和改造相结合、教育和劳动相结合的原则，将罪犯改造成为守法公民。\n\n第七条 罪犯的人格不受侮辱，其人身安全、合法财产和辩护、申诉、控告、检举以及其他未被依法剥夺或者限制的权利不受侵犯。\n\n第三十五条 罪犯服刑期满，监狱应当按期释放并发给释放证明书。\n\n第三十六条 罪犯释放后，公安机关凭释放证明书办理户籍登记。对刑满释放人员，当地人民政府应当帮助其安置生活，有关部门应当协助解决其就业、就学等实际问题。' },
    { id: 'law2', name: '中华人民共和国社区矫正法', tag: '社区矫正法', summary: '规范社区矫正，保护矫正对象合法权益，促进顺利融入社会。',
      text: '《中华人民共和国社区矫正法》（2020年7月1日起施行）要点摘编\n\n第一条 为了推进和规范社区矫正工作，保障刑事判决、刑事裁定和暂予监外执行决定的正确执行，提高教育矫正质量，促进社区矫正对象顺利融入社会，预防和减少犯罪，根据宪法，制定本法。\n\n第四条 社区矫正对象依法享有的人身权利、财产权利和其他合法权利不受侵犯，在就业、就学和享受社会保障等方面不受歧视。\n\n社区矫正机构应当依法为社区矫正对象提供职业技能培训、就业指导和帮助，协调有关部门落实其就业、就学、社会保障等帮扶政策。' },
    { id: 'law3', name: '中华人民共和国就业促进法', tag: '就业促进法', summary: '保障平等就业权利，明确就业援助制度。',
      text: '《中华人民共和国就业促进法》（2008年1月1日起施行）要点摘编\n\n第三条 劳动者依法享有平等就业和自主择业的权利。劳动者就业，不因民族、种族、性别、宗教信仰等不同而受歧视。\n\n第二十五条 各级人民政府创造公平就业的环境，消除就业歧视，制定政策并采取措施对就业困难人员给予扶持和援助。\n\n就业困难人员包括因身体状况、技能水平、家庭因素、失去土地等原因难以实现就业，以及连续失业一定时间仍未能实现就业的人员。对就业困难人员实行就业援助制度，通过公益性岗位安置等途径予以扶持。' },
    { id: 'law4', name: '中华人民共和国社会保险法', tag: '社会保险法', summary: '明确养老、医疗、失业等社会保险参保与待遇保障。',
      text: '《中华人民共和国社会保险法》（2011年7月1日起施行）要点摘编\n\n第二条 国家建立基本养老保险、基本医疗保险、工伤保险、失业保险、生育保险等社会保险制度，保障公民在年老、疾病、工伤、失业、生育等情况下依法从国家和社会获得物质帮助的权利。\n\n第二十三条 职工应当参加职工基本医疗保险，由用人单位和职工按照国家规定共同缴纳基本医疗保险费。无雇工的个体工商户、未在用人单位参加职工基本医疗保险的非全日制从业人员以及其他灵活就业人员可以参加职工基本医疗保险。\n\n第四十四条 职工应当参加失业保险，由用人单位和职工按照国家规定共同缴纳失业保险费。失业人员符合下列条件的，从失业保险基金中领取失业保险金：（一）失业前用人单位和本人已经缴纳失业保险费满一年的；（二）非因本人意愿中断就业的；（三）已经进行失业登记，并有求职要求的。\n\n第五十八条 用人单位应当自用工之日起三十日内为其职工向社会保险经办机构申请办理社会保险登记。' },
    { id: 'law5', name: '中华人民共和国劳动法', tag: '劳动法', summary: '保障劳动者平等就业、劳动报酬与休息休假等基本权利。',
      text: '《中华人民共和国劳动法》（1995年1月1日起施行，2018年修正）要点摘编\n\n第三条 劳动者享有平等就业和选择职业的权利、取得劳动报酬的权利、休息休假的权利、获得劳动安全卫生保护的权利、接受职业技能培训的权利、享受社会保险和福利的权利、提请劳动争议处理的权利以及法律规定的其他劳动权利。\n\n第十二条 劳动者就业，不因民族、种族、性别、宗教信仰不同而受歧视。\n\n劳动者应当完成劳动任务，提高职业技能，执行劳动安全卫生规程，遵守劳动纪律和职业道德。用人单位应当依法建立和完善规章制度，保障劳动者享有劳动权利和履行劳动义务。' },
    { id: 'law6', name: '中华人民共和国法律援助法', tag: '法律援助法', summary: '经济困难或特殊案件的当事人可获得免费法律咨询与代理。',
      text: '《中华人民共和国法律援助法》（2022年1月1日起施行）要点摘编\n\n第二条 本法所称法律援助，是国家建立的为经济困难公民和符合法定条件的其他当事人无偿提供法律咨询、代理、刑事辩护等法律服务的制度，是公共法律服务体系的组成部分。\n\n第三十一条 下列事项的当事人，因经济困难没有委托代理人的，可以向法律援助机构申请法律援助：（一）依法请求国家赔偿；（二）请求给予社会保险待遇或者社会救助；（三）请求发给抚恤金；（四）请求给付赡养费、抚养费、扶养费；（五）请求确认劳动关系或者支付劳动报酬；（六）主张因见义勇为行为产生的民事权益等。\n\n法律援助机构可以设立法律援助工作站或者联络点，方便当事人申请法律援助。' }
  ];

  function getLaws() { return LAWS; }

  function mergeExtraData(db) {
    EXTRA_JOBS.forEach(j => { if (!(db.jobs || []).some(x => x.id === j.id)) db.jobs.push(j); });
    EXTRA_TRAININGS.forEach(t => { if (!(db.trainings || []).some(x => x.id === t.id)) db.trainings.push(t); });
    EXTRA_POLICIES.forEach(p => { if (!(db.policies || []).some(x => x.id === p.id)) db.policies.push(p); });
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
          crime: '盗窃罪', sentence: '有期徒刑2年', releaseDate: isoOffset(-30),
          prisonPerformance: '表现良好，积极参加教育改造，无违规记录',
          riskLevel: 'low', serviceType: 'flexible', serviceChoiceMade: true,
          address: '北京市朝阳区建国路88号', occupation: '待业', maritalStatus: '未婚',
          province: '北京市', city: '北京市', region: '北京市·北京市',
          createdBy: 'u_police', createdAt: isoOffset(-60)
        },
        {
          id: 'p2', name: '李四', gender: '男', age: 35, idCard: '110105198905055678',
          crime: '故意伤害罪', sentence: '有期徒刑3年6个月', releaseDate: isoOffset(-15),
          prisonPerformance: '表现一般，有过1次违规，经教育后改正',
          riskLevel: 'high', serviceType: 'strict', serviceChoiceMade: true,
          address: '北京市海淀区中关村大街1号', occupation: '待业', maritalStatus: '已婚',
          province: '北京市', city: '北京市', region: '北京市·北京市',
          createdBy: 'u_police', createdAt: isoOffset(-90)
        },
        {
          id: 'p3', name: '王五', gender: '男', age: 22, idCard: '110108200203039012',
          crime: '寻衅滋事罪', sentence: '有期徒刑1年6个月', releaseDate: isoOffset(-7),
          prisonPerformance: '表现较差，有3次违规记录，需重点关注',
          riskLevel: null, serviceType: null, serviceChoiceMade: false,
          address: '北京市西城区西长安街1号', occupation: '待业', maritalStatus: '未婚',
          province: '北京市', city: '北京市', region: '北京市·北京市',
          createdBy: 'u_police', createdAt: isoOffset(-50)
        }
      ],
      updates: [
        { id: 'up1', personId: 'p1', timePoint: '1month', timePointLabel: '刑满释放后1个月',
          address: '北京市朝阳区建国路88号', occupation: '销售员', maritalStatus: '未婚',
          submittedAt: isoOffset(-25) }
      ],
      questions: [
        { id: 'q1', personId: 'p1', personName: '张三', category: '心理',
          title: '如何调整出狱后的心态', content: '出狱后总感觉无法融入社会，经常焦虑失眠，请问如何调整？',
          status: 'replied', reply: '建议您多参加社区组织的互助活动，逐步建立自信心。如失眠严重，可前往医院心理科就诊。同时保持规律作息，适当运动。',
          replierName: '心理咨询师 刘医生', repliedAt: isoOffset(-3), createdAt: isoOffset(-10) },
        { id: 'q2', personId: 'p2', personName: '李四', category: '法律',
          title: '劳动合同纠纷咨询', content: '我在工厂工作了3个月，老板一直不签合同，也不交社保，该怎么办？',
          status: 'pending', reply: null, replierName: null, repliedAt: null, createdAt: isoOffset(-5) }
      ],
      reminders: [
        { id: 'r1', personId: 'p2', personName: '李四', releaseDate: isoOffset(-15),
          stage: '30day', message: '李四将于' + isoOffset(-15) + '刑满释放，请司法行政部门确认接送安排。',
          confirmed: true, confirmedAt: isoOffset(-20), createdBy: 'u_prison', createdAt: isoOffset(-45) }
      ],
      jobs: [
        { id: 'j1', company: '华为技术有限公司', position: '装配工', salary: '4500-6000元/月',
          location: '深圳', requirement: '身体健康，能吃苦耐劳，无不良记录', publishDate: isoOffset(-5), createdBy: 'u_judicial' },
        { id: 'j2', company: '京东物流', position: '分拣员', salary: '3500-5000元/月',
          location: '北京', requirement: '能适应夜班，工作认真负责', publishDate: isoOffset(-3), createdBy: 'u_judicial' },
        { id: 'j3', company: '比亚迪股份有限公司', position: '生产操作工', salary: '5000-7000元/月',
          location: '深圳', requirement: '身体健康，服从管理，可接受倒班', publishDate: isoOffset(-4), createdBy: 'u_hrss' },
        { id: 'j4', company: '美团配送', position: '外卖骑手', salary: '6000-9000元/月',
          location: '南昌', requirement: '会使用智能手机，熟悉当地路况', publishDate: isoOffset(-2), createdBy: 'u_hrss' }
      ],
      trainings: [
        { id: 't1', school: '南昌市高级技工学校', major: '电工技能培训', location: '南昌市青山湖区', startDate: '2026-09-15', quota: 30, requirement: '年满16周岁，身体健康' },
        { id: 't2', school: '赣州市就业训练中心', major: '中式烹饪培训', location: '赣州市章贡区', startDate: '2026-09-20', quota: 20, requirement: '有意从事餐饮行业' },
        { id: 't3', school: '江西省机电技师学院', major: '新能源汽车维修', location: '南昌市新建区', startDate: '2026-10-10', quota: 25, requirement: '初中以上学历' },
        { id: 't4', school: '南昌市东湖区就业训练中心', major: '家政服务培训', location: '南昌市东湖区', startDate: '2026-09-28', quota: 40, requirement: '身体健康' },
        { id: 't5', school: '深圳市技工学校', major: '物流仓储管理', location: '深圳市龙岗区', startDate: '2026-10-15', quota: 30, requirement: '初中以上学历' }
      ],
      reports: [],
      applications: [],
      policies: [
        { id: 'pol1', title: '关于进一步做好刑释人员安置帮教工作的通知',
          content: '为进一步加强刑释人员安置帮教工作，现就有关事项通知如下：\n一、提高认识，加强组织领导\n二、完善衔接机制，确保无缝对接\n三、强化就业帮扶，拓宽就业渠道\n四、加强心理辅导，促进顺利回归\n五、完善信息管理，建立跟踪机制',
          region: '全国', publishDate: isoOffset(-10), createdBy: 'u_judicial' },
        { id: 'pol2', title: '2026年安置帮教工作要点',
          content: '2026年安置帮教工作将重点围绕以下几个方面展开：\n1. 推进"阳光帮扶"工程\n2. 加强就业技能培训\n3. 完善社会力量参与机制\n4. 强化信息化管理手段',
          region: '全国', publishDate: isoOffset(-2), createdBy: 'u_judicial' },
        { id: 'pol3', title: '江西省刑释人员就业创业帮扶若干措施',
          content: '为进一步做好我省刑释人员就业创业帮扶工作，现提出以下措施：\n一、落实一次性创业补贴政策\n二、创业担保贷款优先支持\n三、组织技能培训并落实培训补贴\n四、搭建企业与刑释人员就业对接平台',
          region: '江西省', publishDate: isoOffset(-6), createdBy: 'u_hrss' },
        { id: 'pol4', title: '广东省刑释人员社会救助申请指引',
          content: '为保障刑释人员基本生活，现就相关救助申请明确如下：\n一、符合条件的可申请特困人员救助供养\n二、生活困难的按规定纳入低保范围\n三、申请渠道：户籍地或居住地乡镇（街道）民政窗口\n四、提供刑满释放证明等材料可优先受理',
          region: '广东省', publishDate: isoOffset(-4), createdBy: 'u_civil' },
        ...EXTRA_POLICIES
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
  function getPersons() { return getDB().persons.filter(p => !p.archived); }

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

  // ===== 部门业务申请（医保/社保/创业补助/特困等，供司法端信息共享查看） =====
  function getApplications() { return getDB().applications || []; }

  function getApplicationsByPerson(personId) {
    return (getDB().applications || []).filter(a => a.personId === personId);
  }

  function addApplication(app, user) {
    const db = getDB();
    const a = {
      id: genId('app'),
      ...app,
      status: '待处理',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    db.applications = db.applications || [];
    db.applications.push(a);
    saveDB(db);
    addLog('提交申请：' + a.category + '（' + a.personName + '）', user);
    return a;
  }

  function updateApplicationStatus(id, status, reply, user) {
    const db = getDB();
    const a = (db.applications || []).find(x => x.id === id);
    if (a) {
      a.status = status;
      if (reply !== undefined) a.reply = reply;
      a.updatedAt = new Date().toISOString().slice(0, 10);
      saveDB(db);
      addLog('处理申请：' + a.category + '（' + a.personName + '）', user);
    }
    return a;
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
  const DEMO_SEED_FLAG = 'azbj_demo_seed_v2';

  function ensureDemoData() {
    try {
      const db = getDB();
      // 归档演示账号张三/李四/王五（不再出现在档案列表，登录账号保留）
      ['p1', 'p2', 'p3'].forEach(id => {
        const demoP = db.persons.find(x => x.id === id);
        if (demoP) demoP.archived = true;
      });
      // 老数据兼容：补齐缺失的招聘/培训/政策示例
      mergeExtraData(db);
      const currentCount = (db.persons || []).filter(p => !p.archived).length;
      if (currentCount >= 1200) {
        saveDB(db);
        localStorage.setItem(DEMO_SEED_FLAG, '1');
        return { added: 0 };
      }

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
      const total = Math.max(0, 1200 - currentCount);
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
        // 部分人员有信息更新记录（仅前40人，控制本地数据体积）
        if (i < 40 && rnd() < 0.65) {
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
        // 部分未释放人员生成接送提醒（仅前40人）
        if (i < 40 && releaseOffset > 0 && rnd() < 0.5) {
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
      const activePersons = db.persons.filter(p => !p.archived);
      const qPersons = activePersons.slice(0, 3);
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
        id: genId('rep'), personId: activePersons[0].id, personName: activePersons[0].name,
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
    getApplications, getApplicationsByPerson, addApplication, updateApplicationStatus,
    getLaws,
    ensureDemoData,
    getLogs, resetDB
  };
})();
