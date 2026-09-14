# Judge Q&A Battlecard

## Q1：这不就是 AI 把文章变成 Checklist？

> Checklist 只是可能的一个组件。Run 先判断内容是否值得执行，再识别能力、规划状态与分支、生成受限 Schema，并要求每个关键行动 Source-bound。更关键的是，它形成一个稳定 Run Version，多个用户重复运行，而不是输出一次文本。

## Q2：以前也有人做“知乎内容→行动”。

> 是，所以我们不把“内容到行动”当创新。Action Agent 是在内容后结合用户情境生成一次性的下一步；Run 是把知识对象本身编译成稳定的 Executable Version。一个是 Action Agent，一个是 Knowledge Compiler。

## Q3：Claude/Gemini 也能生成 App。

> 通用 App Builder 是 Prompt→新 App。Run 是 Existing Source→Grounded Executable Version，而且 Usage 归属原知识对象。

## Q4：为什么必须是知乎？

> Run 的价值来自知乎已经沉淀的真人经验知识，以及 Source/作者/赞同等社区上下文。离开知识对象，只剩一个普通 App Generator。

## Q5：Completed 能证明知识有效？

> 不能。Completed 只代表这份知识定义的执行流程被完整跑完。赞同、使用、完成是三种不同信号。

## Q6：为什么 Runtime 不直接实时用 AI，更聪明？

> 因为我们要创造的是一个稳定、可重复运行的知识版本。实时重新生成会把产品退化成一次性 Agent，也会破坏 Source Grounding 和 Usage 可比性。

## Q7：Compiler 不就是抽 JSON？

> 如果只是抽 JSON，Generic LLM Baseline 应该和我们一样。我们的评测会比较 Grounding、幻觉行动、状态、分支、Completion 和 Repeatability。

## Q8：为什么不是每篇内容都生成？

> 因为 Interaction Advantage 是硬门禁。AI 很重要的一项能力，是知道什么时候不应该生成。
