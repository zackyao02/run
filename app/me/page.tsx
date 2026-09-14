import Link from "next/link";
import { LocalHistory } from "@/src/components/local-history";

export default function MyPage() {
  return <main className="shell"><header className="topbar"><Link className="brand" href="/">用<span>一下</span></Link><div className="nav-note">我的运行记录</div></header><div className="container"><div className="eyebrow">RUN HISTORY</div><h1>你的运行，<br />可以继续。</h1><p className="lede">官方 Run 需要先完成知乎登录；运行次数和完成次数在服务端汇总。已配置生产数据库时，登录后的记录可跨设备恢复；未配置时仅保留当前实例与浏览器中的记录。</p><LocalHistory /></div></main>;
}
