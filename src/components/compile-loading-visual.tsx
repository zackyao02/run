const frames = ["文章原文", "规则路径", "运行界面"];

export function CompileLoadingVisual({ step }: { step: number }) {
  return <figure className={`compile-storyboard step-${step}`} aria-label="知识正在被编译为可运行程序">
    <div className="compile-storyboard-image">
      <img src="/compile/knowledge-to-program-storyboard.png" alt="文章内容被拆解为规则节点，再组装成可运行界面的示意图" />
      <span className="compile-storyboard-scan" aria-hidden="true" />
      {frames.map((label, index) => <span className={`compile-storyboard-frame frame-${index + 1} ${index <= step ? "active" : ""}`} key={label} aria-hidden="true" />)}
    </div>
    <figcaption>{frames.map((label, index) => <span className={index === step ? "active" : index < step ? "done" : ""} key={label}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</figcaption>
  </figure>;
}
