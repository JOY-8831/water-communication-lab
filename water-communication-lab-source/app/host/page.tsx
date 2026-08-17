"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CHOICES, FULL_CONTEXT, GROUPS, PHASE_LABELS, PHASES, type GroupCode, type Phase } from "../../lib/experiment";

type Vote = {
  id: number;
  groupCode: GroupCode;
  round: number;
  choice: string;
  confidence: number;
};

export default function HostPage() {
  const [sessionCode, setSessionCode] = useState("");
  const [hostToken, setHostToken] = useState("");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrigin(window.location.origin);
      const saved = window.localStorage.getItem("water-lab-host");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessionCode(parsed.code || "");
          setHostToken(parsed.token || "");
        } catch { window.localStorage.removeItem("water-lab-host"); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sessionCode || !hostToken) return;
    let active = true;
    const poll = async () => {
      try {
        const [sessionResponse, voteResponse] = await Promise.all([
          fetch(`/api/sessions?code=${sessionCode}`, { cache: "no-store" }),
          fetch(`/api/votes?session=${sessionCode}&token=${hostToken}`, { cache: "no-store" }),
        ]);
        const sessionData = await sessionResponse.json();
        const voteData = await voteResponse.json();
        if (!sessionResponse.ok || !voteResponse.ok) throw new Error(sessionData.error || voteData.error || "無法讀取場次");
        if (active) {
          setPhase(sessionData.phase as Phase);
          setVotes(voteData.votes || []);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "連線失敗");
      }
    };
    poll();
    const timer = window.setInterval(poll, 1500);
    return () => { active = false; window.clearInterval(timer); };
  }, [sessionCode, hostToken]);

  useEffect(() => {
    if (phase === "welcome") return;
    const startKey = `water-lab-start-${sessionCode}`;
    const endKey = `water-lab-end-${sessionCode}`;
    const stored = Number(window.localStorage.getItem(startKey)) || Date.now();
    window.localStorage.setItem(startKey, String(stored));
    let ended = Number(window.localStorage.getItem(endKey)) || 0;
    if (phase === "results" && !ended) {
      ended = Date.now();
      window.localStorage.setItem(endKey, String(ended));
    }
    const update = () => setElapsed(Math.floor(((ended || Date.now()) - stored) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [phase, sessionCode]);

  async function createSession() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "無法建立場次");
      setSessionCode(data.code);
      setHostToken(data.hostToken);
      setPhase("welcome");
      window.localStorage.setItem("water-lab-host", JSON.stringify({ code: data.code, token: data.hostToken }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally { setBusy(false); }
  }

  async function changePhase(next: Phase) {
    setBusy(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sessionCode, hostToken, phase: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "更新失敗");
      setPhase(next);
    } catch (err) { setError(err instanceof Error ? err.message : "更新失敗"); }
    finally { setBusy(false); }
  }

  async function resetSession() {
    if (!window.confirm("確定清除這一場的所有匿名作答，重新開始嗎？")) return;
    const response = await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: sessionCode, hostToken, reset: true }),
    });
    if (response.ok) {
      setVotes([]);
      setPhase("welcome");
      window.localStorage.removeItem(`water-lab-start-${sessionCode}`);
      window.localStorage.removeItem(`water-lab-end-${sessionCode}`);
      setElapsed(0);
    }
  }

  const roundOne = votes.filter((vote) => vote.round === 1);
  const roundTwo = votes.filter((vote) => vote.round === 2);
  const phaseIndex = PHASES.indexOf(phase);
  const timeLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  if (!sessionCode) {
    return (
      <main className="host-start">
        <div className="host-start-inner">
          <p className="kicker">主持模式</p>
          <h1>建立一場<br />三分鐘的資訊決策實驗</h1>
          <p>系統會產生四組不同的 QR Code，匿名收集兩次決策及信心分數。</p>
          <button className="primary-link button-reset" type="button" onClick={createSession} disabled={busy}>{busy ? "建立中…" : "建立新場次 →"}</button>
          {error && <p className="error-note">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="host-shell">
      <header className="host-header">
        <div><span className="brand-mark">水視界</span><b>場次 {sessionCode}</b></div>
        <div className="host-status"><span>{PHASE_LABELS[phase]}</span><strong>{timeLabel}</strong><em>{roundOne.length} 人已加入決策</em></div>
      </header>

      <section className="host-stage">
        {phase === "welcome" && (
          <div className="host-welcome">
            <div className="stage-copy">
              <p className="kicker">請依座位區域掃描</p>
              <h1>四組觀眾，<br />四個資訊入口。</h1>
              <p>掃描後請不要交換畫面。每組將收到同一事件的不同資訊切片。</p>
            </div>
            <div className="qr-grid">
              {(Object.keys(GROUPS) as GroupCode[]).map((code) => {
                const group = GROUPS[code];
                const link = `${origin}/participant?session=${sessionCode}&group=${code}`;
                return (
                  <article key={code} style={{ "--group-accent": group.accent } as React.CSSProperties}>
                    <QRCodeCanvas value={link} size={148} marginSize={2} />
                    <div><b>{code}組</b><span>{group.label.split("｜")[1]}</span></div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {phase === "round1" && (
          <div className="decision-stage">
            <p className="kicker">第一次決策</p>
            <h1>如果只能先發布一則通知，<br />你會選擇哪一種？</h1>
            <div className="live-count"><strong>{roundOne.length}</strong><span>份匿名作答</span></div>
            <p className="stage-hint">請只根據手機上目前看見的資訊作答。</p>
          </div>
        )}

        {phase === "reveal" && (
          <div className="reveal-stage">
            <div className="stage-copy compact"><p className="kicker">資訊揭露</p><h1>同一場雨，<br />四種合理判斷。</h1></div>
            <div className="reveal-grid">
              {(Object.entries(GROUPS) as [GroupCode, typeof GROUPS[GroupCode]][]).map(([code, group]) => {
                const groupVotes = roundOne.filter((vote) => vote.groupCode === code);
                const average = groupVotes.length ? groupVotes.reduce((sum, vote) => sum + vote.confidence, 0) / groupVotes.length : 0;
                return (
                  <article key={code} style={{ "--group-accent": group.accent } as React.CSSProperties}>
                    <b>{code}</b><span>{group.source}</span><h2>{group.headline}</h2><p>{group.detail}</p>
                    <div className="group-result">
                      <small>{groupVotes.length} 份｜信心 {average.toFixed(1)}</small>
                      <div>{CHOICES.map((choice, index) => <em key={choice.id}>{String.fromCharCode(65 + index)} {groupVotes.filter((vote) => vote.choice === choice.id).length}</em>)}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {phase === "context" && (
          <div className="context-stage">
            <div className="stage-copy"><p className="kicker">補上完整脈絡</p><h1>資訊更完整，<br />不確定性才看得見。</h1><p>問題不是誰被騙，而是單一資訊都不足以支撐完整決策。</p></div>
            <ol>{FULL_CONTEXT.map((item, index) => <li key={item}><b>0{index + 1}</b><span>{item}</span></li>)}</ol>
          </div>
        )}

        {phase === "round2" && (
          <div className="decision-stage">
            <p className="kicker">再次決策</p>
            <h1>看見來源、時間與限制後，<br />你的選擇會改變嗎？</h1>
            <div className="live-count"><strong>{roundTwo.length}</strong><span>份第二次作答</span></div>
            <p className="stage-hint">請回到手機重新選擇，並再次評估自己的信心。</p>
          </div>
        )}

        {phase === "results" && <Results votes={votes} />}
      </section>

      <nav className="host-controls" aria-label="主持控制">
        <button type="button" disabled={busy || phaseIndex === 0} onClick={() => changePhase(PHASES[phaseIndex - 1])}>← 上一步</button>
        <div>{PHASES.map((item, index) => <i key={item} className={index <= phaseIndex ? "done" : ""} />)}</div>
        <button className="next" type="button" disabled={busy || phaseIndex === PHASES.length - 1} onClick={() => changePhase(PHASES[phaseIndex + 1])}>下一步 →</button>
        <button className="reset" type="button" onClick={resetSession}>重新開始</button>
      </nav>
      {error && <p className="floating-error">{error}</p>}
    </main>
  );
}

function Results({ votes }: { votes: Vote[] }) {
  const summary = useMemo(() => [1, 2].map((round) => {
    const rows = votes.filter((vote) => vote.round === round);
    const average = rows.length ? rows.reduce((sum, vote) => sum + vote.confidence, 0) / rows.length : 0;
    return {
      round,
      total: rows.length,
      average,
      counts: Object.fromEntries(CHOICES.map((choice) => [choice.id, rows.filter((vote) => vote.choice === choice.id).length])),
    };
  }), [votes]);
  const maxTotal = Math.max(...summary.map((item) => item.total), 1);

  return (
    <div className="results-stage">
      <div className="results-copy">
        <p className="kicker">前後比較</p>
        <h1>資訊沒有替人決定，<br />但改變了決策條件。</h1>
        <div className="confidence-comparison">
          <span>平均信心</span>
          <b>{summary[0].average.toFixed(1)} <i>→</i> {summary[1].average.toFixed(1)}</b>
        </div>
        <div className="mini-framework"><span>感受與經驗</span><i>→</i><span>數據連結與風險認識</span><i>→</i><span>賦權與共同面對</span></div>
      </div>
      <div className="result-chart">
        {CHOICES.map((choice, index) => (
          <article key={choice.id}>
            <div className="choice-name"><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></div>
            <div className="bars">
              <div><span style={{ width: `${(summary[0].counts[choice.id] / maxTotal) * 100}%` }} /><em>第一次 {summary[0].counts[choice.id]}</em></div>
              <div><span style={{ width: `${(summary[1].counts[choice.id] / maxTotal) * 100}%` }} /><em>第二次 {summary[1].counts[choice.id]}</em></div>
            </div>
          </article>
        ))}
        <p>共 {summary[0].total} 份第一次作答、{summary[1].total} 份第二次作答</p>
      </div>
    </div>
  );
}
