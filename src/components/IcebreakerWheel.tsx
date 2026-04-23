import { useState, useRef, useCallback, useEffect } from "react";

const COLORS = [
  "#FF6B6B","#FF922B","#FAB005","#51CF66",
  "#339AF0","#845EF7","#F783AC","#20C997",
  "#FF8787","#FFA94D","#74C0FC","#94D82D",
];

const DEFAULT_QUESTIONS = [
  "What's your hidden talent? 🎭",
  "Best trip you've ever taken? 🌍",
  "Go-to comfort food? 🍕",
  "Share a fun fact about yourself 🤔",
  "What superpower would you pick? ✨",
  "Most embarrassing moment? 😅",
  "Dream job if money didn't matter? 💭",
  "Something on your bucket list? 🪣",
];

interface Piece {
  x: number;
  y: number;
  r: number;
  color: string;
  speed: number;
  angle: number;
  spin: number;
  drift: number;
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: Piece[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 360,
      spin: Math.random() * 6 - 3,
      drift: Math.random() * 2 - 1,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 200);
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.4);
        ctx.restore();
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
      });
      frame++;
      if (frame < 220) rafRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200 }}
    />
  );
}

export default function IcebreakerWheel() {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [winnerColor, setWinnerColor] = useState("#FF6B6B");
  const [isTick, setIsTick] = useState(false);
  const totalRotationRef = useRef(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = useCallback(() => {
    if (spinning || questions.length < 2) return;
    setSpinning(true);
    setSelected(null);

    const seg = 360 / questions.length;
    const randomIdx = Math.floor(Math.random() * questions.length);
    const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360;
    const targetOffset = extraSpins + (360 - (randomIdx * seg + seg / 2));
    totalRotationRef.current += targetOffset;

    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 5s cubic-bezier(0.12, 0, 0.05, 1)";
      wheelRef.current.style.transform = `rotate(${totalRotationRef.current}deg)`;
    }

    // Tick Synchronization Logic
    let rafId: number;
    let lastAngle = 0;
    const startTime = Date.now();
    
    const checkTick = () => {
      const currentTime = Date.now();
      if (!wheelRef.current) return;
      
      const style = window.getComputedStyle(wheelRef.current);
      const matrix = new (window.DOMMatrix || window.WebKitCSSMatrix)(style.transform);
      const angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
      const normalizedAngle = (angle + 360) % 360;
      
      if (Math.floor(normalizedAngle / seg) !== Math.floor(lastAngle / seg)) {
        setIsTick(true);
        setTimeout(() => setIsTick(false), 50);
      }
      lastAngle = normalizedAngle;

      if (currentTime - startTime < 5100) {
        rafId = requestAnimationFrame(checkTick);
      }
    };
    
    rafId = requestAnimationFrame(checkTick);

    setTimeout(() => {
      cancelAnimationFrame(rafId);
      setSpinning(false);
      const q = questions[randomIdx];
      const color = COLORS[randomIdx % COLORS.length];
      setSelected(q);
      setWinnerColor(color);
      setHistory(prev => [q, ...prev.slice(0, 9)]);
      setShowModal(true);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }, 5100);
  }, [spinning, questions]);

  const drawWheel = () => {
    const n = questions.length;
    if (n === 0) return null;
    const cx = 200, cy = 200, r = 182;
    const angleStep = (2 * Math.PI) / n;
    return questions.map((q, i) => {
      const start = i * angleStep - Math.PI / 2;
      const end = start + angleStep;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const large = angleStep > Math.PI ? 1 : 0;
      const mid = start + angleStep / 2;
      const tr = r * 0.62;
      const tx = cx + tr * Math.cos(mid);
      const ty = cy + tr * Math.sin(mid);
      const deg = (mid * 180) / Math.PI;
      const label = q.length > 20 ? q.slice(0, 18) + "…" : q;
      const fontSize = n > 10 ? 8 : n > 7 ? 9.5 : 11;
      return (
        <g key={i}>
          <path
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
            fill={COLORS[i % COLORS.length]}
            stroke="white"
            strokeWidth="2.5"
          />
          <text
            x={tx} y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="'DM Sans', sans-serif"
            transform={`rotate(${deg + 90},${tx},${ty})`}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {label}
          </text>
        </g>
      );
    });
  };

  const addQuestion = () => {
    const t = newQ.trim();
    if (!t) return;
    if (questions.some(q => q.toLowerCase() === t.toLowerCase())) {
      setNewQ("");
      return;
    }
    setQuestions(p => [...p, t]);
    setNewQ("");
  };

  const removeQ = (idx: number) => {
    if (questions.length <= 2) return;
    setQuestions(p => p.filter((_, i) => i !== idx));
  };

  const closeModal = () => setShowModal(false);

  return (
    <>
      <Confetti active={confetti} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap');
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .app-wheel-container {
          min-height: 100%;
          background: #ffffff;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 16px 56px;
          overflow-y: auto;
          width: 100%;
        }

        .badge-wheel {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f4f4f4;
          border-radius: 50px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #888;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .header-wheel { text-align: center; margin-bottom: 40px; }

        .header-wheel h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 6vw, 3.4rem);
          font-weight: 900;
          color: #111;
          letter-spacing: -1px;
          line-height: 1.08;
        }

        .header-wheel p {
          color: #999;
          font-size: 1rem;
          margin-top: 8px;
          font-weight: 500;
        }

        .main-wheel {
          display: flex;
          gap: 48px;
          align-items: flex-start;
          width: 100%;
          max-width: 980px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Wheel */
        .wheel-col { display: flex; flex-direction: column; align-items: center; gap: 24px; }

        .wheel-wrap {
          position: relative;
          width: clamp(280px, 50vw, 380px);
          height: clamp(280px, 50vw, 380px);
        }

        .pointer-wheel {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 40px solid #111;
          z-index: 10;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
          transform-origin: 50% 0%;
        }

        @keyframes tick-animation {
          0% { transform: translateX(-50%) rotate(0deg); }
          50% { transform: translateX(-50%) rotate(-15deg); }
          100% { transform: translateX(-50%) rotate(0deg); }
        }
        
        .pointer-tick { animation: tick-animation 0.1s ease-out; }

        .wheel-rotator {
          width: 100%; height: 100%;
          transform-origin: center center;
          will-change: transform;
        }

        .wheel-svg {
          width: 100%; height: 100%;
          filter: drop-shadow(0 24px 56px rgba(0,0,0,0.12));
        }

        .spin-btn-wheel {
          padding: 15px 52px;
          background: #111;
          color: white;
          border: none;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          letter-spacing: 0.3px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }

        .spin-btn-wheel:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        }

        .spin-btn-wheel:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Sidebar */
        .sidebar-wheel {
          flex: 1;
          min-width: 280px;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .card-wheel {
          background: #f7f7f7;
          border-radius: 22px;
          padding: 22px 20px;
        }

        .card-title-wheel {
          font-family: 'Playfair Display', serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 14px;
        }

        .add-row-wheel {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .add-input-wheel {
          flex: 1;
          padding: 10px 14px;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          background: white;
          color: #111;
          transition: border-color 0.2s;
        }

        .add-input-wheel:focus { border-color: #111; }
        .add-input-wheel::placeholder { color: #bbb; }

        .add-btn-wheel {
          width: 42px; height: 42px;
          background: #111;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.4rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
          font-weight: 300;
          line-height: 1;
        }

        .add-btn-wheel:hover { background: #333; }

        .q-list-wheel {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .q-list-wheel::-webkit-scrollbar { width: 3px; }
        .q-list-wheel::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

        .q-item-wheel {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 0.85rem;
          color: #333;
          font-weight: 500;
        }

        .q-dot-wheel {
          width: 9px; height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .q-text-wheel {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .q-del-wheel {
          background: none;
          border: none;
          cursor: pointer;
          color: #ccc;
          font-size: 0.85rem;
          padding: 2px 4px;
          line-height: 1;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
        }

        .q-del-wheel:hover { color: #ff4444; background: #fff0f0; }

        .count-pill-wheel {
          display: inline-flex;
          align-items: center;
          background: #111;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          border-radius: 20px;
          padding: 2px 8px;
          margin-left: 8px;
          vertical-align: middle;
        }

        .history-list-wheel {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 150px;
          overflow-y: auto;
        }

        .history-item-wheel {
          font-size: 0.82rem;
          color: #666;
          padding: 7px 10px;
          background: white;
          border-radius: 8px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-item-wheel:first-child {
          background: #f0fdf4;
          color: #166534;
        }

        .empty-wheel {
          text-align: center;
          color: #bbb;
          font-size: 0.85rem;
          padding: 16px;
        }

        /* Modal */
        .overlay-wheel {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 150;
          padding: 20px;
          animation: fadeInWheel 0.3s ease;
        }

        @keyframes fadeInWheel { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popUpWheel {
          from { opacity: 0; transform: scale(0.75) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-wheel {
          background: white;
          border-radius: 30px;
          padding: 44px 36px 36px;
          max-width: 460px;
          width: 100%;
          text-align: center;
          animation: popUpWheel 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 40px 100px rgba(0,0,0,0.2);
        }

        .modal-sash-wheel {
          display: inline-block;
          padding: 5px 18px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 800;
          color: white;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .modal-q-wheel {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.35rem, 5vw, 1.9rem);
          font-weight: 900;
          color: #111;
          line-height: 1.3;
          margin-bottom: 32px;
        }

        .modal-close-wheel {
          padding: 14px 44px;
          background: #111;
          color: white;
          border: none;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          letter-spacing: 0.2px;
        }

        .modal-close-wheel:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.2);
        }

        @media (max-width: 600px) {
          .app-wheel-container { padding: 20px 12px 48px; }
          .header-wheel { margin-bottom: 28px; }
          .wheel-wrap { width: 280px; height: 280px; }
          .modal-wheel { padding: 32px 24px 28px; }
          .main-wheel { gap: 32px; }
        }
      `}</style>

      <div className="app-wheel-container no-scrollbar">
        <div className="header-wheel">
          <div className="badge-wheel">🎡 Icebreaker</div>
          <h1>Spin the Wheel</h1>
          <p>Random questions for meetings, parties & team hangouts</p>
        </div>

        <div className="main-wheel">
          {/* Wheel Column */}
          <div className="wheel-col">
            <div className="wheel-wrap">
              <div className={`pointer-wheel ${isTick ? 'pointer-tick' : ''}`} />
              <div className="wheel-rotator" ref={wheelRef}>
                <svg className="wheel-svg" viewBox="0 0 400 400">
                  <circle cx="200" cy="200" r="186" fill="#ececec" />
                  {drawWheel()}
                  {/* Outer ring */}
                  <circle cx="200" cy="200" r="185" fill="none" stroke="white" strokeWidth="3" />
                  {/* Center hub */}
                  <circle cx="200" cy="200" r="28" fill="white" stroke="#111" strokeWidth="4" />
                  <circle cx="200" cy="200" r="8" fill="#111" />
                </svg>
              </div>
            </div>
            <button
              className="spin-btn-wheel"
              onClick={spin}
              disabled={spinning || questions.length < 2}
            >
              {spinning ? "Spinning…" : "🎲  Spin the Wheel"}
            </button>
          </div>

          {/* Sidebar */}
          <div className="sidebar-wheel">
            {/* Question Manager */}
            <div className="card-wheel">
              <div className="card-title-wheel">
                Questions
                <span className="count-pill-wheel">{questions.length}</span>
              </div>
              <div className="add-row-wheel">
                <input
                  className="add-input-wheel"
                  placeholder="Type a question…"
                  value={newQ}
                  onChange={e => setNewQ(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addQuestion()}
                  maxLength={80}
                />
                <button className="add-btn-wheel" onClick={addQuestion}>+</button>
              </div>
              <div className="q-list-wheel no-scrollbar">
                {questions.length === 0 && <div className="empty-wheel">Add questions above!</div>}
                {questions.map((q, i) => (
                  <div className="q-item-wheel" key={i}>
                    <div className="q-dot-wheel" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="q-text-wheel" title={q}>{q}</span>
                    <button className="q-del-wheel" onClick={() => removeQ(i)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="card-wheel">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="card-title-wheel mb-0">Recent Picks</div>
                  <button 
                    onClick={() => setHistory([])}
                    className="text-[9px] font-bold uppercase text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="history-list-wheel no-scrollbar">
                  {history.map((h, i) => (
                    <div className="history-item-wheel" key={i}>
                      {i === 0 ? "✦ " : `${i + 1}. `}{h}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showModal && selected && (
        <div className="overlay-wheel" onClick={closeModal}>
          <div className="modal-wheel" onClick={e => e.stopPropagation()}>
            <div className="modal-sash-wheel" style={{ background: winnerColor }}>
              🎉 &nbsp;Your Question
            </div>
            <div className="modal-q-wheel">{selected}</div>
            <button className="modal-close-wheel" onClick={closeModal}>
              Got it! Spin again →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
