import "server-only";
import { getOfficialProgramPlan, type OfficialProgramPlan } from "@/src/domain/official-program-plans";
import { hackathonKnowledgeProvider, type NormalizedSource } from "@/src/domain/content-provider";
import { validateExecutableRun } from "@/src/domain/source-anchor";
import { saveDraft, type CompilationDraft } from "@/src/domain/operator-store";
import { clearOfficialCachedDraftDocuments } from "@/src/domain/persistence";
import type { ChoiceOption, ExecutableRun, ProgramState, ProgramTransition, RunComponent, SourceAnchor } from "@/src/domain/types";

type Outcome = { id: string; label: string; response: string };
type Route = { id: string; label: string; response: string; task: string; taskQuote: string; finish: string; finishQuote: string; outcomes: [Outcome, Outcome] };
type PathScript = { kind: "path"; introQuote: string; start: string; description: string; routes: [Route, Route] };
type LabRoute = { id: string; label: string; response: string; timer: string; timerQuote: string; observe: string; observeQuote: string; outcomes: [Outcome, Outcome] };
type LabScript = { kind: "lab"; introQuote: string; start: string; routes: [LabRoute, LabRoute] };
type Dimension = { id: string; label: string; response: string; input: string; inputQuote: string; assess: string; assessQuote: string; outcomes: [Outcome, Outcome] };
type SandboxScript = { kind: "sandbox"; introQuote: string; start: string; dimensions: Dimension[] };
type ArticleScript = PathScript | LabScript | SandboxScript;

const scripts: Record<string, ArticleScript> = {
  "1307332455322529792": { kind: "path", introQuote: "员工大致可以分为四种类别", start: "老板提出加薪话题前，你先从哪里进入？", description: "两条准备方式会进入不同的后续场景。", routes: [
    { id: "standard", label: "先对齐客观标准", response: "先把谈话放到老板认可的标准上。", task: "写下你准备确认的一个标准", taskQuote: "先问出在老板心目中他那一套加薪的客观标准", finish: "标准已明确后，你的下一步", finishQuote: "举出实际的证据或例子来证明", outcomes: [{ id: "prepare", label: "回去补一项事实证据", response: "路径会停在证据准备。" }, { id: "talk", label: "带着现有证据继续谈", response: "路径会进入下一次谈话准备。" }] },
    { id: "evidence", label: "先盘点已有事实证据", response: "先确认自己能带进谈话的事实。", task: "选出一项最能说明表现的事实", taskQuote: "举出实际的证据或例子来证明", finish: "证据已选定后，你的下一步", finishQuote: "先问出在老板心目中他那一套加薪的客观标准", outcomes: [{ id: "ask", label: "下一次先询问标准", response: "路径回到标准对齐。" }, { id: "organize", label: "继续补充证据", response: "路径停在证据整理。" }] },
  ] },
  "1446441987969183744": { kind: "sandbox", introQuote: "一技之长", start: "这次先把哪种职业取舍放进沙盘？", dimensions: [
    { id: "skill", label: "能力积累", response: "先看一项是否正在形成的一技之长。", input: "写下一项正在积累的能力", inputQuote: "一技之长", assess: "这项能力是否值得继续观察？", assessQuote: "稀缺陷阱", outcomes: [{ id: "continue", label: "继续积累这项能力", response: "记录为能力积累路径。" }, { id: "compare", label: "先比较替代方向", response: "记录为仍需比较的路径。" }] },
    { id: "stable", label: "短期稳定", response: "先看当前对稳定的取舍。", input: "写下一项希望维持的稳定条件", inputQuote: "稳定", assess: "它和长期积累是否存在拉扯？", assessQuote: "一技之长", outcomes: [{ id: "keep", label: "暂时保留稳定条件", response: "记录为稳定优先。" }, { id: "rebalance", label: "重新平衡投入", response: "记录为需要重新取舍。" }] },
  ] },
  "1547987528036315136": { kind: "lab", introQuote: "面对事件时，我们脑海中的认知和想法", start: "选一个低风险的主动行动实验", routes: [
    { id: "respond", label: "先尝试一次主动回应", response: "把行动限定在一件可安全完成的小事。", timer: "进行 1 分钟主动回应准备", timerQuote: "面对事件时，我们脑海中的认知和想法", observe: "这一分钟里，主动行动是否发生？", observeQuote: "退缩", outcomes: [{ id: "happened", label: "已完成一次尝试", response: "留下可重复的行动记录。" }, { id: "paused", label: "我在退缩前暂停了", response: "留下下一轮观察点。" }] },
    { id: "notice", label: "先识别让我退缩的评价", response: "先观察，不给自己下判断。", timer: "进行 1 分钟评价观察", timerQuote: "评价，会影响", observe: "这次观察后的下一步", observeQuote: "面对事件时，我们脑海中的认知和想法", outcomes: [{ id: "try", label: "再尝试一个小行动", response: "进入下一轮低风险尝试。" }, { id: "record", label: "先保留这条观察", response: "保留为本次实验记录。" }] },
  ] },
  "1509654546602856448": { kind: "lab", introQuote: "注意力分散", start: "这一轮专注实验从哪种方法开始？", routes: [
    { id: "breath", label: "先做正念呼吸", response: "先用呼吸把注意力带回当前。", timer: "进行 1 分钟呼吸观察", timerQuote: "正念呼吸", observe: "计时中是否出现明显中断？", observeQuote: "注意力分散", outcomes: [{ id: "steady", label: "保持到计时结束", response: "记录为一轮稳定观察。" }, { id: "interrupted", label: "中途出现中断", response: "记录中断，下一轮可换方法。" }] },
    { id: "focus", label: "先开启一个短时专注段", response: "先把注意力放进一个有限时段。", timer: "进行 1 分钟专注段", timerQuote: "番茄工作法", observe: "这一段结束后，你想如何记录？", observeQuote: "注意力分散", outcomes: [{ id: "repeat", label: "下次重复这个节奏", response: "记录为可重复节奏。" }, { id: "adjust", label: "下次调整节奏", response: "记录为需要调整的实验。" }] },
  ] },
  "1443597377995702272": { kind: "lab", introQuote: "学习任务", start: "这轮学习启动从哪里开始？", routes: [
    { id: "tiny", label: "把任务缩到最小", response: "先完成一个可启动的最小动作。", timer: "进行 1 分钟最小启动", timerQuote: "学习任务", observe: "最小动作是否启动？", observeQuote: "学习", outcomes: [{ id: "started", label: "已经启动", response: "保留这次启动方式。" }, { id: "blocked", label: "仍然卡住", response: "保留阻力，下一轮再调整。" }] },
    { id: "rhythm", label: "先安排一个短时学习段", response: "先把学习放进一个有限时段。", timer: "进行 1 分钟学习节奏试验", timerQuote: "驼峰", observe: "这次节奏是否适合继续？", observeQuote: "学习任务", outcomes: [{ id: "continue", label: "继续这一节奏", response: "记录为可重复节奏。" }, { id: "change", label: "下次换一种安排", response: "记录为待调整节奏。" }] },
  ] },
  "1528398892400353280": { kind: "path", introQuote: "该拒绝时", start: "面对一项请求，你想先守住什么？", description: "不同的回应重点会进入不同的排练路径。", routes: [
    { id: "boundary", label: "先澄清自己的边界", response: "先分清这件事是否该由你承担。", task: "写下一句你愿意承担的边界", taskQuote: "该拒绝时", finish: "边界已写下后，你的回应方式", finishQuote: "拒绝", outcomes: [{ id: "state", label: "直接但平和地说明", response: "记录为明确回应路径。" }, { id: "pause", label: "先争取思考时间", response: "记录为延后回应路径。" }] },
    { id: "relationship", label: "先整理不攻击对方的说法", response: "先把回应从人身评价中抽离。", task: "写下一句不攻击对方的回应", taskQuote: "朋友", finish: "表达已准备后，你的下一步", finishQuote: "该拒绝时", outcomes: [{ id: "say", label: "准备说出这句话", response: "记录为表达路径。" }, { id: "revise", label: "先改写后再回应", response: "记录为继续整理路径。" }] },
  ] },
  "1697254818945699840": { kind: "path", introQuote: "职业倦怠", start: "这次先观察哪一类工作体验？", description: "这是工作状态观察，不是医疗或心理诊断。", routes: [
    { id: "signals", label: "先看文章列举的表现", response: "把注意力放到可观察的工作体验。", task: "记录一个当前可观察的工作信号", taskQuote: "三大表现", finish: "这项信号接下来怎么处理？", finishQuote: "职业倦怠", outcomes: [{ id: "track", label: "继续观察一段时间", response: "记录为持续观察路径。" }, { id: "discuss", label: "先和可信的人讨论", response: "记录为需要支持的路径。" }] },
    { id: "flexibility", label: "先看自己是否仍有调整空间", response: "关注应对方式是否还有弹性。", task: "记录一项可以调整的工作条件", taskQuote: "应对灵活性", finish: "你想保留哪种后续方向？", finishQuote: "三大表现", outcomes: [{ id: "adjust", label: "尝试一个小调整", response: "记录为调整实验路径。" }, { id: "observe", label: "先继续观察", response: "记录为观察路径。" }] },
  ] },
  "1251918148732559360": { kind: "sandbox", introQuote: "别离开行业", start: "把哪一个职业积累维度放进路径沙盘？", dimensions: [
    { id: "industry", label: "行业连续性", response: "先看经验是否持续留在同一行业。", input: "写下你正在积累的一个行业节点", inputQuote: "别离开行业", assess: "它是否支持行业连续积累？", assessQuote: "别离开行业", outcomes: [{ id: "continuous", label: "是，继续积累", response: "职业路径标为行业连续。" }, { id: "unclear", label: "暂不确定", response: "职业路径标为需补充事实。" }] },
    { id: "role", label: "职位连续性", response: "先看经验是否持续留在同一职位方向。", input: "写下你正在积累的一个职位节点", inputQuote: "别离开职位", assess: "它是否支持职位连续积累？", assessQuote: "别离开职位", outcomes: [{ id: "continuous", label: "是，继续积累", response: "职业路径标为职位连续。" }, { id: "unclear", label: "暂不确定", response: "职业路径标为需补充事实。" }] },
    { id: "longterm", label: "长期选择", response: "先看这条路能否持续走下去。", input: "写下一个想持续积累的方向", inputQuote: "选择一条路一直走下去", assess: "它是否值得保留为长期方向？", assessQuote: "选择一条路一直走下去", outcomes: [{ id: "keep", label: "先保留这条方向", response: "职业路径标为继续观察。" }, { id: "compare", label: "还需要比较", response: "职业路径标为待比较。" }] },
  ] },
  "1393937473601368064": { kind: "sandbox", introQuote: "要聚焦", start: "先运行目标的哪一条结构规则？", dimensions: [
    { id: "focus", label: "聚焦程度", response: "先查看目标是否聚焦。", input: "用一句话写下当前目标", inputQuote: "要聚焦", assess: "这个目标是否有清晰的聚焦对象？", assessQuote: "要聚焦", outcomes: [{ id: "matched", label: "有，保留这个聚焦", response: "结果标为聚焦条件已满足。" }, { id: "gap", label: "没有，先缩小范围", response: "结果标为需要缩小范围。" }] },
    { id: "specific", label: "具体程度", response: "先查看目标是否具体。", input: "写下一个可观察的结果", inputQuote: "要具体", assess: "它是否已能被具体描述？", assessQuote: "要具体", outcomes: [{ id: "matched", label: "有，保留这个描述", response: "结果标为具体条件已满足。" }, { id: "gap", label: "没有，补一条事实描述", response: "结果标为需要补充描述。" }] },
    { id: "time", label: "时间边界", response: "先查看目标是否有期限。", input: "写下一个明确的时间边界", inputQuote: "有期限", assess: "它是否已经有时间边界？", assessQuote: "有期限", outcomes: [{ id: "matched", label: "有，保留这个期限", response: "结果标为期限条件已满足。" }, { id: "gap", label: "没有，补一个期限", response: "结果标为需要补充期限。" }] },
  ] },
  "1523701957479239680": { kind: "path", introQuote: "闭合任务回路", start: "这次先从哪种任务闭合动作开始？", description: "选择会决定你看到的收口路径。", routes: [
    { id: "list", label: "先列出一件未闭合事项", response: "先把仍占用注意力的事项找出来。", task: "写下这件事项的收口动作", taskQuote: "尚未闭合", finish: "收口动作已明确后", finishQuote: "闭合任务回路", outcomes: [{ id: "close", label: "准备执行收口", response: "记录为待闭合路径。" }, { id: "end", label: "决定终止这件事", response: "记录为终止路径。" }] },
    { id: "review", label: "先定期回看未闭合事项", response: "先为任务留下可回看的入口。", task: "选定一次回看时机", taskQuote: "定期列出", finish: "回看时机已确定后", finishQuote: "尚未闭合", outcomes: [{ id: "review", label: "保留下一次回看", response: "记录为回看路径。" }, { id: "act", label: "现在就做一个收口", response: "记录为立即行动路径。" }] },
  ] },
};

function anchor(source: NormalizedSource, phrase: string, fallbackIndex: number): SourceAnchor {
  const hit = source.blocks.find((block) => block.text.includes(phrase)); const block = hit ?? source.blocks[Math.min(fallbackIndex, source.blocks.length - 1)];
  if (!block) throw new Error("SOURCE_BLOCK_MISSING");
  const phraseStart = hit ? block.text.indexOf(phrase) : Math.min(Math.max(0, fallbackIndex * 70), Math.max(0, block.text.length - 96));
  const left = Math.max(block.text.lastIndexOf("。", phraseStart - 1) + 1, block.text.lastIndexOf("\n", phraseStart - 1) + 1, 0);
  const stops = [block.text.indexOf("。", phraseStart + phrase.length), block.text.indexOf("\n", phraseStart + phrase.length)].filter((item) => item >= 0).sort((a, b) => a - b); const right = stops.length ? Math.min(block.text.length, stops[0] + 1) : Math.min(block.text.length, phraseStart + Math.max(phrase.length + 40, 96));
  const start = Math.min(left, phraseStart); const end = right - start < 24 ? Math.min(block.text.length, start + 96) : right; const quote = block.text.slice(start, Math.max(start + 1, end)).slice(0, 220);
  return { blockId: block.id, quote, startOffset: start, endOffset: start + quote.length, blockHash: block.blockHash };
}
const choose = (items: Array<{ id: string; label: string; response: string; nextId: string; value?: number }>): ChoiceOption[] => items;

function pathRun(source: NormalizedSource, plan: OfficialProgramPlan, script: PathScript): ExecutableRun {
  const routeLabels: Record<string, string> = { "0": "尚未选择" }; const outcomeLabels: Record<string, string> = { "0": "尚未形成结果" }; const components: RunComponent[] = [{ id: "start", type: "choice", required: true, title: script.start, description: script.description, source: anchor(source, script.introQuote, 0), options: choose(script.routes.map((route) => ({ id: route.id, label: route.label, response: route.response, nextId: `do_${route.id}` }))) }]; const transitions: ProgramTransition[] = []; const states: ProgramState[] = [{ id: "start", label: "等待选择", description: "选择会决定本次路径。" }];
  script.routes.forEach((route, routeIndex) => { routeLabels[String(routeIndex + 1)] = route.label; states.push({ id: `route_${route.id}`, label: `进入：${route.label}`, description: "已进入该文章支持的有限路径。" }, { id: `review_${route.id}`, label: "等待收口选择", description: "后续选择将影响本次结果。" }); components.push({ id: `do_${route.id}`, type: "input", required: true, title: route.task, description: "写下一句和你当前情况有关的事实；它只保存在当前浏览器，随后进入收口选择。", source: anchor(source, route.taskQuote, routeIndex + 1), nextId: `finish_${route.id}`, ...(plan.model === "dialogue_rehearsal" ? { speaker: "谈话准备", utterance: route.label } : {}) }, { id: `finish_${route.id}`, type: "choice", required: true, title: route.finish, description: "不同选择会留下不同的结果状态。", source: anchor(source, route.finishQuote, routeIndex + 3), options: choose(route.outcomes.map((outcome) => ({ id: outcome.id, label: outcome.label, response: outcome.response, nextId: "result" }))) }); transitions.push({ from: "start", componentId: "start", when: `choice:${route.id}`, to: `route_${route.id}`, effects: [{ variableId: "route", delta: routeIndex + 1 }] }, { from: `route_${route.id}`, componentId: `do_${route.id}`, when: "completed", to: `review_${route.id}` }); route.outcomes.forEach((outcome, index) => { outcomeLabels[String(routeIndex * 2 + index + 1)] = outcome.label; transitions.push({ from: `review_${route.id}`, componentId: `finish_${route.id}`, when: `choice:${outcome.id}`, to: "complete", effects: [{ variableId: "outcome", delta: routeIndex * 2 + index + 1 }] }); }); });
  states.push({ id: "complete", label: "路径已形成", description: "可回看这次选择、结果与原文依据。" });
  return { schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 4, sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components: [...components, { id: "result", type: "result", title: "本次路径结果", description: "查看本次路径、结果状态和原文依据。" }], program: { model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete", states, variables: [{ id: "route", label: "选择路径", initialValue: 0, min: 0, max: 2, valueLabels: routeLabels }, { id: "outcome", label: "本次结果", initialValue: 0, min: 0, max: 4, valueLabels: outcomeLabels }], transitions }, completion: { type: "all_required_completed" }, resultArtifact: { type: plan.capability === "diagnose" ? "diagnose_trace" : "mission_snapshot", fields: ["path", "route", "outcome", "sourceEvidence"] } };
}

function labRun(source: NormalizedSource, plan: OfficialProgramPlan, script: LabScript): ExecutableRun {
  const methodLabels: Record<string, string> = { "0": "尚未选择" }; const feedbackLabels: Record<string, string> = { "0": "尚未记录" }; const components: RunComponent[] = [{ id: "start", type: "choice", required: true, title: script.start, description: "选择方法后会进入不同的实验节奏与反馈记录。", source: anchor(source, script.introQuote, 0), options: choose(script.routes.map((route) => ({ id: route.id, label: route.label, response: route.response, nextId: `timer_${route.id}` }))) }]; const transitions: ProgramTransition[] = []; const states: ProgramState[] = [{ id: "start", label: "等待实验方法", description: "选择一轮低风险实验。" }];
  script.routes.forEach((route, routeIndex) => { methodLabels[String(routeIndex + 1)] = route.label; states.push({ id: `method_${route.id}`, label: `实验中：${route.label}`, description: "计时结束后记录有限反馈。" }, { id: `observe_${route.id}`, label: "记录实验反馈", description: "反馈会决定本次实验结果。" }); components.push({ id: `timer_${route.id}`, type: "timer", required: true, title: route.timer, description: "这是产品内的一轮短时实验，不推导现实效果。", durationSeconds: 60, source: anchor(source, route.timerQuote, routeIndex + 1), nextId: `observe_${route.id}` }, { id: `observe_${route.id}`, type: "choice", required: true, title: route.observe, description: "选择只记录本轮实验反馈。", source: anchor(source, route.observeQuote, routeIndex + 3), options: choose(route.outcomes.map((outcome) => ({ id: outcome.id, label: outcome.label, response: outcome.response, nextId: "result" }))) }); transitions.push({ from: "start", componentId: "start", when: `choice:${route.id}`, to: `method_${route.id}`, effects: [{ variableId: "method", delta: routeIndex + 1 }] }, { from: `method_${route.id}`, componentId: `timer_${route.id}`, when: "completed", to: `observe_${route.id}` }); route.outcomes.forEach((outcome, index) => { feedbackLabels[String(routeIndex * 2 + index + 1)] = outcome.label; transitions.push({ from: `observe_${route.id}`, componentId: `observe_${route.id}`, when: `choice:${outcome.id}`, to: "complete", effects: [{ variableId: "feedback", delta: routeIndex * 2 + index + 1 }] }); }); });
  states.push({ id: "complete", label: "实验记录已形成", description: "可对照本次方法、反馈和来源。" });
  return { schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 3, sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components: [...components, { id: "result", type: "result", title: "本次实验记录", description: "查看方法、反馈与原文依据。" }], program: { model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete", states, variables: [{ id: "method", label: "实验方法", initialValue: 0, min: 0, max: 2, valueLabels: methodLabels }, { id: "feedback", label: "本轮反馈", initialValue: 0, min: 0, max: 4, valueLabels: feedbackLabels }], transitions }, completion: { type: "all_required_completed" }, resultArtifact: { type: "mission_snapshot", fields: ["method", "feedback", "sourceEvidence"] } };
}

function sandboxRun(source: NormalizedSource, plan: OfficialProgramPlan, script: SandboxScript): ExecutableRun {
  const dimensionLabels: Record<string, string> = { "0": "尚未选择" }; const signalLabels: Record<string, string> = { "0": "尚未记录" }; const components: RunComponent[] = [{ id: "start", type: "choice", required: true, title: script.start, description: "选择一个维度后，输入一项事实，再运行这条有限规则。", source: anchor(source, script.introQuote, 0), options: choose(script.dimensions.map((dimension, index) => ({ id: dimension.id, label: dimension.label, response: dimension.response, nextId: `fact_${dimension.id}`, value: index + 1 }))) }]; const transitions: ProgramTransition[] = []; const states: ProgramState[] = [{ id: "start", label: "等待选择规则", description: "选择会决定当前沙盘维度。" }];
  script.dimensions.forEach((dimension, index) => { dimensionLabels[String(index + 1)] = dimension.label; states.push({ id: `dimension_${dimension.id}`, label: `正在检查：${dimension.label}`, description: "先保留一项事实，再给出有限信号。" }, { id: `assess_${dimension.id}`, label: "等待规则信号", description: "由你的明确选择决定本次结果，不做推断。" }); components.push({ id: `fact_${dimension.id}`, type: "input", required: true, title: dimension.input, description: "只保留一句最小事实在当前浏览器中，不上传正文或材料。", source: anchor(source, dimension.inputQuote, index + 1), nextId: `assess_${dimension.id}` }, { id: `assess_${dimension.id}`, type: "choice", required: true, title: dimension.assess, description: "这是对当前输入事实的有限自检，不是外部评价。", source: anchor(source, dimension.assessQuote, index + 4), options: choose(dimension.outcomes.map((outcome) => ({ id: outcome.id, label: outcome.label, response: outcome.response, nextId: "result" }))) }); transitions.push({ from: "start", componentId: "start", when: `choice:${dimension.id}`, to: `dimension_${dimension.id}`, effects: [{ variableId: "dimension", delta: index + 1 }] }, { from: `dimension_${dimension.id}`, componentId: `fact_${dimension.id}`, when: "completed", to: `assess_${dimension.id}` }); dimension.outcomes.forEach((outcome, outcomeIndex) => { signalLabels[String(index * 2 + outcomeIndex + 1)] = outcome.label; transitions.push({ from: `assess_${dimension.id}`, componentId: `assess_${dimension.id}`, when: `choice:${outcome.id}`, to: "complete", effects: [{ variableId: "signal", delta: index * 2 + outcomeIndex + 1 }] }); }); });
  states.push({ id: "complete", label: "沙盘结果已形成", description: "可查看这次维度、信号和原文依据。" });
  return { schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 3, sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components: [...components, { id: "result", type: "result", title: "本次规则结果", description: "查看当前维度、规则信号和来源。" }], program: { model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete", states, variables: [{ id: "dimension", label: "检查维度", initialValue: 0, min: 0, max: script.dimensions.length, valueLabels: dimensionLabels }, { id: "signal", label: "规则信号", initialValue: 0, min: 0, max: script.dimensions.length * 2, valueLabels: signalLabels }], transitions }, completion: { type: "all_required_completed" }, resultArtifact: { type: "inspect_summary", fields: ["dimension", "signal", "sourceEvidence"] } };
}

function careerPathRun(source: NormalizedSource, plan: OfficialProgramPlan): ExecutableRun {
  const components: RunComponent[] = [
    { id: "career_fact", type: "input", required: true, title: "写下下一步职业选择，以及能带走的一项成果", description: "用一句话写清：准备去的行业或问题领域、想继续变深的职责，以及一项项目或作品成果。", source: anchor(source, "别离开行业", 0), nextId: "continuity_signal" },
    { id: "continuity_signal", type: "choice", required: true, title: "这次变化，积累能否接着往上叠？", description: "只判断行业经验和职责是否还能被下一站使用，不评价选择好坏。", source: anchor(source, "别离开职位", 2), options: choose([
      { id: "continuous", label: "大部分能延续到下一站", response: "职业积累标为可延续。", nextId: "direction" },
      { id: "rebuild", label: "至少一项需要重新建立", response: "职业积累标为需要补证或重建。", nextId: "direction" },
    ]) },
    { id: "direction", type: "choice", required: true, title: "基于这个判断，这次先怎么走？", description: "你的选择会决定职业积累图最后保留的行动方向。", source: anchor(source, "选择一条路一直走下去", 5), options: choose([
      { id: "stack", label: "沿当前方向再叠加一段", response: "结果会保留一条继续积累路径。", nextId: "result" },
      { id: "compare", label: "先比较，再决定是否换轨", response: "结果会标出需要比较与补证的节点。", nextId: "result" },
    ]) },
    { id: "result", type: "result", title: "职业积累地图", description: "把你的行业经验、职责、成果证据和下一步方向放在一张图里。" },
  ];
  return {
    schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 2,
    sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components,
    program: {
      model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete",
      states: [
        { id: "start", label: "正在带入职业事实", description: "先把下一步选择与可带走成果写在一起。" },
        { id: "continuity_review", label: "正在判断积累连续性", description: "只看行业经验和职责能否在下一站继续使用。" },
        { id: "direction_review", label: "正在确定下一步方向", description: "选择继续叠加，或先比较补证。" },
        { id: "complete", label: "职业积累地图已形成", description: "可回看填写、状态变化与每条原文依据。" },
      ],
      variables: [
        { id: "continuity", label: "积累连续性", initialValue: 0, min: 0, max: 2, valueLabels: { "0": "尚未判断", "1": "需要补证或重建", "2": "大部分可延续" } },
        { id: "direction", label: "本轮方向", initialValue: 0, min: 0, max: 2, valueLabels: { "0": "尚未选择", "1": "先比较补证", "2": "继续叠加" } },
      ],
      transitions: [
        { from: "start", componentId: "career_fact", when: "completed", to: "continuity_review" },
        { from: "continuity_review", componentId: "continuity_signal", when: "choice:continuous", to: "direction_review", effects: [{ variableId: "continuity", delta: 2 }] },
        { from: "continuity_review", componentId: "continuity_signal", when: "choice:rebuild", to: "direction_review", effects: [{ variableId: "continuity", delta: 1 }] },
        { from: "direction_review", componentId: "direction", when: "choice:stack", to: "complete", effects: [{ variableId: "direction", delta: 2 }] },
        { from: "direction_review", componentId: "direction", when: "choice:compare", to: "complete", effects: [{ variableId: "direction", delta: 1 }] },
      ],
    },
    completion: { type: "all_required_completed" }, resultArtifact: { type: "inspect_summary", fields: ["careerFact", "continuity", "direction", "path", "sourceEvidence"] },
  };
}

function salaryDialogueRun(source: NormalizedSource, plan: OfficialProgramPlan): ExecutableRun {
  const components: RunComponent[] = [
    { id: "talking_fact", type: "input", required: true, title: "写下一个标准，以及能对应它的事实", description: "例如“达到独立负责客户项目”＋“本季度独立交付 3 个项目”。只写可确认的标准和事实，不写自我评价。", source: anchor(source, "先问出在老板心目中他那一套加薪的客观标准", 0), nextId: "alignment", speaker: "你准备说", utterance: "我想确认标准，并用一项事实说明我现在的位置。" },
    { id: "alignment", type: "choice", required: true, title: "对照标准后，这项证据处于哪种状态？", description: "不同答案会进入不同的谈话收口。", source: anchor(source, "客观标准", 2), options: choose([
      { id: "aligned", label: "能够直接证明我已达标", response: "进入“带证据继续谈”的收口。", nextId: "ready_close" },
      { id: "gap", label: "只能证明部分达标", response: "进入“补证或条件交换”的收口。", nextId: "gap_close" },
    ]), speaker: "对照标准", utterance: "不要凭感觉，先看证据与标准的对应关系。" },
    { id: "ready_close", type: "choice", required: true, title: "证据已对齐，这次谈话怎样收口？", description: "选择一个你准备带进真实谈话的动作。", source: anchor(source, "举出实际的证据或例子来证明", 3), options: choose([
      { id: "present", label: "按标准逐条呈现证据", response: "谈话卡会生成“标准—证据”对应路径。", nextId: "result" },
      { id: "confirm", label: "先确认评估节点与决定时间", response: "谈话卡会保留下一次确认节点。", nextId: "result" },
    ]), speaker: "谈话收口", utterance: "让谈话落在证据或明确时间节点上。" },
    { id: "gap_close", type: "choice", required: true, title: "只有部分达标，这次谈话怎样推进？", description: "原文给出的不是硬撑，而是补证或讨论条件交换。", source: anchor(source, "条件交换谈判", 4), options: choose([
      { id: "prepare", label: "先补齐最关键的一项证据", response: "谈话卡会标出证据缺口。", nextId: "result" },
      { id: "exchange", label: "讨论超额项与缺口的条件交换", response: "谈话卡会进入条件交换路径。", nextId: "result" },
    ]), speaker: "谈话收口", utterance: "承认缺口，再选择补证或条件交换。" },
    { id: "result", type: "result", title: "加薪谈话准备卡", description: "保留标准、对应证据和这次谈话的收口方式。" },
  ];
  return {
    schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 2,
    sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components,
    program: {
      model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete",
      states: [
        { id: "start", label: "正在准备标准和事实", description: "先把谈话从主观评价转到客观标准与证据。" },
        { id: "alignment_review", label: "正在对照标准与证据", description: "判断是已对齐还是仍有缺口。" },
        { id: "ready_close", label: "证据已对齐", description: "选择带证据谈或确认决定节点。" },
        { id: "gap_close", label: "证据存在缺口", description: "选择补证或条件交换。" },
        { id: "complete", label: "谈话准备卡已形成", description: "标准、证据和收口动作已放在同一条路径上。" },
      ],
      variables: [
        { id: "alignment", label: "证据对应", initialValue: 0, min: 0, max: 2, valueLabels: { "0": "尚未对照", "1": "部分达标", "2": "已经达标" } },
        { id: "outcome", label: "谈话收口", initialValue: 0, min: 0, max: 4, valueLabels: { "0": "尚未选择", "1": "逐条呈现证据", "2": "确认决定时间", "3": "先补关键证据", "4": "讨论条件交换" } },
      ],
      transitions: [
        { from: "start", componentId: "talking_fact", when: "completed", to: "alignment_review" },
        { from: "alignment_review", componentId: "alignment", when: "choice:aligned", to: "ready_close", effects: [{ variableId: "alignment", delta: 2 }] },
        { from: "alignment_review", componentId: "alignment", when: "choice:gap", to: "gap_close", effects: [{ variableId: "alignment", delta: 1 }] },
        { from: "ready_close", componentId: "ready_close", when: "choice:present", to: "complete", effects: [{ variableId: "outcome", delta: 1 }] },
        { from: "ready_close", componentId: "ready_close", when: "choice:confirm", to: "complete", effects: [{ variableId: "outcome", delta: 2 }] },
        { from: "gap_close", componentId: "gap_close", when: "choice:prepare", to: "complete", effects: [{ variableId: "outcome", delta: 3 }] },
        { from: "gap_close", componentId: "gap_close", when: "choice:exchange", to: "complete", effects: [{ variableId: "outcome", delta: 4 }] },
      ],
    },
    completion: { type: "all_required_completed" }, resultArtifact: { type: "mission_snapshot", fields: ["talkingFact", "alignment", "outcome", "path", "sourceEvidence"] },
  };
}

function focusExperimentRun(source: NormalizedSource, plan: OfficialProgramPlan): ExecutableRun {
  const components: RunComponent[] = [
    { id: "focus_object", type: "input", required: true, title: "写下这一分钟只做的一件小事", description: "把任务缩到一分钟内可以真实推进的动作；结果会把它带回实验记录。", source: anchor(source, "注意力分散", 0), nextId: "method" },
    { id: "method", type: "choice", required: true, title: "这轮用哪种方法把注意力带回来？", description: "两种方法会进入不同的计时过程与反馈。", source: anchor(source, "正念呼吸", 1), options: choose([
      { id: "breath", label: "正念呼吸：先练习察觉走神", response: "进入一分钟呼吸观察。", nextId: "timer_breath" },
      { id: "focus", label: "短时番茄：直接推进这件小事", response: "进入一分钟专注采样。", nextId: "timer_focus" },
    ]) },
    { id: "timer_breath", type: "timer", required: true, title: "进行一分钟呼吸观察", description: "这是为了现场完成而缩短的采样，不等同于原文建议的完整练习时长。", durationSeconds: 60, source: anchor(source, "正念呼吸", 2), nextId: "feedback_breath" },
    { id: "feedback_breath", type: "choice", required: true, title: "这一分钟，你怎样发现并处理走神？", description: "只记录刚才实际发生的反馈。", source: anchor(source, "察觉到走神", 3), options: choose([
      { id: "returned", label: "发现后把注意力带回来了", response: "记录为一次成功返回。", nextId: "result" },
      { id: "drifted", label: "直到结束才发现一直走神", response: "记录为下一轮需要更早察觉。", nextId: "result" },
    ]) },
    { id: "timer_focus", type: "timer", required: true, title: "进行一分钟短时专注", description: "直接推进你写下的小事，并留意中断；这是缩短的现场采样。", durationSeconds: 60, source: anchor(source, "番茄工作法", 4), nextId: "feedback_focus" },
    { id: "feedback_focus", type: "choice", required: true, title: "这一分钟，这件小事推进到哪里？", description: "反馈决定结果是保留节奏还是调整下一轮。", source: anchor(source, "工作 20 分钟，休息 5 分钟", 5), options: choose([
      { id: "advanced", label: "有可观察的推进", response: "记录为可继续复用的短时节奏。", nextId: "result" },
      { id: "interrupted", label: "被中断，没有形成推进", response: "记录中断，下一轮改用更小动作或呼吸法。", nextId: "result" },
    ]) },
    { id: "result", type: "result", title: "专注实验记录", description: "保留实验对象、方法、计时和真实反馈。" },
  ];
  return {
    schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 3,
    sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components,
    program: {
      model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete",
      states: [
        { id: "start", label: "正在确定实验对象", description: "先写下一分钟内要推进的小事。" },
        { id: "method", label: "正在选择专注方法", description: "呼吸观察与短时番茄会进入不同路径。" },
        { id: "breath", label: "呼吸观察进行中", description: "计时后记录是否察觉并带回注意力。" },
        { id: "focus", label: "短时专注进行中", description: "计时后记录是否产生可观察推进。" },
        { id: "feedback_breath", label: "正在记录走神反馈", description: "只记录刚才真实发生的情况。" },
        { id: "feedback_focus", label: "正在记录推进反馈", description: "只记录刚才真实发生的情况。" },
        { id: "complete", label: "专注实验记录已形成", description: "可以换一种方法再次运行并比较。" },
      ],
      variables: [
        { id: "method", label: "实验方法", initialValue: 0, min: 0, max: 2, valueLabels: { "0": "尚未选择", "1": "正念呼吸", "2": "短时番茄" } },
        { id: "feedback", label: "本轮反馈", initialValue: 0, min: 0, max: 4, valueLabels: { "0": "尚未记录", "1": "成功带回注意力", "2": "需要更早察觉", "3": "产生实际推进", "4": "发生中断" } },
      ],
      transitions: [
        { from: "start", componentId: "focus_object", when: "completed", to: "method" },
        { from: "method", componentId: "method", when: "choice:breath", to: "breath", effects: [{ variableId: "method", delta: 1 }] },
        { from: "method", componentId: "method", when: "choice:focus", to: "focus", effects: [{ variableId: "method", delta: 2 }] },
        { from: "breath", componentId: "timer_breath", when: "completed", to: "feedback_breath" },
        { from: "feedback_breath", componentId: "feedback_breath", when: "choice:returned", to: "complete", effects: [{ variableId: "feedback", delta: 1 }] },
        { from: "feedback_breath", componentId: "feedback_breath", when: "choice:drifted", to: "complete", effects: [{ variableId: "feedback", delta: 2 }] },
        { from: "focus", componentId: "timer_focus", when: "completed", to: "feedback_focus" },
        { from: "feedback_focus", componentId: "feedback_focus", when: "choice:advanced", to: "complete", effects: [{ variableId: "feedback", delta: 3 }] },
        { from: "feedback_focus", componentId: "feedback_focus", when: "choice:interrupted", to: "complete", effects: [{ variableId: "feedback", delta: 4 }] },
      ],
    },
    completion: { type: "all_required_completed" }, resultArtifact: { type: "mission_snapshot", fields: ["focusObject", "method", "feedback", "path", "sourceEvidence"] },
  };
}

function goalStructureRun(source: NormalizedSource, plan: OfficialProgramPlan): ExecutableRun {
  const components: RunComponent[] = [
    { id: "goal_draft", type: "input", required: true, title: "写下目标、完成标志和期限", description: "用一句话写：要完成什么、什么样算完成、最晚什么时候完成。先写草案，不要求一次完美。", source: anchor(source, "要聚焦", 0), nextId: "gap_assess" },
    { id: "gap_assess", type: "choice", required: true, title: "对照文章规则，这份草案最缺哪一项？", description: "这一步不会替你打分；它只确定下一轮最应该先补的结构。", source: anchor(source, "有期限", 4), options: choose([
      { id: "ready", label: "三项都已清楚", response: "目标结构暂时完整，可进入下一步行动。", nextId: "next_action" },
      { id: "focus", label: "目标对象还不够聚焦", response: "结果会提示先缩小到一个共同目标。", nextId: "next_action" },
      { id: "result", label: "完成标志还不够具体", response: "结果会提示补一条可观察结果。", nextId: "next_action" },
      { id: "deadline", label: "期限仍然模糊", response: "结果会提示补一个明确的时间边界。", nextId: "next_action" },
    ]) },
    { id: "next_action", type: "choice", required: true, title: "这次先把目标推进到哪里？", description: "选择后会生成一张带着原草案和下一步的目标修正卡。", source: anchor(source, "明确完成的截止时间", 5), options: choose([
      { id: "rewrite", label: "现在就补写最缺的一项", response: "结果会保留一条立即修正动作。", nextId: "result" },
      { id: "review", label: "带着草案找相关人共同确认", response: "结果会保留一条共同确认动作。", nextId: "result" },
    ]) },
    { id: "result", type: "result", title: "目标修正卡", description: "把原目标、可观察结果、期限和三条规则状态放在一起。" },
  ];
  return {
    schemaVersion: "1.3", title: source.title, description: plan.goal, capability: plan.capability!, category: plan.experience, estimatedMinutes: 2,
    sourceRef: { sourceId: source.id, contentHash: source.contentHash }, components,
    program: {
      model: plan.model!, primitives: plan.primitives!, initialState: "start", terminalState: "complete",
      states: [
        { id: "start", label: "正在记录目标草案", description: "把目标、完成标志和期限放在一句话里。" },
        { id: "gap_review", label: "正在定位最小缺口", description: "根据原文确认先补聚焦、具体或期限。" },
        { id: "action_review", label: "正在确定下一步", description: "选择现在补写，或找相关人共同确认。" },
        { id: "complete", label: "目标修正卡已形成", description: "可直接看到已满足规则与仍需改写处。" },
      ],
      variables: [
        { id: "gap", label: "最先要补", initialValue: 0, min: 0, max: 4, valueLabels: { "0": "尚未判断", "1": "聚焦", "2": "完成标志", "3": "期限", "4": "结构暂时完整" } },
        { id: "action", label: "下一步", initialValue: 0, min: 0, max: 2, valueLabels: { "0": "尚未选择", "1": "立即补写", "2": "共同确认" } },
      ],
      transitions: [
        { from: "start", componentId: "goal_draft", when: "completed", to: "gap_review" },
        { from: "gap_review", componentId: "gap_assess", when: "choice:ready", to: "action_review", effects: [{ variableId: "gap", delta: 4 }] },
        { from: "gap_review", componentId: "gap_assess", when: "choice:focus", to: "action_review", effects: [{ variableId: "gap", delta: 1 }] },
        { from: "gap_review", componentId: "gap_assess", when: "choice:result", to: "action_review", effects: [{ variableId: "gap", delta: 2 }] },
        { from: "gap_review", componentId: "gap_assess", when: "choice:deadline", to: "action_review", effects: [{ variableId: "gap", delta: 3 }] },
        { from: "action_review", componentId: "next_action", when: "choice:rewrite", to: "complete", effects: [{ variableId: "action", delta: 1 }] },
        { from: "action_review", componentId: "next_action", when: "choice:review", to: "complete", effects: [{ variableId: "action", delta: 2 }] },
      ],
    },
    completion: { type: "all_required_completed" }, resultArtifact: { type: "inspect_summary", fields: ["goalDraft", "gap", "action", "sourceEvidence"] },
  };
}

function buildRun(source: NormalizedSource, plan: OfficialProgramPlan, script: ArticleScript): ExecutableRun {
  if (source.id === "1251918148732559360") return careerPathRun(source, plan);
  if (source.id === "1307332455322529792") return salaryDialogueRun(source, plan);
  if (source.id === "1509654546602856448") return focusExperimentRun(source, plan);
  if (source.id === "1393937473601368064") return goalStructureRun(source, plan);
  return script.kind === "lab" ? labRun(source, plan, script) : script.kind === "sandbox" ? sandboxRun(source, plan, script) : pathRun(source, plan, script);
}

export async function precompileOfficialPool(): Promise<CompilationDraft[]> {
  const candidates = await hackathonKnowledgeProvider.listCandidates(); await clearOfficialCachedDraftDocuments();
  const drafts = await Promise.all(candidates.map(async (candidate) => { const source = await hackathonKnowledgeProvider.getSource(candidate.workId); const plan = getOfficialProgramPlan(candidate.workId); const script = scripts[candidate.workId]; if (!plan?.model || !plan.capability || !plan.primitives || !script) throw new Error(`PROGRAM_PLAN_MISSING:${candidate.workId}`); const run = buildRun(source, plan, script); const errors = validateExecutableRun(run, source); if (errors.length) throw new Error(`ANCHOR_VALIDATION_FAILED:${candidate.workId}:${errors.join(",")}`); const draft: CompilationDraft = { id: `official-cache-${candidate.workId}`, source, run, createdAt: new Date().toISOString(), judge: { deterministic: true, reason: "official editorial program plan" }, planner: { deterministic: true, family: plan.family, experience: plan.experience, goal: plan.goal }, semanticValidation: { approved: true, concerns: ["Requires human preview before public release."] }, state: "draft" }; await saveDraft(draft); return draft; }));
  return drafts;
}
