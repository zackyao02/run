import type { ExecutableRun, SourceRecord } from "@/src/domain/types";

export const inspectRun: ExecutableRun = {
  schemaVersion: "1.3",
  title: "一篇方法型知识，开始运行",
  description: "把文章中的方法拆成可执行步骤，现场完成一次检查并留下结果。",
  capability: "inspect",
  category: "生活决策",
  estimatedMinutes: 3,
  sourceRef: {
    sourceId: "fixture_inspect",
    contentHash: "32722291a9d40becd5252b880d4a854cf80a22ba3789ed3c3b7fdbf116476557",
  },
  components: [
    {
      id: "check_water",
      type: "check",
      required: true,
      title: "确定执行目标",
      description: "先明确这次运行要解决的具体问题。",
      source: {
        blockId: "fixture_block_inspect_000",
        quote: "先明确这次要解决的问题",
        startOffset: 0,
        endOffset: 11,
        blockHash: "fc486decbff852582bf367f86ad1b2028a2be42a95bd2d70c80760ba848aa3dd",
      },
      evaluation: { inputId: "fixture_text", operator: "required" },
    },
    {
      id: "check_leak",
      type: "check",
      required: true,
      title: "按原文步骤执行",
      description: "按照文章给出的顺序完成关键动作。",
      source: {
        blockId: "fixture_block_inspect_001",
        quote: "把关键步骤按顺序走一遍",
        startOffset: 0,
        endOffset: 11,
        blockHash: "2bf6030edca46b0669f88354490fce0f70dd7a04e2c40ef6fe8adfb5f67bdbf7",
      },
      evaluation: { inputId: "fixture_text", operator: "length_between", params: { min: 1, max: 500 } },
    },
    {
      id: "check_identity",
      type: "check",
      required: true,
      title: "记录执行结果",
      description: "记录过程中出现的变化，完成后可以回看依据。",
      source: {
        blockId: "fixture_block_inspect_002",
        quote: "记录过程中出现的变化",
        startOffset: 0,
        endOffset: 10,
        blockHash: "0a5611330335e58f52e31a54fe52b53b66ecc0e00a354b681db900c923844826",
      },
      evaluation: { inputId: "fixture_text", operator: "manual_evidence" },
    },
  ],
  completion: { type: "all_required_completed", targetId: null },
  resultArtifact: { type: "inspect_summary", fields: ["normalCount", "riskCount", "uncheckedCount", "items"] },
};

export const inspectSource: SourceRecord = {
  id: "fixture_inspect",
  title: "合成样例：方法型知识运行",
  authorName: "工程测试数据",
  url: null,
  blocks: [
    { id: "fixture_block_inspect_000", text: "先明确这次要解决的问题。", blockHash: "fc486decbff852582bf367f86ad1b2028a2be42a95bd2d70c80760ba848aa3dd" },
    { id: "fixture_block_inspect_001", text: "把关键步骤按顺序走一遍。", blockHash: "2bf6030edca46b0669f88354490fce0f70dd7a04e2c40ef6fe8adfb5f67bdbf7" },
    { id: "fixture_block_inspect_002", text: "记录过程中出现的变化。", blockHash: "0a5611330335e58f52e31a54fe52b53b66ecc0e00a354b681db900c923844826" },
  ],
};

export const missionRun: ExecutableRun = {
  schemaVersion: "1.3",
  title: "把一篇方法文章跑成一条行动路径",
  description: "文章结构决定阶段、动作与选择；你只需按原文推进一次。",
  capability: "mission",
  category: "方法实践",
  estimatedMinutes: 4,
  sourceRef: { sourceId: "fixture_mission", contentHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  program: {
    model: "gated_path",
    primitives: ["observable_state", "source_backed_branch", "material_artifact"],
    initialState: "frame_goal",
    terminalState: "recorded_change",
    states: [
      { id: "frame_goal", label: "目标已框定", description: "先把这次运行限定为一个可完成的目标。" },
      { id: "route_selected", label: "路径已选择", description: "依据原文条件进入一条推进路径。" },
      { id: "recorded_change", label: "变化已记录", description: "本轮动作与变化已经被保留，可回看原文。" },
    ],
    transitions: [
      { from: "frame_goal", componentId: "mission_task_1", when: "completed", to: "route_selected" },
      { from: "route_selected", componentId: "mission_choice", when: "choice:steady", to: "route_selected" },
      { from: "route_selected", componentId: "mission_choice", when: "choice:deep", to: "route_selected" },
      { from: "route_selected", componentId: "mission_task_2", when: "completed", to: "recorded_change" },
    ],
  },
  components: [
    { id: "mission_task_1", type: "task", required: true, title: "先确定这次要完成的目标", description: "把文章的第一步变成一个明确目标。", source: { blockId: "mission_block_000", quote: "先确定这次要完成的目标", startOffset: 0, endOffset: 12, blockHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" } },
    { id: "mission_choice", type: "choice", required: true, title: "选择适合你的推进方式", description: "根据原文给出的条件，选择一条路径。", options: [{ id: "steady", label: "按最小步骤推进", nextId: "mission_task_2" }, { id: "deep", label: "先做一次完整尝试", nextId: "mission_task_2" }], source: { blockId: "mission_block_001", quote: "根据条件选择一条路径", startOffset: 0, endOffset: 11, blockHash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" } },
    { id: "mission_task_2", type: "task", required: true, title: "完成一次并记录变化", description: "做完文章要求的动作，留下可回看的结果。", source: { blockId: "mission_block_002", quote: "完成一次并记录变化", startOffset: 0, endOffset: 10, blockHash: "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" } },
  ],
  completion: { type: "all_required_completed", targetId: null },
  resultArtifact: { type: "mission_snapshot", fields: ["items", "completedAt"] },
};

export const missionSource: SourceRecord = {
  id: "fixture_mission", title: "合成样例：方法文章行动路径", authorName: "工程测试数据", url: null,
  blocks: [
    { id: "mission_block_000", text: "先确定这次要完成的目标", blockHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    { id: "mission_block_001", text: "根据条件选择一条路径", blockHash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" },
    { id: "mission_block_002", text: "完成一次并记录变化", blockHash: "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" },
  ],
};

function syntheticSource(id: string, title: string, lines: string[]): SourceRecord {
  return { id, title, authorName: "工程测试数据", url: null, blocks: lines.map((text, index) => ({ id: `${id}_block_${index}`, text, blockHash: `${id.replace(/[^a-z0-9]/gi, "").padEnd(56, String(index + 1)).slice(0, 56)}${String(index + 1).padStart(8, "0")}` })) };
}

function syntheticAnchor(source: SourceRecord, index: number) {
  const block = source.blocks[index];
  return { blockId: block.id, quote: block.text, startOffset: 0, endOffset: block.text.length, blockHash: block.blockHash };
}

export const scenarioSource = syntheticSource("fixture_scenario", "合成样例：谈判情境的有限回应", [
  "当对方表示预算有限时，先确认下一次评估标准，再决定是否继续举证。",
  "若能说明已有成果，则继续举证；若暂时没有材料，则约定补充材料的时间。",
]);
export const scenarioRun: ExecutableRun = {
  schemaVersion: "1.3", title: "预算受限时的谈判情境", description: "进入一个原文定义的回应情境；你的有限选择会改变证据与风险状态。", capability: "mission", estimatedMinutes: 2,
  sourceRef: { sourceId: scenarioSource.id, contentHash: "a1".repeat(32) },
  program: { model: "scenario_simulator", primitives: ["observable_state", "source_backed_branch", "material_artifact"], initialState: "budget_objection", terminalState: "next_move_saved", variables: [{ id: "evidence", label: "证据充分度", initialValue: 1, min: 0, max: 3 }, { id: "risk", label: "谈判风险", initialValue: 2, min: 0, max: 3 }], states: [{ id: "budget_objection", label: "预算异议出现", description: "先按原文辨认当前回应条件。" }, { id: "next_move_saved", label: "下一步已确定", description: "本次回应路径已被记录。" }], transitions: [{ from: "budget_objection", componentId: "choose_reply", when: "choice:evidence", to: "next_move_saved", effects: [{ variableId: "evidence", delta: 1 }, { variableId: "risk", delta: -1 }] }, { from: "budget_objection", componentId: "choose_reply", when: "choice:prepare", to: "next_move_saved", effects: [{ variableId: "risk", delta: 0 }] }] },
  components: [{ id: "choose_reply", type: "choice", required: true, title: "对方说“预算有限”", description: "选择文章明确给出的回应路径。", speaker: "对方", utterance: "现在预算有限。", options: [{ id: "evidence", label: "确认标准后继续举证", nextId: "scenario_result", response: "进入继续举证路径。" }, { id: "prepare", label: "约定时间补充材料", nextId: "scenario_result", response: "进入补充材料路径。" }], source: syntheticAnchor(scenarioSource, 1) }, { id: "scenario_result", type: "result", title: "谈判路径已记录" }], completion: { type: "all_required_completed" }, resultArtifact: { type: "mission_snapshot" },
};

export const diagnosisSource = syntheticSource("fixture_diagnosis", "合成样例：网络问题诊断", ["如果其他设备也无法联网，问题范围在路由器或外网；如果只有当前设备无法联网，检查本机连接。"]);
export const diagnosisRun: ExecutableRun = {
  schemaVersion: "1.3", title: "网络问题诊断路径", description: "回答原文中的判断问题，程序只会抵达文章明确写出的范围结论。", capability: "diagnose", estimatedMinutes: 1,
  sourceRef: { sourceId: diagnosisSource.id, contentHash: "b2".repeat(32) },
  program: { model: "diagnosis", primitives: ["observable_state", "source_backed_branch"], initialState: "scope_unknown", terminalState: "scope_located", states: [{ id: "scope_unknown", label: "问题范围待判断" }, { id: "scope_located", label: "问题范围已定位", description: "这是原文条件的落点，不是运行时 AI 诊断。" }], transitions: [{ from: "scope_unknown", componentId: "other_devices", when: "choice:all_offline", to: "scope_located" }, { from: "scope_unknown", componentId: "other_devices", when: "choice:only_this", to: "scope_located" }] },
  components: [{ id: "other_devices", type: "choice", required: true, title: "其他设备也无法联网吗？", description: "用原文的第一个条件定位范围。", options: [{ id: "all_offline", label: "其他设备也无法联网", nextId: "router_result", response: "范围：路由器或外网。" }, { id: "only_this", label: "只有当前设备无法联网", nextId: "local_result", response: "范围：当前设备连接。" }], source: syntheticAnchor(diagnosisSource, 0) }, { id: "router_result", type: "result", title: "检查路由器与外网" }, { id: "local_result", type: "result", title: "检查本机网络连接" }], completion: { type: "all_required_completed" }, resultArtifact: { type: "diagnose_trace" },
};

export const labSource = syntheticSource("fixture_lab", "合成样例：短时专注实验", ["先进行一段短时专注，再记录是否发生中断，并比较本轮感受。", "如果中断明显，下一轮应缩短实验时段；如果可持续完成，则保持当前时段。"]);
export const labRun: ExecutableRun = {
  schemaVersion: "1.3", title: "短时专注微型实验室", description: "先做一轮短时实践，再记录观察；产物是实验记录，不是任务完成数。", capability: "practice", estimatedMinutes: 1,
  sourceRef: { sourceId: labSource.id, contentHash: "c3".repeat(32) },
  program: { model: "micro_lab", primitives: ["observable_state", "feedback_loop", "repeatable_experiment", "material_artifact"], initialState: "baseline", terminalState: "observation_saved", states: [{ id: "baseline", label: "实验前状态" }, { id: "practice_window", label: "实验时段进行中" }, { id: "observation_saved", label: "实验记录已保存", description: "下一轮可以根据这次观察调整。" }], transitions: [{ from: "baseline", componentId: "focus_timer", when: "completed", to: "practice_window" }, { from: "practice_window", componentId: "interrupt_observation", when: "choice:interrupted", to: "observation_saved" }, { from: "practice_window", componentId: "interrupt_observation", when: "choice:steady", to: "observation_saved" }] },
  components: [{ id: "focus_timer", type: "timer", required: true, title: "进行一轮短时专注", description: "完成文章规定的短时实践。", durationSeconds: 15, source: syntheticAnchor(labSource, 0) }, { id: "interrupt_observation", type: "choice", required: true, title: "记录本轮中断情况", description: "这是本轮实验的可回看观察。", options: [{ id: "interrupted", label: "中断明显，下一轮缩短", nextId: "lab_result" }, { id: "steady", label: "可以持续，保持当前时段", nextId: "lab_result" }], source: syntheticAnchor(labSource, 1) }, { id: "lab_result", type: "result", title: "实验记录" }], completion: { type: "all_required_completed" }, resultArtifact: { type: "generic_summary" },
};

export const dialogueSource = syntheticSource("fixture_dialogue", "合成样例：有限状态对话", ["当对方质疑成果时，先用具体事实回应；若事实暂不完整，明确补充材料的时间。"]);
export const dialogueRun: ExecutableRun = {
  schemaVersion: "1.3", title: "成果质疑对话排练", description: "排练一轮文章明确写出的回应逻辑；不生成任何运行时新话术。", capability: "practice", estimatedMinutes: 1,
  sourceRef: { sourceId: dialogueSource.id, contentHash: "d4".repeat(32) },
  program: { model: "dialogue_rehearsal", primitives: ["observable_state", "source_backed_branch", "material_artifact"], initialState: "question_received", terminalState: "reply_traced", states: [{ id: "question_received", label: "质疑已出现" }, { id: "reply_traced", label: "回应轨迹已保存" }], transitions: [{ from: "question_received", componentId: "reply_choice", when: "choice:facts", to: "reply_traced" }, { from: "question_received", componentId: "reply_choice", when: "choice:followup", to: "reply_traced" }] },
  components: [{ id: "reply_choice", type: "choice", required: true, title: "选择回应", description: "只选择文章支持的回应。", speaker: "对方", utterance: "你的成果依据是什么？", options: [{ id: "facts", label: "用具体事实回应", nextId: "dialogue_result", response: "我会用具体事实说明。" }, { id: "followup", label: "约定补充材料时间", nextId: "dialogue_result", response: "我会在约定时间补充材料。" }], source: syntheticAnchor(dialogueSource, 0) }, { id: "dialogue_result", type: "result", title: "对话轨迹" }], completion: { type: "all_required_completed" }, resultArtifact: { type: "generic_summary" },
};

export const sandboxSource = syntheticSource("fixture_sandbox", "合成样例：时间参数沙盘", ["可用时间较少时先保留最小动作；时间充足时再展开完整动作，并检查目标是否仍有明确边界。"]);
export const sandboxRun: ExecutableRun = {
  schemaVersion: "1.3", title: "时间资源参数沙盘", description: "在文章给出的有限时间条件之间切换，查看哪些规则与状态会改变。", capability: "inspect", estimatedMinutes: 1,
  sourceRef: { sourceId: sandboxSource.id, contentHash: "e5".repeat(32) },
  program: { model: "parameter_sandbox", primitives: ["observable_state", "deterministic_evaluation", "material_artifact"], initialState: "parameter_open", terminalState: "plan_configured", variables: [{ id: "time", label: "可用时间", initialValue: 15, min: 15, max: 45, unit: " 分钟" }], states: [{ id: "parameter_open", label: "参数待设置" }, { id: "plan_configured", label: "方案已配置" }], transitions: [{ from: "parameter_open", componentId: "time_budget", when: "choice:minimum", to: "plan_configured", effects: [{ variableId: "time", delta: 0 }] }, { from: "parameter_open", componentId: "time_budget", when: "choice:full", to: "plan_configured", effects: [{ variableId: "time", delta: 30 }] }] },
  components: [{ id: "time_budget", type: "choice", required: true, title: "设置可用时间", description: "只在文章声明的时间条件之间选择。", options: [{ id: "minimum", label: "15 分钟：保留最小动作", value: 15, nextId: "sandbox_result" }, { id: "full", label: "45 分钟：展开完整动作", value: 45, nextId: "sandbox_result" }], source: syntheticAnchor(sandboxSource, 0) }, { id: "sandbox_result", type: "result", title: "当前方案" }], completion: { type: "all_required_completed" }, resultArtifact: { type: "inspect_summary" },
};

export const ruleTesterSource = syntheticSource("fixture_rule_tester", "合成样例：目标规则压力测试", ["一个目标要同时写清对象、时间边界和可观察结果。"]);
export const ruleTesterRun: ExecutableRun = {
  schemaVersion: "1.3", title: "目标结构规则压力测试", description: "输入一条目标，让文章里的声明式规则运行并显示结构缺口。", capability: "inspect", estimatedMinutes: 1,
  inputs: [{ id: "goal", type: "textarea", label: "目标描述", required: true, maxLength: 200, placeholder: "例如：在两周内完成 3 次用户访谈" }], sourceRef: { sourceId: ruleTesterSource.id, contentHash: "f6".repeat(32) },
  program: { model: "rule_tester", primitives: ["observable_state", "deterministic_evaluation", "material_artifact"], initialState: "input_ready", terminalState: "structure_reported", states: [{ id: "input_ready", label: "目标待测试" }, { id: "structure_reported", label: "结构报告已生成" }], transitions: [{ from: "input_ready", componentId: "goal_present", when: "completed", to: "structure_reported" }, { from: "structure_reported", componentId: "goal_number", when: "completed", to: "structure_reported" }] },
  components: [{ id: "goal_present", type: "check", required: true, title: "目标对象已填写", description: "检查是否存在目标描述。", source: syntheticAnchor(ruleTesterSource, 0), evaluation: { inputId: "goal", operator: "required" } }, { id: "goal_number", type: "check", required: true, title: "存在可观察的量化信息", description: "规则检查描述中是否有数字。", source: syntheticAnchor(ruleTesterSource, 0), evaluation: { inputId: "goal", operator: "contains_number" } }], completion: { type: "all_required_completed" }, resultArtifact: { type: "inspect_summary" },
};

export const fixtureRuns = [inspectRun, missionRun, scenarioRun, diagnosisRun, labRun, ruleTesterRun, dialogueRun, sandboxRun];
export const fixtureSources: Record<string, SourceRecord> = Object.fromEntries([inspectSource, missionSource, scenarioSource, diagnosisSource, labSource, ruleTesterSource, dialogueSource, sandboxSource].map((source) => [source.id, source]));

export const executableResumeRun: ExecutableRun = {
  schemaVersion: "1.3",
  title: "简历经历证据构建器",
  description: "这篇方法文章已经被编译成一个小程序：填入几个事实，程序会组装经历、执行规则并指出还缺什么。",
  capability: "inspect",
  category: "职业成长",
  estimatedMinutes: 3,
  inputs: [
    { id: "action_text", type: "text", label: "你具体做了什么", description: "只写真实动作，不必整理成简历语言。", required: true, maxLength: 80, placeholder: "例如：优化推荐流程" },
    { id: "scope_text", type: "text", label: "动作覆盖了什么范围", description: "项目、模块、用户或协作范围都可以。", required: true, maxLength: 80, placeholder: "例如：覆盖 3 个业务模块" },
    { id: "result_text", type: "text", label: "产生了什么变化", description: "写结果名称，数字在下一项单独填写。", required: true, maxLength: 80, placeholder: "例如：转化率提升" },
    { id: "impact_value", type: "number", label: "变化数字", description: "只填写数字。", required: true, placeholder: "例如：18" },
    { id: "impact_unit", type: "text", label: "数字单位", description: "百分比、人数、小时或次数。", required: true, maxLength: 16, placeholder: "例如：%" },
  ],
  sourceRef: { sourceId: "fixture_resume_executable", contentHash: "1111111111111111111111111111111111111111111111111111111111111111" },
  components: [
    { id: "resume_required", type: "check", required: true, title: "具体动作已经写明", description: "程序检查动作字段是否有内容。", source: { blockId: "resume_block_000", quote: "先写清楚你具体做了什么", startOffset: 0, endOffset: 15, blockHash: "2222222222222222222222222222222222222222222222222222222222222222" }, evaluation: { inputId: "action_text", operator: "required" } },
    { id: "resume_length", type: "check", required: true, title: "动作表达足够具体", description: "动作过短通常无法说明你实际做了什么。", source: { blockId: "resume_block_001", quote: "用一两句话交代关键行动", startOffset: 0, endOffset: 13, blockHash: "3333333333333333333333333333333333333333333333333333333333333333" }, evaluation: { inputId: "action_text", operator: "length_between", params: { min: 4, max: 80 } } },
    { id: "resume_number", type: "check", required: true, title: "范围中出现可核验信息", description: "检查范围描述是否包含数字。", source: { blockId: "resume_block_002", quote: "尽量用数字说明变化", startOffset: 0, endOffset: 10, blockHash: "4444444444444444444444444444444444444444444444444444444444444444" }, evaluation: { inputId: "scope_text", operator: "contains_number" } },
    { id: "resume_impact", type: "check", required: true, title: "影响数字在范围内", description: "检查填写的核心数字是否大于 0 且没有超过 100。", source: { blockId: "resume_block_003", quote: "结果要能被量化比较", startOffset: 0, endOffset: 10, blockHash: "5555555555555555555555555555555555555555555555555555555555555555" }, evaluation: { inputId: "impact_value", operator: "value_between", params: { min: 1, max: 100 } } },
    { id: "resume_action", type: "check", required: true, title: "行动动词需要人工确认", description: "程序不会靠关键词假装理解语义，请确认它描述的是你的实际动作。", source: { blockId: "resume_block_004", quote: "不要只写参与和负责，要写实际动作", startOffset: 0, endOffset: 16, blockHash: "6666666666666666666666666666666666666666666666666666666666666666" }, evaluation: { inputId: "action_text", operator: "manual_evidence" } },
    { id: "resume_scope", type: "check", required: true, title: "范围边界已经填写", description: "检查是否交代了项目、模块或覆盖范围。", source: { blockId: "resume_block_005", quote: "说明行动发生的范围", startOffset: 0, endOffset: 9, blockHash: "7777777777777777777777777777777777777777777777777777777777777777" }, evaluation: { inputId: "scope_text", operator: "required" } },
    { id: "resume_role", type: "check", required: true, title: "结果名称已经填写", description: "确认你说明了这次行动带来的变化。", source: { blockId: "resume_block_006", quote: "先明确你要证明的能力", startOffset: 0, endOffset: 11, blockHash: "8888888888888888888888888888888888888888888888888888888888888888" }, evaluation: { inputId: "result_text", operator: "required" } },
    { id: "resume_review", type: "check", required: true, title: "数字单位已经填写", description: "结果数字必须有单位才不会失去含义。", source: { blockId: "resume_block_007", quote: "提交前再读一遍自己的表述", startOffset: 0, endOffset: 12, blockHash: "9999999999999999999999999999999999999999999999999999999999999999" }, evaluation: { inputId: "impact_unit", operator: "required" } },
  ],
  completion: { type: "all_required_completed", targetId: null },
  resultArtifact: { type: "inspect_summary", fields: ["matchedCount", "notMatchedCount", "needsReviewCount", "items"] },
};

export const executableResumeSource: SourceRecord = {
  id: "fixture_resume_executable",
  title: "合成样例：把经历写成可核验的简历证据",
  authorName: "工程测试数据",
  url: null,
  blocks: [
    { id: "resume_block_000", text: "先写清楚你具体做了什么", blockHash: "2222222222222222222222222222222222222222222222222222222222222222" },
    { id: "resume_block_001", text: "用一两句话交代关键行动", blockHash: "3333333333333333333333333333333333333333333333333333333333333333" },
    { id: "resume_block_002", text: "尽量用数字说明变化", blockHash: "4444444444444444444444444444444444444444444444444444444444444444" },
    { id: "resume_block_003", text: "结果要能被量化比较", blockHash: "5555555555555555555555555555555555555555555555555555555555555555" },
    { id: "resume_block_004", text: "不要只写参与和负责，要写实际动作", blockHash: "6666666666666666666666666666666666666666666666666666666666666666" },
    { id: "resume_block_005", text: "说明行动发生的范围", blockHash: "7777777777777777777777777777777777777777777777777777777777777777" },
    { id: "resume_block_006", text: "先明确你要证明的能力", blockHash: "8888888888888888888888888888888888888888888888888888888888888888" },
    { id: "resume_block_007", text: "提交前再读一遍自己的表述", blockHash: "9999999999999999999999999999999999999999999999999999999999999999" },
  ],
};

// The resume builder remains available as a narrow input/evaluator fixture, but it is not the product home or Hero.
