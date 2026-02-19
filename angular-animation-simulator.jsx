import { useState, useRef, useEffect } from "react";

const EASINGS = [
  { label: "ease", value: "ease" },
  { label: "ease-in", value: "ease-in" },
  { label: "ease-out", value: "ease-out" },
  { label: "ease-in-out", value: "ease-in-out" },
  { label: "linear", value: "linear" },
  { label: "cubic-bezier(.4,0,.2,1)", value: "cubic-bezier(.4,0,.2,1)" },
  { label: "cubic-bezier(.6,.04,.98,.34)", value: "cubic-bezier(.6,.04,.98,.34)" },
  { label: "cubic-bezier(.08,.82,.17,1)", value: "cubic-bezier(.08,.82,.17,1)" },
];

const PRESETS = [
  { name: "Fade In", from: { opacity: 0, x: 0, y: 0, scale: 1, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 300, delay: 0, easing: "ease-in" },
  { name: "Fade Out", from: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, to: { opacity: 0, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 300, delay: 0, easing: "ease-out" },
  { name: "Slide Left", from: { opacity: 0, x: -100, y: 0, scale: 1, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 400, delay: 0, easing: "ease-out" },
  { name: "Slide Right", from: { opacity: 0, x: 100, y: 0, scale: 1, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 400, delay: 0, easing: "ease-out" },
  { name: "Slide Up", from: { opacity: 0, x: 0, y: 40, scale: 1, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 400, delay: 0, easing: "ease-out" },
  { name: "Slide Down", from: { opacity: 0, x: 0, y: -40, scale: 1, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 400, delay: 0, easing: "ease-out" },
  { name: "Scale In", from: { opacity: 0, x: 0, y: 0, scale: 0.5, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 350, delay: 0, easing: "cubic-bezier(.4,0,.2,1)" },
  { name: "Scale Out", from: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, to: { opacity: 0, x: 0, y: 0, scale: 1.2, rotate: 0 }, duration: 250, delay: 0, easing: "ease-in" },
  { name: "Rotate In", from: { opacity: 0, x: 0, y: 0, scale: 0.8, rotate: -15 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 500, delay: 0, easing: "cubic-bezier(.08,.82,.17,1)" },
  { name: "Bounce In", from: { opacity: 0, x: 0, y: 0, scale: 0.3, rotate: 0 }, to: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }, duration: 600, delay: 0, easing: "cubic-bezier(.08,.82,.17,1)" },
];

function buildTransform(s) {
  var parts = [];
  if (s.x !== 0 || s.y !== 0) parts.push("translate(" + s.x + "px, " + s.y + "px)");
  if (s.scale !== 1) parts.push("scale(" + s.scale + ")");
  if (s.rotate !== 0) parts.push("rotate(" + s.rotate + "deg)");
  return parts.length > 0 ? parts.join(" ") : "none";
}

function generateCode(cfg) {
  var fr = cfg.from, t = cfg.to, dur = cfg.duration, del = cfg.delay, eas = cfg.easing, name = cfg.triggerName, el = cfg.enterLeave;
  var delStr = del > 0 ? " " + del + "ms" : "";
  var timing = dur + "ms" + delStr + " " + eas;

  var fStyles = [], tStyles = [];
  if (fr.opacity !== t.opacity) {
    fStyles.push("      opacity: " + fr.opacity);
    tStyles.push("      opacity: " + t.opacity);
  }
  var fT = [], tT = [];
  if (fr.x !== t.x || fr.y !== t.y) { fT.push("translate(" + fr.x + "px, " + fr.y + "px)"); tT.push("translate(" + t.x + "px, " + t.y + "px)"); }
  if (fr.scale !== t.scale) { fT.push("scale(" + fr.scale + ")"); tT.push("scale(" + t.scale + ")"); }
  if (fr.rotate !== t.rotate) { fT.push("rotate(" + fr.rotate + "deg)"); tT.push("rotate(" + t.rotate + "deg)"); }
  if (fT.length > 0) { fStyles.push("      transform: " + fT.join(" ")); tStyles.push("      transform: " + tT.join(" ")); }

  var fs = fStyles.length > 0 ? fStyles.join(",\n") : "      /* no change */";
  var ts = tStyles.length > 0 ? tStyles.join(",\n") : "      /* no change */";

  if (el) {
    return "trigger('" + name + "', [\n  transition(':enter', [\n    style({\n" + fs + "\n    }),\n    animate('" + timing + "', style({\n" + ts + "\n    }))\n  ]),\n  transition(':leave', [\n    animate('" + timing + "', style({\n" + fs + "\n    }))\n  ])\n])";
  }
  return "trigger('" + name + "', [\n  state('hidden', style({\n" + fs + "\n  })),\n  state('visible', style({\n" + ts + "\n  })),\n  transition('hidden => visible', [\n    animate('" + timing + "')\n  ]),\n  transition('visible => hidden', [\n    animate('" + timing + "')\n  ])\n])";
}

function Slider(props) {
  var label = props.label, value = props.value, onChange = props.onChange, min = props.min, max = props.max;
  var step = props.step || 1;
  var unit = props.unit || "";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: "#e2e8f0", fontFamily: "monospace" }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={function(e) { onChange(Number(e.target.value)); }}
        style={{ width: "100%", accentColor: "#8b5cf6", height: 4, cursor: "pointer" }}
      />
    </div>
  );
}

export default function AngularAnimationSimulator() {
  var _from = useState({ opacity: 0, x: -60, y: 0, scale: 1, rotate: 0 });
  var from = _from[0], setFrom = _from[1];
  var _to = useState({ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 });
  var to = _to[0], setTo = _to[1];
  var _dur = useState(400); var duration = _dur[0], setDuration = _dur[1];
  var _del = useState(0); var delay = _del[0], setDelay = _del[1];
  var _eas = useState("ease-out"); var easing = _eas[0], setEasing = _eas[1];
  var _el = useState(true); var enterLeave = _el[0], setEnterLeave = _el[1];
  var _tn = useState("myAnimation"); var triggerName = _tn[0], setTriggerName = _tn[1];
  var _cp = useState(false); var copied = _cp[0], setCopied = _cp[1];
  var _ap = useState(null); var activePreset = _ap[0], setActivePreset = _ap[1];
  var _tab = useState("preview"); var tab = _tab[0], setTab = _tab[1];
  var _phase = useState("idle"); var animPhase = _phase[0], setAnimPhase = _phase[1];
  var _prog = useState(0); var progress = _prog[0], setProgress = _prog[1];

  var boxRef = useRef(null);
  var timerRef = useRef(null);
  var progRef = useRef(null);

  var code = generateCode({ triggerName: triggerName, from: from, to: to, duration: duration, delay: delay, easing: easing, enterLeave: enterLeave });

  // Animation state machine
  useEffect(function() {
    if (animPhase === "preparing") {
      // Force reflow at "from" position
      if (boxRef.current) { void boxRef.current.offsetWidth; }
      // Double rAF ensures browser paints "from" state before transition
      var id1 = requestAnimationFrame(function() {
        var id2 = requestAnimationFrame(function() {
          setAnimPhase("animating");
        });
        progRef.current = id2;
      });
      return function() {
        cancelAnimationFrame(id1);
        if (progRef.current) cancelAnimationFrame(progRef.current);
      };
    }
    if (animPhase === "animating") {
      // Progress bar animation
      var startTime = Date.now();
      var totalTime = duration + delay;
      var updateProgress = function() {
        var elapsed = Date.now() - startTime;
        var pct = Math.min(100, (elapsed / totalTime) * 100);
        setProgress(pct);
        if (pct < 100) {
          progRef.current = requestAnimationFrame(updateProgress);
        }
      };
      progRef.current = requestAnimationFrame(updateProgress);

      timerRef.current = setTimeout(function() {
        setAnimPhase("idle");
        setProgress(0);
      }, totalTime + 150);

      return function() {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progRef.current) cancelAnimationFrame(progRef.current);
      };
    }
  }, [animPhase, duration, delay]);

  function play() {
    if (animPhase !== "idle") return;
    setProgress(0);
    setAnimPhase("preparing");
  }

  function getBoxStyle() {
    if (animPhase === "preparing") {
      return { opacity: from.opacity, transform: buildTransform(from), transition: "none" };
    }
    if (animPhase === "animating") {
      return { opacity: to.opacity, transform: buildTransform(to), transition: "all " + duration + "ms " + easing + " " + delay + "ms" };
    }
    return { opacity: to.opacity, transform: buildTransform(to), transition: "none" };
  }

  function copyCode() {
    try {
      navigator.clipboard.writeText(code).then(function() {
        setCopied(true);
        setTimeout(function() { setCopied(false); }, 2000);
      });
    } catch (e) {
      // fallback
      setCopied(false);
    }
  }

  function applyPreset(p) {
    setFrom({ opacity: p.from.opacity, x: p.from.x, y: p.from.y, scale: p.from.scale, rotate: p.from.rotate });
    setTo({ opacity: p.to.opacity, x: p.to.x, y: p.to.y, scale: p.to.scale, rotate: p.to.rotate });
    setDuration(p.duration);
    setDelay(p.delay);
    setEasing(p.easing);
    setActivePreset(p.name);
  }

  function setF(key, val) {
    setFrom(function(prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n[key] = val; return n; });
    setActivePreset(null);
  }
  function setT(key, val) {
    setTo(function(prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n[key] = val; return n; });
    setActivePreset(null);
  }

  var isPlaying = animPhase !== "idle";
  var ghostTransform = buildTransform(from);

  // Merge box styles
  var baseBox = {
    width: 120, height: 68, borderRadius: 10,
    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
    boxShadow: "0 6px 24px rgba(139,92,246,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 600, fontSize: 12, position: "absolute",
  };
  var animStyle = getBoxStyle();
  var mergedBox = {};
  for (var k in baseBox) mergedBox[k] = baseBox[k];
  for (var k2 in animStyle) mergedBox[k2] = animStyle[k2];

  return (
    <div style={{ height: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "10px 18px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>A</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Angular Animation Simulator</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>Configure, preview & copy animation code</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left Panel */}
        <div style={{ width: 290, borderRight: "1px solid #1e293b", overflowY: "auto", padding: 12, flexShrink: 0 }}>

          {/* Trigger Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginBottom: 3 }}>Trigger Name</div>
            <input type="text" value={triggerName} onChange={function(e) { setTriggerName(e.target.value); }}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "5px 8px", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Presets */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginBottom: 5 }}>Presets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {PRESETS.map(function(p) {
                var active = activePreset === p.name;
                return (
                  <button key={p.name} onClick={function() { applyPreset(p); }}
                    style={{ background: active ? "#8b5cf6" : "#1e293b", border: "1px solid " + (active ? "#8b5cf6" : "#334155"), borderRadius: 4, padding: "2px 7px", fontSize: 9, color: active ? "#fff" : "#94a3b8", cursor: "pointer" }}>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode */}
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={enterLeave} onChange={function(e) { setEnterLeave(e.target.checked); }} style={{ accentColor: "#8b5cf6" }} />
            <span style={{ fontSize: 10, color: "#94a3b8" }}>:enter / :leave mode</span>
          </div>

          {/* Timing */}
          <div style={{ background: "#1e293b", borderRadius: 7, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#8b5cf6", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.7 }}>Timing</div>
            <Slider label="Duration" value={duration} onChange={setDuration} min={50} max={2000} step={50} unit="ms" />
            <Slider label="Delay" value={delay} onChange={setDelay} min={0} max={1000} step={50} unit="ms" />
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginBottom: 3 }}>Easing</div>
            <select value={easing} onChange={function(e) { setEasing(e.target.value); }}
              style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "4px 6px", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace", outline: "none", cursor: "pointer" }}>
              {EASINGS.map(function(e) { return <option key={e.value} value={e.value}>{e.label}</option>; })}
            </select>
          </div>

          {/* From */}
          <div style={{ background: "#1e293b", borderRadius: 7, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#f97316", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.7 }}>From State</div>
            <Slider label="Opacity" value={from.opacity} onChange={function(v) { setF("opacity", v); }} min={0} max={1} step={0.1} />
            <Slider label="X" value={from.x} onChange={function(v) { setF("x", v); }} min={-200} max={200} unit="px" />
            <Slider label="Y" value={from.y} onChange={function(v) { setF("y", v); }} min={-200} max={200} unit="px" />
            <Slider label="Scale" value={from.scale} onChange={function(v) { setF("scale", v); }} min={0} max={2} step={0.1} />
            <Slider label="Rotate" value={from.rotate} onChange={function(v) { setF("rotate", v); }} min={-360} max={360} step={5} unit="deg" />
          </div>

          {/* To */}
          <div style={{ background: "#1e293b", borderRadius: 7, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#22c55e", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.7 }}>To State</div>
            <Slider label="Opacity" value={to.opacity} onChange={function(v) { setT("opacity", v); }} min={0} max={1} step={0.1} />
            <Slider label="X" value={to.x} onChange={function(v) { setT("x", v); }} min={-200} max={200} unit="px" />
            <Slider label="Y" value={to.y} onChange={function(v) { setT("y", v); }} min={-200} max={200} unit="px" />
            <Slider label="Scale" value={to.scale} onChange={function(v) { setT("scale", v); }} min={0} max={2} step={0.1} />
            <Slider label="Rotate" value={to.rotate} onChange={function(v) { setT("rotate", v); }} min={-360} max={360} step={5} unit="deg" />
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
            <button onClick={function() { setTab("preview"); }}
              style={{ background: "none", border: "none", borderBottom: tab === "preview" ? "2px solid #8b5cf6" : "2px solid transparent", padding: "9px 16px", fontSize: 12, fontWeight: 500, color: tab === "preview" ? "#e2e8f0" : "#64748b", cursor: "pointer" }}>
              Preview
            </button>
            <button onClick={function() { setTab("code"); }}
              style={{ background: "none", border: "none", borderBottom: tab === "code" ? "2px solid #8b5cf6" : "2px solid transparent", padding: "9px 16px", fontSize: 12, fontWeight: 500, color: tab === "code" ? "#e2e8f0" : "#64748b", cursor: "pointer" }}>
              Angular Code
            </button>
          </div>

          {tab === "preview" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, position: "relative" }}>

              {/* Progress bar */}
              <div style={{ position: "absolute", top: 10, left: 20, right: 20, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 9, color: "#64748b", minWidth: 24 }}>0ms</span>
                <div style={{ flex: 1, height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", borderRadius: 2, width: progress + "%", transition: isPlaying ? "none" : "width 0.1s" }} />
                </div>
                <span style={{ fontSize: 9, color: "#64748b", minWidth: 32 }}>{duration + delay}ms</span>
              </div>

              {/* Preview */}
              <div style={{ position: "relative", width: 200, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Ghost */}
                <div style={{
                  position: "absolute", width: 120, height: 68, borderRadius: 10,
                  border: "1.5px dashed #334155", opacity: 0.25, transform: ghostTransform,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#475569"
                }}>from</div>

                {/* Animated box */}
                <div ref={boxRef} style={mergedBox}>Component</div>
              </div>

              {/* Play */}
              <button onClick={play} disabled={isPlaying}
                style={{
                  marginTop: 24, background: isPlaying ? "#334155" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  border: "none", borderRadius: 7, padding: "7px 22px", color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: isPlaying ? "not-allowed" : "pointer",
                  boxShadow: isPlaying ? "none" : "0 4px 12px rgba(139,92,246,0.3)"
                }}>
                {isPlaying ? "Playing..." : "\u25B6  Play Animation"}
              </button>

              {/* Info */}
              <div style={{ display: "flex", gap: 5, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <span style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "2px 8px", fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>{duration + "ms"}</span>
                {delay > 0 && <span style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "2px 8px", fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>{"delay " + delay + "ms"}</span>}
                <span style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "2px 8px", fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>{easing}</span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Code header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "#1e293b", borderBottom: "1px solid #334155", flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>@angular/animations</span>
                <button onClick={copyCode}
                  style={{ background: copied ? "#22c55e" : "#8b5cf6", border: "none", borderRadius: 4, padding: "4px 12px", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                  {copied ? "\u2713 Copied!" : "Copy Code"}
                </button>
              </div>

              {/* Import line */}
              <div style={{ padding: "7px 12px", background: "#0c1425", borderBottom: "1px solid #1e293b", fontSize: 10, color: "#64748b", fontFamily: "monospace", flexShrink: 0 }}>
                {"import { trigger, state, style, animate, transition } from '@angular/animations';"}
              </div>

              {/* Code */}
              <div style={{ flex: 1, overflow: "auto", padding: 12, background: "#0f172a" }}>
                <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.55, color: "#e2e8f0", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {code}
                </pre>
              </div>

              {/* Usage */}
              <div style={{ padding: 10, background: "#1e293b", borderTop: "1px solid #334155", flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3, fontWeight: 600 }}>Usage in component:</div>
                <pre style={{ margin: 0, fontSize: 9, color: "#94a3b8", fontFamily: "monospace", lineHeight: 1.4 }}>
                  {"@Component({\n  animations: [ /* paste trigger here */ ]\n})\n\n// In template:\n<div [@" + triggerName + "]" + (enterLeave ? "" : '="state"') + "> ... </div>"}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}