"use client";

import { useEffect, useRef, useState } from "react";

const fields = [
  { name: "Delivery_person_Age", label: "Delivery partner age", type: "number", min: 15, max: 50, step: 1, initial: "28" },
  { name: "Delivery_person_Ratings", label: "Partner rating", type: "number", min: 1, max: 5, step: 0.1, initial: "4.6" },
  { name: "distance_km", label: "Trip distance (km)", type: "number", min: 1.4, max: 21, step: 0.1, initial: "5.2" },
  { name: "order_hour", label: "Order hour", type: "number", min: 8, max: 23, step: 1, initial: "18" },
  { name: "Weather_conditions", label: "Weather", options: ["Cloudy", "Fog", "Sandstorms", "Stormy", "Sunny", "Windy"] },
  { name: "Road_traffic_density", label: "Traffic", options: ["Low", "Medium", "High", "Jam"] },
  { name: "Vehicle_condition", label: "Vehicle condition", options: ["0", "1", "2", "3"] },
  { name: "Type_of_order", label: "Order type", options: ["Buffet", "Drinks", "Meal", "Snack"] },
  { name: "Type_of_vehicle", label: "Vehicle type", options: ["bicycle", "electric_scooter", "motorcycle", "scooter"] },
  { name: "multiple_deliveries", label: "Other deliveries", options: ["0", "1", "2", "3"] },
  { name: "Festival", label: "Festival day", options: ["No", "Yes"] },
  { name: "City", label: "City type", options: ["Metropolitian", "Semi-Urban", "Urban"] },
];

const visualChoices = {
  Weather_conditions: [
    ["Cloudy", "☁", "Overcast skies"], ["Fog", "〰", "Low visibility"],
    ["Sandstorms", "🌫", "Dusty winds"], ["Stormy", "⛈", "Rain and wind"],
    ["Sunny", "☀", "Clear skies"], ["Windy", "≋", "Strong breeze"],
  ],
  Road_traffic_density: [["Low", "↗", "Moving freely"], ["Medium", "⇢", "Some slowdowns"], ["High", "⇄", "Busy roads"], ["Jam", "Ⅱ", "Stop and go"]],
  Type_of_vehicle: [["motorcycle", "🏍", "Motorcycle"], ["scooter", "🛵", "Scooter"], ["electric_scooter", "⚡", "E-scooter"], ["bicycle", "🚲", "Bicycle"]],
  Type_of_order: [["Meal", "🍱", "Meal"], ["Drinks", "🥤", "Drinks"], ["Snack", "🥡", "Snack"], ["Buffet", "🍽", "Buffet"]],
};

const optionLabels = {
  Vehicle_condition: {
    "0": "0 (lowest condition score)",
    "1": "1 (low condition score)",
    "2": "2 (high condition score)",
    "3": "3 (highest condition score)",
  },
  multiple_deliveries: {
    "0": "0 (no other deliveries)",
    "1": "1 (one other delivery)",
    "2": "2 (two other deliveries)",
    "3": "3 (three other deliveries)",
  },
};

const initialValues = Object.fromEntries(fields.map((field) => [field.name, field.initial ?? field.options[0]]));
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function CustomSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <div className={`custom-select ${open ? "is-open" : ""}`} ref={rootRef}>
      <button className="select-trigger" type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{optionLabels[label]?.[value] || value.replaceAll("_", " ")}</span><span className="select-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && <div className="select-menu" role="listbox" aria-label={label}>{options.map((option) => <button className={`select-option ${value === option ? "is-selected" : ""}`} type="button" role="option" aria-selected={value === option} key={option} onClick={() => { onChange(option); setOpen(false); }}><span>{optionLabels[label]?.[option] || option.replaceAll("_", " ")}</span>{value === option && <span className="option-check" aria-hidden="true">✓</span>}</button>)}</div>}
    </div>
  );
}

export default function Home() {
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const payload = { ...values };
    for (const field of fields) {
      if (field.type === "number" || ["Vehicle_condition", "multiple_deliveries"].includes(field.name)) {
        payload[field.name] = Number(payload[field.name]);
      }
    }

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((issue) => `${issue.loc?.slice(1).join(".") || "Input"}: ${issue.msg}`).join("; ")
          : data.detail;
        throw new Error(detail || "Prediction failed. Check that the API is running.");
      }
      setResult(data.predicted_delivery_time_minutes);
    } catch (requestError) {
      setError(requestError.message || "Could not connect to the prediction API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">D</span> Delivery Time Prediction</a></header>
      <section className="hero" id="top">
        <div className="hero-copy"><h1>Good food,<br />right on <em>time.</em></h1><p className="intro">Get a smart arrival estimate for your food order. Set the route, traffic, weather, and courier details.</p><div className="route-art" aria-label="Illustration of a food delivery route"><div className="route-line" /><span className="route-pin start-pin">⌂</span><span className="route-pin end-pin">✦</span><span className="route-bike">⌁</span><span className="route-label">ON THE WAY</span></div></div>
        <div className="planner-card"><div className="card-heading"><div><p className="eyebrow muted">BUILD A SCENARIO</p><h2>What’s this delivery like?</h2></div></div>
          <form onSubmit={handleSubmit}>
            <div className="section-label"><span>01</span> ROUTE & TIMING</div>
            <div className="trip-stats">
              <label className="stat-control"><span>TRIP DISTANCE <i>· observed 1.4–21 km</i></span><div><input required aria-label="Trip distance in kilometres" type="number" min="1.4" max="21" step="0.1" value={values.distance_km} onChange={(event) => setValues({ ...values, distance_km: event.target.value })} /><b>km</b></div><input className="range" aria-label="Adjust trip distance" type="range" min="1.4" max="21" step="0.1" value={values.distance_km} onChange={(event) => setValues({ ...values, distance_km: event.target.value })} /></label>
              <label className="stat-control"><span>ORDER HOUR <i>· dataset range 08–23</i></span><div><input required aria-label="Order hour" type="number" min="8" max="23" value={values.order_hour} onChange={(event) => setValues({ ...values, order_hour: event.target.value })} /><b>24h</b></div><input className="range" aria-label="Adjust order hour" type="range" min="8" max="23" value={values.order_hour} onChange={(event) => setValues({ ...values, order_hour: event.target.value })} /></label>
            </div>
            {[["Weather_conditions", "02", "WEATHER"], ["Road_traffic_density", "03", "ROAD TRAFFIC"], ["Type_of_vehicle", "04", "COURIER VEHICLE"], ["Type_of_order", "05", "ORDER TYPE"]].map(([name, number, title]) => <div className="choice-section" key={name}><div className="section-label"><span>{number}</span> {title}</div><div className={`choice-grid ${name === "Road_traffic_density" ? "traffic-grid" : ""} ${name === "Type_of_vehicle" || name === "Type_of_order" ? "compact-grid" : ""}`}>{visualChoices[name].map(([value, icon, caption]) => <button className={`choice ${values[name] === value ? "selected" : ""}`} type="button" key={value} aria-pressed={values[name] === value} onClick={() => setValues({ ...values, [name]: value })}><span className="choice-icon">{icon}</span><span className="choice-title">{caption}</span>{values[name] === value && <span className="check">✓</span>}</button>)}</div></div>)}
            <div className="more-details"><div className="section-label"><span>06</span> DELIVERY DETAILS <small>PARTNER, VEHICLE & CITY</small></div><div className="detail-grid">{fields.filter((field) => ["Delivery_person_Age", "Delivery_person_Ratings", "Vehicle_condition", "multiple_deliveries", "Festival", "City"].includes(field.name)).map((field) => <div className="field" key={field.name}><label htmlFor={field.name}>{field.name === "Vehicle_condition" ? "Vehicle condition score" : field.name === "multiple_deliveries" ? "Other deliveries" : field.label}</label>{field.options ? <CustomSelect label={field.name} options={field.options} value={values[field.name]} onChange={(value) => setValues({ ...values, [field.name]: value })} /> : <input id={field.name} required type="number" min={field.min} max={field.max} step={field.step} value={values[field.name]} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />}</div>)}</div></div>
            <button className="submit" type="submit" disabled={loading}>{loading ? "Mapping your journey…" : <> <span>Calculate arrival estimate</span><span className="submit-arrow" aria-hidden="true">↗</span></>}</button>
          </form>
          {error && <p className="notice error" role="alert">{error}</p>}
          {result !== null && <div className="notice result" role="status"><span>ESTIMATED DELIVERY TIME</span><strong>{result}<small> min</small></strong><span className="result-road" aria-hidden="true" /><svg className="delivery-scooter" viewBox="0 0 78 48" aria-hidden="true"><circle cx="19" cy="37" r="7" /><circle cx="58" cy="37" r="7" /><path d="M18 36h18l8-13h11l6 13H45l-9-13h-9l-6 13Zm26-13 5-10h8l5 10M28 23l-4-7h-8M47 13l3-5h8l4 5" /><path className="scooter-box" d="M43 9h12V2H43z" /><circle className="rider-head" cx="37" cy="7" r="5" /></svg></div>}
        </div>
      </section>
      <footer><div className="limitations"><p>Estimates are based on historical data; actual delivery times may vary.</p><p>Validated for trips of 1.4–21 km and order times from 08:00–23:00.</p></div></footer>
    </main>
  );
}
