import type { DemoKnowledge } from "@/src/data/demo-knowledge";

export type DemoAnswers = Record<string, string>;
export type DemoRuleState = { label: string; status: "met" | "gap" | "note"; reason: string; anchor: string };
export type DemoResultContext = {
  kind: DemoKnowledge["kind"];
  state: string;
  selectedPath: string;
  title: string;
  summary: string;
  artifactTitle: string;
  artifactLines: Array<{ label: string; value: string }>;
  rules: DemoRuleState[];
};

const text = (value: string | undefined, min = 2) => Boolean(value && value.trim().length >= min);
const number = (value: string | undefined) => value !== undefined && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;

export function buildDemoResultContext(article: DemoKnowledge, answers: DemoAnswers): DemoResultContext {
  if (article.kind === "rental") {
    const rent = number(answers.rent); const fees = number(answers.fees); const commute = number(answers.commute); const maxCommute = number(answers.maxCommute);
    const monthly = rent !== undefined && fees !== undefined ? rent + fees : undefined;
    const commuteFits = commute !== undefined && maxCommute !== undefined && commute <= maxCommute;
    const verified = answers.verified === "yes";
    const next = !verified ? `先核验“${answers.priority || "不可妥协项"}”` : !commuteFits ? "先走一次真实通勤路线，再决定是否交换时间" : "固定成本与生活边界已可比较，可以继续核对合同";
    return {
      kind: article.kind, state: verified && commuteFits ? "可进入合同核对" : "仍有一项需要现场核验", selectedPath: next,
      title: verified && commuteFits ? "这套房已形成可比较的入住基线" : "先补完关键核验，再决定是否继续",
      summary: "这不是房屋质量评分，只把你的成本、通勤上限与生活边界放在同一张卡里。",
      artifactTitle: "入住成本与风险核验卡",
      artifactLines: [
        { label: "每月固定支出", value: monthly === undefined ? "待补充" : `${monthly} 元` },
        { label: "通勤对照", value: commute === undefined || maxCommute === undefined ? "待补充" : `${commute} 分钟 / 上限 ${maxCommute} 分钟` },
        { label: "不可妥协项", value: answers.priority || "待选择" },
        { label: "下一步", value: next },
      ],
      rules: [
        { label: "固定成本已合并", status: monthly !== undefined ? "met" : "gap", reason: monthly === undefined ? "房租或固定费用仍缺失。" : `房租与固定费用合计 ${monthly} 元/月。`, anchor: "rent" },
        { label: "通勤低于个人上限", status: commuteFits ? "met" : "gap", reason: commute === undefined || maxCommute === undefined ? "还没有形成通勤对照。" : commuteFits ? `实际 ${commute} 分钟，没有超过 ${maxCommute} 分钟上限。` : `实际 ${commute} 分钟，超过 ${maxCommute} 分钟上限。`, anchor: "commute" },
        { label: "优先项已核验", status: verified ? "met" : "gap", reason: verified ? `“${answers.priority}”已有现场、路线或书面依据。` : `“${answers.priority || "优先项"}”仍靠印象或口头说明。`, anchor: "verify" },
      ],
    };
  }

  if (article.kind === "meeting") {
    const path = answers.symptom === "decision" ? "决策规则断点" : answers.symptom === "owner" ? "行动交接断点" : "议题边界断点";
    const repair = answers.repair || (answers.symptom === "decision" ? "补一条本次如何收束的决策规则" : answers.symptom === "owner" ? "补负责人、可见产出和回看时间" : "把本次要回答的问题缩成一句话");
    return {
      kind: article.kind, state: `${path}已定位`, selectedPath: repair, title: `这次会议先修复“${path}”`,
      summary: "结果只定位流程断点，不把会议问题归结为任何人的能力或态度。", artifactTitle: "会议卡点诊断路径",
      artifactLines: [{ label: "这次会议", value: answers.meeting || "待补充" }, { label: "观察事实", value: answers.evidence || "待补充" }, { label: "当前断点", value: path }, { label: "下次修复", value: repair }],
      rules: [
        { label: "先定位最前断点", status: answers.symptom ? "met" : "gap", reason: answers.symptom ? `本次落在“${path}”。` : "还没有选择结束时缺少了什么。", anchor: "symptom" },
        { label: "使用可观察事实", status: text(answers.evidence) ? "met" : "gap", reason: text(answers.evidence) ? `依据是“${answers.evidence}”。` : "还缺一条别人也能核对的会议事实。", anchor: "evidence" },
        { label: "修复对应卡点", status: text(repair) ? "met" : "gap", reason: repair, anchor: "repair" },
      ],
    };
  }

  if (article.kind === "feedback") {
    const phrase = answers.phrase || "再有点感觉";
    const entry = answers.approach === "reference" ? "先确认参照" : answers.approach === "boundary" ? "先确认本轮边界" : "先确认反馈对象";
    const script = answers.approach === "reference"
      ? `关于“${phrase}”，我先确认一下：您更接近“${answers.reference || "哪个具体参照"}”中的哪一点？我会先据此调整“${answers.object || "当前对象"}”。`
      : answers.approach === "boundary"
        ? `关于“${phrase}”，这轮我先把“${answers.object || "当前对象"}”改到“${answers.boundary || "约定范围"}”，确认方向后再展开，可以吗？`
        : `关于“${phrase}”，我先确认一下，您主要指“${answers.object || "哪一个部分"}”，而不是其他部分，对吗？`;
    return {
      kind: article.kind, state: "反馈已变成可回答的问题", selectedPath: entry, title: "你的追问稿已经可以直接使用",
      summary: "这段话不会替对方回答，只把模糊反馈缩成一个更容易确认的问题。", artifactTitle: "本轮反馈追问稿",
      artifactLines: [{ label: "收到的反馈", value: phrase }, { label: "修改对象", value: answers.object || "待补充" }, { label: "追问入口", value: entry }, { label: "可以这样问", value: script }],
      rules: [
        { label: "对象已定位", status: text(answers.object) ? "met" : "gap", reason: text(answers.object) ? `先聚焦“${answers.object}”。` : "还没有说明反馈主要指向哪一部分。", anchor: "object" },
        { label: "参照已留下", status: text(answers.reference) ? "met" : "note", reason: text(answers.reference) ? `可比较参照是“${answers.reference}”。` : "本轮可先问清参照，再开始修改。", anchor: "reference" },
        { label: "修改边界已留下", status: text(answers.boundary) ? "met" : "note", reason: text(answers.boundary) ? `本轮交付边界是“${answers.boundary}”。` : "确认对象后，再补本轮交付边界。", anchor: "boundary" },
      ],
    };
  }

  const risk = answers.reversibility === "hard" ? "难以撤回" : answers.reversibility === "mixed" ? "一项较难撤回" : "两项都较易撤回";
  const choice = answers.trial === "b" ? answers.optionB : answers.optionA;
  const next = answers.reversibility === "easy" ? `先小范围运行“${choice || "所选方案"}”，在${answers.deadline || "约定时间"}回看` : `先用“${choice || "所选方案"}”验证：${answers.unknown || "最关键未知信息"}；在${answers.deadline || "约定时间"}回看`;
  return {
    kind: article.kind, state: answers.reversibility === "easy" ? "可以低承诺开始" : "先验证再提高承诺", selectedPath: next,
    title: answers.reversibility === "easy" ? "不用一次做成永久决定" : "先回答最会改变选择的未知信息",
    summary: "这张图记录当前证据与撤回成本；新信息出现后，结果可以重新运行。", artifactTitle: "可逆性决策边界图",
    artifactLines: [{ label: "方案 A", value: answers.optionA || "待补充" }, { label: "方案 B", value: answers.optionB || "待补充" }, { label: "撤回成本", value: risk }, { label: "回看时间", value: answers.deadline || "待补充" }, { label: "下一步", value: next }],
    rules: [
      { label: "方案已写成动作", status: text(answers.optionA) && text(answers.optionB) ? "met" : "gap", reason: "两个方案都需要写成下一步会发生的具体动作。", anchor: "options" },
      { label: "可逆性已判断", status: answers.reversibility ? "met" : "gap", reason: risk, anchor: "reversible" },
      { label: "关键未知已收窄", status: text(answers.unknown) ? "met" : "gap", reason: text(answers.unknown) ? `本轮只验证“${answers.unknown}”。` : "还没有选出会真正改变决定的一条信息。", anchor: "unknown" },
      { label: "最小试验已选择", status: answers.trial ? "met" : "gap", reason: next, anchor: "trial" },
      { label: "试验有结束时间", status: text(answers.deadline) ? "met" : "gap", reason: text(answers.deadline) ? `将在“${answers.deadline}”回看。` : "还没有写下结束试验的时间。", anchor: "deadline" },
    ],
  };
}
