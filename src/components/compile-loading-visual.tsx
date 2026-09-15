const frames = ["校验知识来源", "装载规则路径", "启动知识程序"];

export function CompileLoadingVisual({ step }: { step: number }) {
  return <figure className={`compile-motion step-${step}`} aria-label="已编译知识程序正在准备运行">
    <div className="compile-motion-stage" aria-hidden="true">
      <div className="compile-motion-article"><b /><i /><i /><i /><i /></div>
      <div className="compile-motion-stream"><i /><i /><i /><i /><i /></div>
      <div className="compile-motion-rules"><i /><i /><i /><span /><span /></div>
      <div className="compile-motion-app"><b /><i /><i /><span /><span /><em /></div>
    </div>
    <figcaption>{frames.map((label, index) => <span className={index === step ? "active" : index < step ? "done" : ""} key={label}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</figcaption>
  </figure>;
}
