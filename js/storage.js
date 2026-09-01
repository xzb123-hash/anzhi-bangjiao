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

  // 真实政策库（依据国家法律法规与公开政策文件整理，点击可展开详细内容）
  const ALL_POLICIES = [
    // ===== 司法行政：安置帮教 =====
    { id: 'pol1', title: '关于进一步加强刑满释放解除劳教人员安置帮教工作的意见',
      source: '中共中央办公厅、国务院办公厅转发（中办发〔2010〕5号）',
      summary: '对刑释解教人员安置帮教工作的总体部署，明确乡镇（街道）承担组织落实责任。',
      content: '政策要点摘编：\n一、工作格局：坚持"教育、挽救、感化"方针，动员社会各方面力量参与安置帮教工作。\n二、衔接管理：落实出监（所）衔接制度，对重点帮教对象实行"必接必送"，做到无缝衔接。\n三、就业安置：依托过渡性安置基地、社区就业岗位等渠道帮助刑释人员就业。\n四、责任落实：乡镇（街道）党政组织承担组织落实安置帮教工作的责任，司法行政部门负责日常管理。\n五、社会保障：协调落实最低生活保障、临时救助、就业援助等政策。',
      region: '全国', publishDate: isoOffset(-40), createdBy: 'u_judicial' },
    { id: 'pol2', title: '关于充分发挥司法行政职能作用 进一步加强刑满释放人员安置帮教工作的意见',
      source: '司法部（司发〔2019〕7号）',
      summary: '发挥司法行政职能，做好出监衔接、帮扶教育和困难救助衔接。',
      content: '政策要点摘编：\n一、出监衔接：监狱与司法行政机关及时通报刑满释放信息，落实接送衔接。\n二、信息核查：建立刑满释放人员信息核查与通报机制，实现动态管理。\n三、分类帮教：根据风险等级实行不同强度的帮教措施，落实"一人一策"。\n四、就业帮扶：加强与人力资源社会保障等部门协作，提供就业指导与技能培训衔接。\n五、救助衔接：对符合条件的刑满释放人员，协调落实低保、特困、医疗、临时救助等社会救助政策。',
      region: '全国', publishDate: isoOffset(-35), createdBy: 'u_judicial' },
    { id: 'pol3', title: '关于加强刑满释放人员救助管理工作的意见',
      source: '司法部等13部门（司法〔2015〕8号）',
      summary: '将符合条件的刑满释放人员纳入社会救助范围，做到"应救尽救"。',
      content: '政策要点摘编：\n一、基本原则：对生活困难、符合救助条件的刑满释放人员，按现行政策纳入社会救助范围。\n二、最低生活保障：家庭人均收入低于当地低保标准的，依申请纳入低保。\n三、特困供养：符合特困人员认定条件的，纳入特困人员救助供养。\n四、专项救助：落实医疗救助、临时救助、住房救助、教育救助等专项救助。\n五、过渡安置：对无家可归、无业可就、无亲可投的"三无"人员，做好过渡性安置。',
      region: '全国', publishDate: isoOffset(-30), createdBy: 'u_judicial' },
    { id: 'pol4', title: '关于社会组织参与帮教刑满释放人员工作的意见',
      source: '司法部、中央综治办、民政部、财政部（2016年印发）',
      summary: '鼓励支持社会组织参与安置帮教，提供就业、心理、法律等服务。',
      content: '政策要点摘编：\n一、总体要求：鼓励、引导和支持社会组织参与帮教，促进刑满释放人员顺利融入社会，预防和减少重新违法犯罪。\n二、服务内容：支持社会组织提供就业帮扶、心理疏导、法律援助、生活照料、家庭关系修复等服务。\n三、扶持方式：通过政府购买服务、公益创投、税收优惠等方式给予支持。\n四、监督管理：规范社会组织参与帮教活动，建立绩效评估机制。',
      region: '全国', publishDate: isoOffset(-25), createdBy: 'u_judicial' },

    // ===== 人社：就业创业 =====
    { id: 'pol5', title: '就业补助资金管理办法',
      source: '财政部、人力资源社会保障部（财社〔2017〕164号）',
      summary: '就业补助资金用于职业培训、社保补贴、公益性岗位、创业补贴等就业扶持。',
      content: '办法要点摘编：\n一、资金范围：就业补助资金用于职业培训补贴、职业技能鉴定补贴、社会保险补贴、公益性岗位补贴、就业见习补贴、求职创业补贴、创业补贴、就业创业服务补助等。\n二、职业培训补贴：对符合条件人员参加就业技能培训、创业培训并取得相应证书的，按规定给予补贴。\n三、社会保险补贴：对就业困难人员灵活就业后缴纳社会保险费的，按规定给予补贴；招用就业困难人员的单位可享受岗位补贴与社会保险补贴。\n四、公益性岗位：开发公益性岗位安置就业困难人员，按规定给予岗位补贴。\n五、资金管理：专款专用，实行绩效评价，接受审计监督。',
      region: '全国', publishDate: isoOffset(-22), createdBy: 'u_hrss' },
    { id: 'pol6', title: '普惠金融发展专项资金管理办法（创业担保贷款）',
      source: '财政部（财金〔2023〕75号）',
      summary: '创业担保贷款：个人最高30万元、小微企业最高400万元，财政给予贴息。',
      content: '办法要点摘编：\n一、贷款对象：城镇登记失业人员、就业困难人员（含符合条件的刑满释放人员）、高校毕业生、返乡创业农民工等自主创业人员，以及当年新招用符合条件人员达到规定比例的小微企业。\n二、额度与期限：个人创业担保贷款最高额度30万元、期限最长3年；小微企业创业担保贷款最高额度400万元、期限最长2年。\n三、贴息政策：符合规定的贷款由财政给予贴息，减轻创业者负担。\n四、担保方式：由创业担保贷款担保基金或政府性融资担保机构提供担保。',
      region: '全国', publishDate: isoOffset(-18), createdBy: 'u_hrss' },
    { id: 'pol7', title: '中华人民共和国就业促进法（就业援助相关条文）',
      source: '全国人大常委会（2008年1月1日起施行）',
      summary: '国家实行就业援助制度，对就业困难人员给予公益性岗位安置等扶持。',
      content: '法律条文摘编：\n第三条 劳动者依法享有平等就业和自主择业的权利。劳动者就业，不因民族、种族、性别、宗教信仰等不同而受歧视。\n第二十五条 各级人民政府创造公平就业的环境，消除就业歧视，制定政策并采取措施对就业困难人员给予扶持和援助。\n就业援助制度：对就业困难人员通过公益性岗位安置、职业培训补贴、社会保险补贴、岗位补贴等途径实施援助；刑满释放人员符合条件的，按规定纳入就业困难人员范围。',
      region: '全国', publishDate: isoOffset(-15), createdBy: 'u_hrss' },
    { id: 'pol8', title: '失业保险条例',
      source: '国务院令第258号（1999年发布）',
      summary: '参加失业保险并缴费满1年、非因本人意愿中断就业且已登记求职的，可领取失业保险金。',
      content: '条例条文摘编：\n第二条 城镇企业事业单位、城镇企业事业单位职工依照本条例的规定，缴纳失业保险费。\n第十四条 具备下列条件的失业人员，可以领取失业保险金：（一）按照规定参加失业保险，所在单位和本人已按照规定履行缴费义务满1年的；（二）非因本人意愿中断就业的；（三）已办理失业登记，并有求职要求的。\n领取期限根据缴费年限确定，累计缴费时间越长领取期限越长，最长不超过24个月；失业保险金标准低于当地最低工资标准、高于城市居民最低生活保障标准。刑满释放人员失业后符合条件的，可按规定申领。',
      region: '全国', publishDate: isoOffset(-12), createdBy: 'u_hrss' },
    { id: 'pol9', title: '关于做好服务业行业小微企业个体工商户一次性创业补贴有关工作的通知',
      source: '江西省人力资源和社会保障厅（赣人社字〔2023〕264号）',
      summary: '符合条件的创业者新创业并正常运营满6个月，可申领一次性创业补贴5000元。',
      content: '通知要点摘编：\n一、补贴对象：本省行政区域内在校生及离校5年内高校毕业生、就业困难人员和返乡入乡创业农民工，在服务业行业、小微企业、个体工商户新创业且担任法定代表人的。\n二、申请条件：信用良好，创业实体正常运营6个月以上。\n三、补贴标准：一次性创业补贴5000元，每人可享受一次，同一用人单位只能申请一次。\n四、办理渠道：向注册地县级人力资源社会保障部门提出申请，或通过江西政务服务网线上办理。',
      region: '江西省', publishDate: isoOffset(-8), createdBy: 'u_hrss' },

    // ===== 医保 =====
    { id: 'pol10', title: '关于整合城乡居民基本医疗保险制度的意见',
      source: '国务院（国发〔2016〕3号）',
      summary: '建立统一的城乡居民基本医疗保险制度，覆盖除职工医保应参保人员外的所有城乡居民。',
      content: '意见要点摘编：\n一、统一覆盖范围：城乡居民医保制度覆盖除职工基本医疗保险应参保人员以外的其他所有城乡居民，包括刑满释放人员。\n二、统一筹资政策：坚持多渠道筹资，个人缴费与政府补助相结合，合理确定筹资标准。\n三、统一保障待遇：建立门诊统筹与住院统筹相结合的待遇保障机制。\n四、参保办理：按年度参保缴费，持身份证到户籍地或居住地医保经办机构办理参保登记，也可通过线上渠道办理。',
      region: '全国', publishDate: isoOffset(-20), createdBy: 'u_medicare' },
    { id: 'pol11', title: '基本医疗保险跨省异地就医直接结算经办规程',
      source: '国家医保局、财政部（医保发〔2022〕22号）',
      summary: '异地就医备案后可直接结算，执行"就医地目录、参保地政策"。',
      content: '规程要点摘编：\n一、备案类型：异地长期居住人员备案、临时外出就医人员备案两类。\n二、直接结算：办理备案后，持医保电子凭证或社保卡在异地联网定点医药机构就医，出院时直接结算。\n三、结算政策：跨省异地就医直接结算执行就医地支付范围及有关规定，执行参保地起付标准、支付比例和最高支付限额。\n四、备案渠道：国家医保服务平台APP、医保经办窗口、电话等均可办理。\n五、未备案就医：按参保地规定补办备案手续后可按规定结算。',
      region: '全国', publishDate: isoOffset(-16), createdBy: 'u_medicare' },
    { id: 'pol12', title: '关于全面实施城乡居民大病保险的意见',
      source: '国务院办公厅（国办发〔2015〕57号）',
      summary: '大病保险是对大病患者高额医疗费用的进一步保障，与基本医保、医疗救助相衔接。',
      content: '意见要点摘编：\n一、制度定位：大病保险是基本医疗保障制度的拓展和延伸，是对大病患者发生的高额医疗费用给予进一步保障的制度性安排。\n二、筹资机制：从城乡居民医保基金中划出一定比例或额度作为大病保险资金，不额外增加参保居民个人缴费负担。\n三、保障内容：对参保居民患大病发生的高额医疗费用，在基本医保报销后按当地规定给予二次报销，起付线、报销比例向困难群众倾斜。\n四、制度衔接：与基本医保、医疗救助等制度衔接，缓解因病致贫、因病返贫问题。',
      region: '全国', publishDate: isoOffset(-14), createdBy: 'u_medicare' },
    { id: 'pol13', title: '关于进一步加强异地就医直接结算管理服务的通知',
      source: '国家医保局、财政部（医保发〔2024〕21号）',
      summary: '进一步规范异地就医备案与结算管理，加强跨省费用协查与基金监管。',
      content: '通知要点摘编：\n一、完善备案管理：简化异地就医备案流程，推行备案"承诺制"，方便参保人员就医。\n二、强化就医地管理：就医地经办机构按照规程做好跨省住院疑似违规费用协查工作。\n三、提升结算服务：持续扩大跨省直接结算覆盖范围，保障参保人员异地就医待遇及时兑现。\n四、加强监管协同：完善跨省医保基金监管协作机制，共同维护基金安全。',
      region: '全国', publishDate: isoOffset(-10), createdBy: 'u_medicare' },

    // ===== 民政：社会救助 =====
    { id: 'pol14', title: '社会救助暂行办法',
      source: '国务院令第649号（2014年5月1日起施行）',
      summary: '建立最低生活保障、特困供养、医疗/教育/住房/就业救助和临时救助等综合救助制度。',
      content: '办法条文摘编：\n一、制度框架：国家建立健全最低生活保障、特困人员救助供养、受灾人员救助、医疗救助、教育救助、住房救助、就业救助、临时救助等社会救助制度。\n二、临时救助：第四十七条 国家对因火灾、交通事故等意外事件，家庭成员突发重大疾病等原因，导致基本生活暂时出现严重困难的家庭，或者因生活必需支出突然增加超出家庭承受能力，导致基本生活暂时出现严重困难的最低生活保障家庭，以及遭遇其他特殊困难的家庭，给予临时救助。\n三、申请程序：第四十八条 申请临时救助的，应当向乡镇人民政府、街道办事处提出，经审核、公示后，由县级人民政府民政部门审批；救助金额较小的，县级人民政府民政部门可以委托乡镇人民政府、街道办事处审批。',
      region: '全国', publishDate: isoOffset(-28), createdBy: 'u_civil' },
    { id: 'pol15', title: '特困人员认定办法',
      source: '民政部（民发〔2016〕178号）',
      summary: '无劳动能力、无生活来源、无法定赡养扶养义务人的老年人、残疾人、未成年人纳入特困供养。',
      content: '办法条文摘编：\n第四条 城乡老年人、残疾人以及未满16周岁的未成年人，同时具备以下条件的，应当依法纳入特困人员救助供养范围：（一）无劳动能力；（二）无生活来源；（三）无法定赡养、抚养、扶养义务人或者其法定义务人无履行义务能力。\n申请程序：本人向户籍所在地乡镇人民政府（街道办事处）提出书面申请，经家庭经济状况核对、审核确认后纳入供养范围。\n供养内容：提供基本生活条件、照料护理、疾病治疗、住房保障、丧葬事宜等。',
      region: '全国', publishDate: isoOffset(-26), createdBy: 'u_civil' },
    { id: 'pol16', title: '城市居民最低生活保障条例',
      source: '国务院令第271号（1999年发布）',
      summary: '家庭人均收入低于当地低保标准的城市居民，可申请最低生活保障。',
      content: '条例条文摘编：\n第二条 持有非农业户口的城市居民，凡共同生活的家庭成员人均收入低于当地城市居民最低生活保障标准的，均有从当地人民政府获得基本生活物质帮助的权利。\n申请程序：由户主向户籍所在地的街道办事处或者镇人民政府提出书面申请，经居民委员会协助调查核实、街道审核、县级人民政府民政部门审批后，自批准之日起按月发放最低生活保障金。\n保障内容：低保金按月足额发放，保障家庭基本生活。',
      region: '全国', publishDate: isoOffset(-24), createdBy: 'u_civil' },
    { id: 'pol17', title: '国务院关于全面建立临时救助制度的通知',
      source: '国务院（国发〔2014〕47号）',
      summary: '全面建立临时救助制度，解决困难群众突发性、紧迫性、临时性生活困难。',
      content: '通知要点摘编：\n一、救助对象：因火灾、交通事故等意外事件，家庭成员突发重大疾病等原因，导致基本生活暂时出现严重困难的家庭和个人；因生活必需支出突然增加超出家庭承受能力，导致基本生活暂时出现严重困难的最低生活保障家庭等。\n二、救助方式：发放临时救助金、发放实物、提供转介服务等，根据困难程度和情形确定。\n三、申请受理：向户籍地或急难发生地乡镇人民政府（街道办事处）提出申请；对情况紧急的，可先行救助，后补办手续。\n四、资金保障：县级以上地方人民政府安排临时救助资金，纳入财政预算。',
      region: '全国', publishDate: isoOffset(-20), createdBy: 'u_civil' }
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
    ALL_POLICIES.forEach(p => { if (!(db.policies || []).some(x => x.id === p.id)) db.policies.push(p); });
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
      policies: [...ALL_POLICIES.map(p => Object.assign({}, p))],
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
      // 政策库升级：替换为真实政策（仅一次），并补齐缺失的招聘/培训示例
      if (!localStorage.getItem('azbj_policy_v3')) {
        db.policies = ALL_POLICIES.map(p => Object.assign({}, p));
        localStorage.setItem('azbj_policy_v3', '1');
      } else {
        mergeExtraData(db);
      }
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
