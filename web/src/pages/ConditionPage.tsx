import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AccordionSection, { AccordionSubsection } from "../components/AccordionSection";
import Layout from "../components/Layout";
import SubConditionTable from "../components/SubConditionTable";
import { ConditionData, ConditionIndex, DiagnosisType, Space } from "../types";
import { loadSpaces } from "../spaces";

const DIAGNOSIS_TYPE_META: Record<DiagnosisType, {
  label: string;
  color: string;
  title: string;
  body: string;
  tip: string;
}> = {
  syndromic: {
    label: "Syndrome",
    color: "#fef3c7",
    title: "Syndrome",
    body: "A syndrome is a recognised pattern of symptoms grouped under one label. It describes what tends to happen, not why — people with the same syndrome label often have different underlying causes.",
    tip: "Syndromes are starting points, not final answers. The more useful question is usually: what is driving this pattern in a specific person?",
  },
  pathophysiological: {
    label: "Dysfunction",
    color: "#e0e7ff",
    title: "Dysfunction",
    body: "A dysfunction diagnosis identifies something measurably broken in a biological process — an enzyme deficiency, a microbial imbalance, an immune overreaction. The mechanism is named even if the root cause behind it is not yet clear.",
    tip: "Dysfunctions are more specific than syndromes and often have direct treatment options. They may also be downstream of something else worth investigating.",
  },
  aetiological: {
    label: "Root cause",
    color: "#d1fae5",
    title: "Root cause",
    body: "An aetiological diagnosis identifies the actual cause — not just what is broken, but why. These tend to be more actionable because addressing the cause can resolve the downstream effects it was producing.",
    tip: "Root causes are the most specific level of diagnosis. Treating them tends to produce more durable results than managing symptoms or downstream dysfunctions alone.",
  },
  constitutional: {
    label: "Predisposition",
    color: "#f3f4f6",
    title: "Predisposition",
    body: "A constitutional condition is part of someone's biological makeup — it shapes the terrain on which other conditions are more likely to develop. It is not a direct cause of symptoms but helps explain susceptibility.",
    tip: "Constitutional conditions are rarely modifiable themselves, but knowing about one helps predict which related conditions are more likely and why.",
  },
  masquerader: {
    label: "Masquerader",
    color: "#fee2e2",
    title: "Masquerader",
    body: "A masquerader produces symptoms that closely resemble gut syndromes like IBS but is a distinct condition with different biology and treatment. It does not cause IBS — it mimics it.",
    tip: "Masqueraders are worth ruling out early, before investigating syndrome-specific drivers — the two require different approaches.",
  },
};

function DiagnosisTypeLabel({ diagnosisType }: { diagnosisType: DiagnosisType }) {
  const [open, setOpen] = useState(false);
  const meta = DIAGNOSIS_TYPE_META[diagnosisType];
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.15rem 0.5rem",
          borderRadius: "0.25rem",
          background: meta.color,
          border: `1px solid ${meta.color === "#f3f4f6" ? "#d1d5db" : "transparent"}`,
          color: "#374151",
          cursor: "help",
          letterSpacing: "0.02em",
          outline: "none",
          userSelect: "none",
        }}
      >
        {meta.label}
      </span>
      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            left: 0,
            zIndex: 20,
            width: 340,
            maxWidth: "min(340px, 90vw)",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            padding: "0.85rem 1rem",
            color: "#374151",
            fontSize: "0.82rem",
            lineHeight: 1.55,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            whiteSpace: "normal",
            fontWeight: 400,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.8rem" }}>{meta.title}</div>
          <p style={{ margin: "0 0 0.5rem", color: "#4b5563" }}>{meta.body}</p>
          <p style={{ margin: 0, background: "#f9fafb", borderLeft: "3px solid #6b7280", padding: "0.35rem 0.5rem", borderRadius: "0 0.25rem 0.25rem 0", color: "#374151", fontSize: "0.78rem" }}>
            {meta.tip}
          </p>
        </div>
      )}
    </span>
  );
}

function AiLabel() {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.15rem 0.5rem",
          borderRadius: "0.25rem",
          background: "#f3f4f6",
          border: "1px solid #d1d5db",
          color: "#6b7280",
          cursor: "help",
          letterSpacing: "0.02em",
          outline: "none",
          userSelect: "none",
        }}
      >
        AI-generated
      </span>
      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            right: 0,
            zIndex: 20,
            width: 280,
            maxWidth: "min(280px, 90vw)",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "0.5rem",
            padding: "0.75rem 0.9rem",
            color: "#374151",
            fontSize: "0.8rem",
            fontWeight: 400,
            lineHeight: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            whiteSpace: "normal",
          }}
        >
          This content was generated by AI and has not been reviewed by a medical professional. Use it as a starting point for your own research — not as a diagnosis or treatment plan.
        </div>
      )}
    </span>
  );
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "object") return Object.values(val as object).every(isEmpty);
  return false;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: color, marginLeft: "0.4rem", verticalAlign: "middle" }}>
      {label}
    </span>
  );
}

export default function ConditionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<ConditionData | null>(null);
  const [meta, setMeta] = useState<ConditionIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indexMap, setIndexMap] = useState<Map<string, ConditionIndex>>(new Map());
  const [backSpace, setBackSpace] = useState<Space | null>(null);

  useEffect(() => {
    const lastId = (() => {
      try { return localStorage.getItem("cn_last_space") ?? "main"; } catch { return "main"; }
    })();
    loadSpaces().then((spaces) => {
      setBackSpace(spaces.find((s) => s.id === lastId) ?? spaces.find((s) => s.id === "main") ?? null);
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    fetch("/generated/index.json")
      .then((r) => r.json())
      .then((list: ConditionIndex[]) => {
        const map = new Map(list.map((c) => [c.id, c]));
        setIndexMap(map);
        const entry = map.get(id!);
        if (!entry) { setError(`Unknown condition: ${id}`); return; }
        setMeta(entry);
        if (!entry.has_data) return;
        const path = `/generated/${entry.id}.json`;
        return fetch(path).then((r) => r.json()).then(setData);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const s = data?.sections;

  const subConditionRows = useMemo(() => {
    if (!meta || meta.diagnosis_type !== "syndromic" || !meta.sub_conditions?.length || indexMap.size === 0) {
      return [] as ConditionIndex[];
    }
    return meta.sub_conditions
      .map((sc) => indexMap.get(sc.id))
      .filter((c): c is ConditionIndex => !!c);
  }, [meta, indexMap]);

  const subConditionProbability = useMemo(() => {
    const map: Record<string, number> = {};
    if (meta?.sub_conditions) {
      for (const sc of meta.sub_conditions) map[sc.id] = sc.probability;
    }
    return map;
  }, [meta]);

  return (
    <Layout>
    <div style={{ maxWidth: 680, margin: "1rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {location.key !== "default" ? (
          <button
            onClick={() => { window.scrollTo(0, 0); navigate(-1); }}
            style={{ fontSize: "0.875rem", color: "#6b7280", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            ← Back
          </button>
        ) : (
          <Link
            to={backSpace && backSpace.id !== "main" ? `/space/${backSpace.id}` : "/"}
            style={{ fontSize: "0.875rem", color: "#6b7280", textDecoration: "none" }}
          >
            ← {backSpace?.label ?? "All conditions"}
          </Link>
        )}
        <AiLabel />
      </div>

      {error && <p style={{ color: "#dc2626", marginTop: "1rem" }}>{error}</p>}

      {meta && (
        <div style={{ margin: "1rem 0 1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {meta.full_name || meta.name}
            {!meta.full_name && meta.aliases.length > 0 && (
              <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 400, marginLeft: "0.5rem" }}>
                ({meta.aliases.join(", ")})
              </span>
            )}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>{meta.group_label}</p>
            {meta.diagnosis_type && <DiagnosisTypeLabel diagnosisType={meta.diagnosis_type} />}
          </div>

          {!meta.has_data && (
            <p style={{ color: "#6b7280" }}>Data for this condition has not been generated yet. Run <code>cn generate --id {meta.id}</code>.</p>
          )}

          {s && <p style={{ lineHeight: 1.6, color: "#374151" }}>{s.plain_summary}</p>}
        </div>
      )}

      {meta?.diagnosis_type === "syndromic" && subConditionRows.length > 0 && (
        <div style={{ margin: "0 0 2rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#374151", margin: "0 0 0.5rem" }}>
            Investigate which underlying conditions fit you
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 1rem" }}>
            {meta.name} is a syndrome label — these are the conditions worth ruling in or out, best-effort sorted by how often each shows up in {meta.name} patients. Filters can help prioritise but might be imprecise.
          </p>
          <SubConditionTable
            rows={subConditionRows}
            probabilityById={subConditionProbability}
            symptomPatterns={s?.symptom_patterns?.patterns}
            subConditionAffinities={s?.symptom_patterns?.sub_condition_affinities}
            signalsByConditionId={s?.sub_condition_signals}
          />
        </div>
      )}

      {s && (
        <div>
          <AccordionSection title="What is it? (detailed)" isEmpty={isEmpty(s.detailed_summary)}>
            <ReactMarkdown>{s.detailed_summary}</ReactMarkdown>
          </AccordionSection>

          <AccordionSection title="How common is it?" isEmpty={isEmpty(s.prevalence)}>
            <p><strong>{s.prevalence?.estimate}</strong> — {s.prevalence?.summary}</p>
            {s.prevalence?.notes && <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" }}>{s.prevalence.notes}</p>}
          </AccordionSection>

          <AccordionSection title="Known subtypes" isEmpty={isEmpty(s.subgroups)}>
            {(s.subgroups ?? []).map((sg) => (
              <div key={sg.name} style={{ marginBottom: "1rem" }}>
                <strong>{sg.name}</strong>
                <p style={{ margin: "0.25rem 0", color: "#4b5563" }}>{sg.description}</p>
                <ul style={{ margin: "0.25rem 0 0 1rem", color: "#6b7280", fontSize: "0.875rem" }}>
                  {(sg.distinguishing_features ?? []).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            ))}
          </AccordionSection>

          <AccordionSection title="Symptoms" isEmpty={isEmpty(s.symptoms)}>
            {Object.entries(
              (s.symptoms ?? []).reduce<Record<string, NonNullable<typeof s.symptoms>>>((acc, sym) => {
                (acc[sym.category] ??= []).push(sym);
                return acc;
              }, {})
            ).map(([cat, syms]) => (
              <div key={cat} style={{ marginBottom: "0.75rem" }}>
                <p style={{ fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#9ca3af", margin: "0 0 0.25rem" }}>{cat}</p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                  {syms.map((sym, i) => (
                    <li key={i}>{sym.symptom}{sym.notes && <span style={{ color: "#9ca3af", fontSize: "0.85em" }}> — {sym.notes}</span>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </AccordionSection>

          <AccordionSection title="How to test for it" isEmpty={isEmpty(s.testing)}>
            <AccordionSubsection title="Patterns to look for" isEmpty={isEmpty(s.testing?.key_patterns)}>
              <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                {(s.testing?.key_patterns ?? []).map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </AccordionSubsection>

            <AccordionSubsection title="At home" isEmpty={isEmpty(s.testing?.at_home)}>
              {(s.testing?.at_home ?? []).map((t, i) => (
                <div key={i} style={{ marginBottom: "0.75rem" }}>
                  <strong>{t.name}</strong>
                  <p style={{ margin: "0.1rem 0", color: "#4b5563" }}>{t.description}</p>
                  {t.safety_notes && <p style={{ color: "#92400e", fontSize: "0.8rem", background: "#fef3c7", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>⚠ {t.safety_notes}</p>}
                </div>
              ))}
            </AccordionSubsection>

            <AccordionSubsection title="Clinical tests" isEmpty={isEmpty(s.testing?.clinical)}>
              {(s.testing?.clinical ?? []).map((t, i) => (
                <div key={i} style={{ marginBottom: "0.75rem" }}>
                  <strong>{t.name}</strong>
                  {t.type === "gold_standard" && <Badge label="gold standard" color="#d1fae5" />}
                  {t.type === "emerging" && <Badge label="emerging" color="#e0e7ff" />}
                  <p style={{ margin: "0.1rem 0", color: "#4b5563" }}>{t.description}</p>
                  <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>{t.availability}</p>
                </div>
              ))}
            </AccordionSubsection>
          </AccordionSection>

          <AccordionSection title="Related conditions" isEmpty={isEmpty(s.related_conditions)}>
            {(s.related_conditions ?? []).map((rc, i) => {
              const byId = rc.id ? indexMap.get(rc.id) : undefined;
              const byName = byId
                ? undefined
                : indexMap.get(
                    [...indexMap.keys()].find((k) => indexMap.get(k)?.name.toLowerCase() === rc.name.toLowerCase()) ?? ""
                  );
              const linked = byId ?? byName;
              return (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  {linked ? (
                    <Link to={`/condition/${linked.id}`} style={{ fontWeight: 600, color: "#2563eb" }}>{rc.name}</Link>
                  ) : (
                    <strong>{rc.name}</strong>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.4rem" }}>{rc.relationship.replace("_", " ")}</span>
                  <p style={{ margin: "0.1rem 0", color: "#4b5563", fontSize: "0.9rem" }}>{rc.explanation}</p>
                </div>
              );
            })}
          </AccordionSection>

          <AccordionSection title="How to manage symptoms" isEmpty={isEmpty(s.symptom_management)}>
            {!isEmpty(s.symptom_management?.strategies) && (
              <>
                {(s.symptom_management?.strategies ?? []).map((st, i) => (
                  <div key={i} style={{ marginBottom: "0.75rem" }}>
                    <strong>{st.name}</strong>
                    <span style={{ fontSize: "0.7rem", color: "#6b7280", marginLeft: "0.4rem" }}>{st.category}</span>
                    {st.evidence_level === "strong" && <Badge label="strong evidence" color="#d1fae5" />}
                    {st.evidence_level === "anecdotal" && <Badge label="anecdotal" color="#f3f4f6" />}
                    <p style={{ margin: "0.1rem 0", color: "#4b5563" }}>{st.description}</p>
                    {st.notes && <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{st.notes}</p>}
                  </div>
                ))}
              </>
            )}
            {!isEmpty(s.symptom_management?.things_to_avoid) && (
              <>
                <p style={{ fontWeight: 600, margin: "0.75rem 0 0.25rem" }}>Things to avoid</p>
                <ul style={{ paddingLeft: "1.25rem" }}>
                  {(s.symptom_management?.things_to_avoid ?? []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </>
            )}
          </AccordionSection>

          <AccordionSection title="Uncomfortable truths" isEmpty={isEmpty(s.uncomfortable_truths)}>
            {(s.uncomfortable_truths ?? []).map((ut, i) => (
              <div key={i} style={{ marginBottom: "1.25rem" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{ut.truth}</p>
                {ut.why_resisted && (
                  <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>{ut.why_resisted}</p>
                )}
                {ut.path_forward && (
                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      padding: "0.5rem 0.75rem",
                      background: "#ecfdf5",
                      borderLeft: "3px solid #10b981",
                      borderRadius: "0.25rem",
                      color: "#065f46",
                      fontSize: "0.9rem",
                    }}
                  >
                    {ut.path_forward}
                  </p>
                )}
              </div>
            ))}
          </AccordionSection>

          <AccordionSection title="How to truly improve" isEmpty={isEmpty(s.sustainable_improvement)}>
            {!isEmpty(s.sustainable_improvement?.key_levers) && (s.sustainable_improvement?.key_levers ?? []).map((lv, i) => (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <strong>{lv.lever}</strong>
                {lv.requires_professional && <Badge label="needs professional" color="#fee2e2" />}
                <p style={{ margin: "0.1rem 0", color: "#4b5563" }}>{lv.why_it_matters}</p>
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Start: {lv.how_to_start}</p>
                {lv.timeline && <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Timeline: {lv.timeline}</p>}
              </div>
            ))}
            {!isEmpty(s.sustainable_improvement?.common_mistakes) && (
              <>
                <p style={{ fontWeight: 600, margin: "0.75rem 0 0.25rem" }}>Common mistakes</p>
                <ul style={{ paddingLeft: "1.25rem" }}>
                  {(s.sustainable_improvement?.common_mistakes ?? []).map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </>
            )}
          </AccordionSection>

          <AccordionSection title="Find help" isEmpty={isEmpty(s.finding_help)}>
            <AccordionSubsection
              title="Patient communities"
              isEmpty={isEmpty(s.finding_help?.patient_communities)}
              defaultOpen
            >
              {(s.finding_help?.patient_communities ?? []).map((c, i) => (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "#2563eb" }}>{c.name}</a>
                  ) : (
                    <strong>{c.name}</strong>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.4rem" }}>{c.platform}</span>
                  <p style={{ margin: "0.1rem 0", color: "#6b7280", fontSize: "0.875rem" }}>{c.notes}</p>
                </div>
              ))}
            </AccordionSubsection>

            <AccordionSubsection title="Specialists" isEmpty={isEmpty(s.finding_help?.specialists)}>
              {(s.finding_help?.specialists ?? []).map((sp, i) => (
                <div key={i} style={{ marginBottom: "0.5rem" }}>
                  <strong>{sp.type}</strong>
                  <p style={{ margin: "0.1rem 0", color: "#4b5563", fontSize: "0.9rem" }}>{sp.role}</p>
                  {sp.notes && <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{sp.notes}</p>}
                </div>
              ))}
            </AccordionSubsection>
          </AccordionSection>

          <AccordionSection title="Learn more" isEmpty={isEmpty(s.learning_resources)}>
            {(s.learning_resources ?? []).map((r, i) => (
              <div key={i} style={{ marginBottom: "0.75rem" }}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "#2563eb" }}>{r.title}</a>
                ) : (
                  <strong>{r.title}</strong>
                )}
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.4rem" }}>{r.type}</span>
                {r.author_or_source && <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.4rem" }}>— {r.author_or_source}</span>}
                <Badge
                  label={r.audience}
                  color={r.audience === "beginner" ? "#d1fae5" : r.audience === "advanced" ? "#fee2e2" : "#e0e7ff"}
                />
                <p style={{ margin: "0.25rem 0", color: "#4b5563", fontSize: "0.875rem" }}>{r.description}</p>
              </div>
            ))}
          </AccordionSection>
        </div>
      )}
    </div>
    </Layout>
  );
}
