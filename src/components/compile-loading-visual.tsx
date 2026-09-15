const frames = ["读取原文", "生成规则", "组装程序"];

export function CompileLoadingVisual({ step }: { step: number }) {
  return <figure className={`compile-motion step-${step}`} aria-label="知识正在被编译为可运行程序">
    <div className="compile-motion-stage" aria-hidden="true">
      <div className="compile-motion-article"><b /><i /><i /><i /><i /></div>
      <div className="compile-motion-stream"><i /><i /><i /><i /><i /></div>
      <div className="compile-motion-rules"><i /><i /><i /><span /><span /></div>
      <div className="compile-motion-app"><b /><i /><i /><span /><span /><em /></div>
    </div>
    <figcaption>{frames.map((label, index) => <span className={index === step ? "active" : index < step ? "done" : ""} key={label}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</figcaption>
  </figure>;
}
