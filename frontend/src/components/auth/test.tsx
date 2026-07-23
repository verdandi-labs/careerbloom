import { useState } from "react";

export default function TestInput() {
  const [text, setText] = useState("");
  return (
    <div style={{ padding: "2rem", backgroundColor: "white" }}>
      <h1>Bare Input Test</h1>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here"
        autoFocus
        style={{
          padding: "0.5rem",
          fontSize: "1rem",
          border: "2px solid red",
          width: "300px",
        }}
      />
      <p>Value: {text}</p>
    </div>
  );
}
