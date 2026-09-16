export const demoContent = `Here’s a small React starter with a reusable button.

**components/Button.jsx**
\`\`\`jsx
export function Button({ children, onClick }) {
  return (
    <button className="button" onClick={onClick}>
      {children}
    </button>
  );
}
\`\`\`

**pages/index.jsx**
\`\`\`jsx
import { Button } from "../components/Button";
import "../styles.css";

export default function Home() {
  return (
    <main>
      <h1>Something good starts here.</h1>
      <Button onClick={() => alert("Hello!")}>
        Say hello
      </Button>
    </main>
  );
}
\`\`\`

**styles.css**
\`\`\`css
body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
}

.button {
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: #236b5c;
  color: white;
  cursor: pointer;
}
\`\`\`
`
