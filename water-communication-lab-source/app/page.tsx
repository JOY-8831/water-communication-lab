import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <nav className="topline">
        <span className="brand-mark">水視界</span>
        <span className="eyebrow">PUBLIC COMMUNICATION LAB</span>
      </nav>

      <section className="hero-grid">
        <div>
          <p className="kicker">一場三分鐘的公共溝通實驗</p>
          <h1>同一場雨，<br />為什麼我們做出不同決定？</h1>
          <p className="hero-copy">
            讓四組觀眾閱讀不同但不完整的資訊，匿名決策，再看見資訊來源、限制與行動如何改變判斷。
          </p>
          <Link className="primary-link" href="/host">建立一場實驗 <span>→</span></Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="rain-line r1" />
          <div className="rain-line r2" />
          <div className="rain-line r3" />
          <div className="water-ripple ripple-one" />
          <div className="water-ripple ripple-two" />
          <p>資料不是答案<br /><span>它是決策的起點</span></p>
        </div>
      </section>

      <section className="three-steps" aria-label="實驗流程">
        <article><b>01</b><h2>看見切片</h2><p>每組只收到事件的一部分。</p></article>
        <article><b>02</b><h2>做出決定</h2><p>沒有完美選項，只有不同風險。</p></article>
        <article><b>03</b><h2>重新判斷</h2><p>補齊脈絡，再看選擇如何改變。</p></article>
      </section>

      <footer>模擬情境，不代表任何真實災情｜水視界引路人</footer>
    </main>
  );
}
