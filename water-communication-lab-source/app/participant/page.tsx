"use client";

import { useEffect, useMemo, useState } from "react";
import { CHOICES, FULL_CONTEXT, GROUPS, type GroupCode, type Phase } from "../../lib/experiment";

type Answer = { choice: string; confidence: number; submitted: boolean };

export default function ParticipantPage() {
  const [sessionCode, setSessionCode] = useState("");
  const [groupCode, setGroupCode] = useState<GroupCode | null>(null);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [voterId, setVoterId] = useState("");
  const [roundOne, setRoundOne] = useState<Answer>({ choice: "", confidence: 3, submitted: false });
  const [roundTwo, setRoundTwo] = useState<Answer>({ choice: "", confidence: 3, submitted: false });
  const [message, setMessage] = useState("正在加入場次…");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const code = (params.get("session") || "").toUpperCase();
      const group = (params.get("group") || "").toUpperCase() as GroupCode;
      let id = window.localStorage.getItem("water-lab-voter-id");
      if (!id) {
        id = globalThis.crypto?.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem("water-lab-voter-id", id);
      }
      setVoterId(id);
      setSessionCode(code);
      setGroupCode(group in GROUPS ? group : null);
      if (!code || !(group in GROUPS)) setMessage("連結不完整，請重新掃描主持人提供的 QR Code。");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sessionCode || !groupCode) return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/sessions?code=${encodeURIComponent(sessionCode)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "找不到場次");
        if (active) {
          setPhase(data.phase as Phase);
          setMessage("");
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "連線失敗");
      }
    };
    poll();
    const timer = window.setInterval(poll, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, [sessionCode, groupCode]);

  const group = useMemo(() => groupCode ? GROUPS[groupCode] : null, [groupCode]);

  async function submit(round: 1 | 2) {
    const answer = round === 1 ? roundOne : roundTwo;
    if (!answer.choice || !groupCode) return;
    const response = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCode, voterId, groupCode, round, choice: answer.choice, confidence: answer.confidence }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "送出失敗，請再試一次");
      return;
    }
    const setter = round === 1 ? setRoundOne : setRoundTwo;
    setter({ ...answer, submitted: true });
  }

  if (message) return <main className="mobile-shell center-state"><div className="pulse-dot" /><h1>{message}</h1></main>;
  if (!group) return null;

  return (
    <main className="mobile-shell" style={{ "--group-accent": group.accent } as React.CSSProperties}>
      <header className="mobile-header"><span>水視界</span><b>場次 {sessionCode}</b></header>

      {phase === "welcome" && (
        <section className="waiting-card">
          <p className="group-chip">{group.label}</p>
          <div className="weather-symbol"><i /><i /><i /></div>
          <h1>你已進入實驗</h1>
          <p>請不要交換手機畫面。每個人看到的資訊可能不同。</p>
          <small>等待主持人開始</small>
        </section>
      )}

      {phase === "round1" && (
        <>
          <section className="info-card">
            <p className="group-chip">{group.label}</p>
            <span className="source-line">{group.source}</span>
            <h1>{group.headline}</h1>
            <p>{group.detail}</p>
            <small>模擬情境｜請只根據目前資訊判斷</small>
          </section>
          <Decision round={1} answer={roundOne} setAnswer={setRoundOne} onSubmit={() => submit(1)} />
        </>
      )}

      {phase === "reveal" && (
        <section className="reveal-mobile">
          <p className="step-label">資訊揭露</p>
          <h1>我們面對同一場雨，<br />卻看見四種現實。</h1>
          <div className="headline-stack">
            {(Object.entries(GROUPS) as [GroupCode, typeof GROUPS[GroupCode]][]).map(([code, item]) => (
              <article key={code}><b style={{ background: item.accent }}>{code}</b><span>{item.headline}</span></article>
            ))}
          </div>
          <p className="quiet-note">每一則都包含真實資訊，也都有無法單獨回答的問題。</p>
        </section>
      )}

      {phase === "context" && (
        <section className="context-mobile">
          <p className="step-label">補上完整脈絡</p>
          <h1>更多資訊，不是推翻前面；而是讓限制變得可見。</h1>
          <ol>{FULL_CONTEXT.map((item, index) => <li key={item}><b>0{index + 1}</b><span>{item}</span></li>)}</ol>
          <p className="quiet-note">下一步，請重新做一次決定。</p>
        </section>
      )}

      {phase === "round2" && <Decision round={2} answer={roundTwo} setAnswer={setRoundTwo} onSubmit={() => submit(2)} />}

      {phase === "results" && (
        <section className="framework-mobile">
          <p className="step-label">公共溝通框架</p>
          <h1>讓資訊從「被發布」，走到「能行動」。</h1>
          <div className="framework-flow">
            <article><b>01</b><span>感受與經驗</span></article>
            <i>→</i>
            <article><b>02</b><span>數據連結與風險認識</span></article>
            <i>→</i>
            <article><b>03</b><span>賦權與共同面對</span></article>
          </div>
          <p className="closing-quote">公共溝通不是要求所有人相信同一個答案，而是讓人理解資訊從哪裡來、限制在哪裡，以及現在能做什麼。</p>
        </section>
      )}
    </main>
  );
}

function Decision({ round, answer, setAnswer, onSubmit }: {
  round: 1 | 2;
  answer: Answer;
  setAnswer: (answer: Answer) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="decision-panel">
      <p className="step-label">第 {round} 次決策</p>
      <h2>如果只能先發布一則通知，你會選擇哪一種？</h2>
      <div className="choice-list">
        {CHOICES.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={answer.choice === item.id ? "choice selected" : "choice"}
            onClick={() => setAnswer({ ...answer, choice: item.id, submitted: false })}
          >
            <span>{String.fromCharCode(65 + index)}</span>{item.label}
          </button>
        ))}
      </div>
      <div className="confidence-row">
        <span>你有多確定？</span>
        <div>{[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            key={value}
            className={answer.confidence === value ? "confidence active" : "confidence"}
            onClick={() => setAnswer({ ...answer, confidence: value, submitted: false })}
            aria-label={`信心 ${value} 分`}
          >{value}</button>
        ))}</div>
      </div>
      <button type="button" className="submit-button" disabled={!answer.choice} onClick={onSubmit}>
        {answer.submitted ? "已送出，可修改" : "匿名送出"}
      </button>
    </section>
  );
}
