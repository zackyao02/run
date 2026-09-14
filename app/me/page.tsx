import Link from "next/link";
import { LocalHistory } from "@/src/components/local-history";

export default function MyPage() {
  return <main className="shell"><header className="topbar"><Link className="brand" href="/">用<span>一下</span></Link><div className="nav-note">我的运行记录</div></header><div className="container"><div className="eyebrow">LOCAL HISTORY</div><h1>你的运行，<br />可以继续。</h1><p className="lede">无需登录即可运行；运行、完成和收藏次数会在服务端汇总，换设备访问同一部署也能看到累计结果。本页的填写草稿仍保存在当前浏览器。</p><LocalHistory /></div></main>;
}
