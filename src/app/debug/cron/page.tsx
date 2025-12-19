"use client";

export default function DebugCron() {
  const runCron = async () => {
    const res = await fetch("/api/cron/ledger-daily", {
      headers: {
        Authorization: "Bearer super-secret-ledger-123",
      },
    });

    const json = await res.json();
    console.log(json);
    alert("Cron executed: " + JSON.stringify(json));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug Cron</h1>
      <button
        onClick={runCron}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          background: "blue",
          color: "white",
          borderRadius: "8px",
        }}
      >
        Run Daily Ledger Cron
      </button>
    </div>
  );
}
