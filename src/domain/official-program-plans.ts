import type { ProgramModel, ProgramPrimitive } from "@/src/domain/types";

/**
 * Editorial routing for the fixed hackathon knowledge pool.  These are
 * product plans, not generated content: the compiler still has to validate
 * every action and source anchor before a draft can be previewed or published.
 */
export type ProgramFamily = "path" | "lab" | "sandbox";
export type PlanDecision = "priority" | "reserve" | "hold";

export interface OfficialProgramPlan {
  workId: string;
  family: ProgramFamily;
  model?: ProgramModel;
  capability?: "inspect" | "mission" | "diagnose" | "practice";
  primitives?: ProgramPrimitive[];
  decision: PlanDecision;
  experience: string;
  goal: string;
  reason: string;
}

export const programFamilyLabel: Record<ProgramFamily, string> = {
  path: "路径模拟",
  lab: "微型实验",
  sandbox: "规则沙盘",
};

export const decisionLabel: Record<PlanDecision, string> = {
  priority: "优先制作",
  reserve: "备用候选",
  hold: "暂不制作",
};

export const officialProgramPlans: OfficialProgramPlan[] = [
  { workId: "1307332455322529792", family: "path", model: "dialogue_rehearsal", capability: "mission", primitives: ["observable_state", "source_backed_branch", "material_artifact"], decision: "priority", experience: "加薪谈判模拟", goal: "带入一场真实加薪谈话，把客观标准、事实证据与谈话收口编排成准备卡。", reason: "前 3000 字明确支持“询问客观标准—举出事实证据—未完全达标时条件交换”的谈话分支；适合作为片段范围内的对话型 Supporting Run。" },
  { workId: "1446441987969183744", family: "sandbox", model: "parameter_sandbox", capability: "inspect", primitives: ["observable_state", "deterministic_evaluation"], decision: "reserve", experience: "职业资源取舍沙盘", goal: "在短期稳定、能力积累与长期方向之间查看当前取舍，不对用户下职业结论。", reason: "以文章已出现的稀缺、技能与选择主题制作有限取舍沙盘；仅表达用户选择的记录，不把概念段落变成陷阱清单。" },
  { workId: "1547987528036315136", family: "lab", model: "micro_lab", capability: "practice", primitives: ["repeatable_experiment", "feedback_loop"], decision: "reserve", experience: "主动行动微实验", goal: "选择一个低风险主动动作，完成一次尝试并记录是否发生。", reason: "使用文章关于事件、评价与行动反应的片段，做低风险行为练习；不做心理评估或诊断。" },
  { workId: "1509654546602856448", family: "lab", model: "micro_lab", capability: "practice", primitives: ["observable_state", "repeatable_experiment", "feedback_loop", "material_artifact"], decision: "priority", experience: "专注力微型实验", goal: "带入一件当前小事，完成一次呼吸或短时专注采样，留下方法与真实中断反馈。", reason: "片段明确支持正念呼吸的走神察觉，以及番茄工作法的专注与休息节奏；适合范围披露的双路径实验型 Supporting Run。" },
  { workId: "1443597377995702272", family: "lab", model: "micro_lab", capability: "practice", primitives: ["repeatable_experiment", "feedback_loop"], decision: "reserve", experience: "学习启动实验", goal: "以最小启动动作开始一轮学习，并记录阻力与完成状态。", reason: "有学习节奏与任务安排的具体建议，但与专注实验相近，作为备用内容。" },
  { workId: "1528398892400353280", family: "path", model: "scenario_simulator", capability: "mission", primitives: ["observable_state", "source_backed_branch"], decision: "reserve", experience: "边界情境排练", goal: "在有限请求情境中选择回应，观察边界与负担状态如何变化。", reason: "适合低风险、有限场景的选择路径；发布前需人工确认不会推断关系或心理结论。" },
  { workId: "1697254818945699840", family: "path", model: "diagnosis", capability: "diagnose", primitives: ["observable_state", "source_backed_branch"], decision: "reserve", experience: "工作状态观察路径", goal: "依据文章列举的工作体验选择观察路径，得到需要继续了解的原文节点，不做医疗或心理诊断。", reason: "只回放文章明确提到的工作体验与应对方向；结果保留“观察记录”，不判定任何健康状态。" },
  { workId: "1251918148732559360", family: "sandbox", model: "rule_tester", capability: "inspect", primitives: ["observable_state", "deterministic_evaluation", "material_artifact"], decision: "priority", experience: "职业积累地图", goal: "带入一条真实职业方向，依次检查行业经验、职责积累与可迁移成果，生成职业积累地图。", reason: "唯一官方完整正文；包含行业金字塔、职位金字塔与长期连续积累原则，适合制作输入三类事实、逐条迁移状态的 Full Source Hero。" },
  { workId: "1393937473601368064", family: "sandbox", model: "rule_tester", capability: "inspect", primitives: ["observable_state", "deterministic_evaluation", "material_artifact"], decision: "priority", experience: "目标结构测试", goal: "带入一个真实目标，依次运行片段明确覆盖的聚焦、具体与期限三条规则，生成目标修正卡。", reason: "官方前 3000 字完整覆盖聚焦、具体与期限三条可观察规则；只编译覆盖范围内的目标结构，不把未返回部分补成第四条规则。" },
  { workId: "1523701957479239680", family: "path", model: "gated_path", capability: "mission", primitives: ["feedback_loop", "material_artifact"], decision: "reserve", experience: "任务闭合路径", goal: "选择一个未完成事项，明确闭合或终止条件，生成本次闭合记录。", reason: "有任务开启、清理、总结与闭合的明确动作链；适合作为第五篇备用 Run。" },
];

export function getOfficialProgramPlan(workId: string) { return officialProgramPlans.find((plan) => plan.workId === workId); }
