import Link from "next/link";
import { LocalHistory } from "@/src/components/local-history";

export default function MyPage() {
  return <main className="shell"><header className="topbar"><Link className="brand" href="/">用<span>一下</span></Link><div className="nav-note">我的运行记录</div></header><div className="container"><div className="eyebrow">RUN HISTORY</div><h1>你的运行，<br />可以继续。</h1><p className="lede">正式 Run 会关联到当前知乎账号；服务器数据库可用时，换设备登录后仍能继续。赛事模拟知识只保存在当前浏览器。</p><LocalHistory /></div></main>;
}
