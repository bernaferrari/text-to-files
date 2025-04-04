export const demoContent = `# 👋 Welcome to Text to Files!

This tool extracts code blocks from AI chat outputs and organizes them into a proper file structure with a single paste.

## 🔍 How It Works:

1. **File Path Detection:** The tool recognizes file paths written in various formats:
   - Before code blocks: \`**components/utils.ts**\`
   - In markdown headers: \`## components/Button.jsx\`
   - With backticks: \`\`components/Header.tsx\`\`
   
2. **Code Extraction:** Code blocks are associated with their file paths and extracted with proper syntax highlighting

3. **Structure Building:** A navigable file tree is automatically created, preserving directories and nesting

4. **Smart Import Handling:** When you rename files using the transformation options, all import paths referencing those files are automatically updated across the project

## 📁 Try The File Explorer:

After pasting code like this example, you'll see all these files appear in the explorer on the right ➡️

---

**components/utils.ts**
\`\`\`ts
// This file will be extracted as "components/utils.ts"
// Other files can import from this path
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}
\`\`\`

**components/Button.jsx**
\`\`\`jsx
// This file will be extracted as "components/Button.jsx"
// Notice how the NiceCard component imports from this file
export function Button({ children, onClick, variant = "primary" }) {
  return (
    <button 
      className={\`button button--\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
\`\`\`

**components/NiceCard.jsx**
\`\`\`jsx
// This demonstrates how imports are handled when files are renamed
// Try using the "Rename Files" button to see how these imports update automatically
import { Button } from "./Button";
import { formatDate, capitalize } from "./utils";

export function NiceCard({ title, date }) {
  return (
    <div className="card">
      <h3>{capitalize(title)}</h3>
      <p>Posted: {formatDate(date)}</p>
      <Button variant="outline" onClick={() => alert("Button clicked!")}>
        Read More
      </Button>
    </div>
  );
}
\`\`\`

**pages/index.jsx**
\`\`\`jsx
// This shows how imports from different directory levels work
// Note how these paths will automatically update if you rename files
import { NiceCard } from "../components/NiceCard";
import { Button } from "../components/Button";

export default function HomePage() {
  return (
    <div className="container">
      <h1>My Demo App</h1>
      
      <Button onClick={() => console.log("Home button clicked")}>
        Home Button
      </Button>
      
      <NiceCard 
        title="first card example" 
        date="2023-05-15"
      />
    </div>
  );
}
\`\`\`

## 🛠️ Features to Try:

1. **Click different files** in the tree explorer to view their contents with syntax highlighting

2. **Try renaming files to kebab-case** using the "Rename Files" dropdown at the top right
   - Watch how "Button.jsx" becomes "button.jsx"
   - Notice how all import paths like \`import { Button } from "./Button"\` update automatically to \`import { Button } from "./button"\`

3. **Download individual files** by viewing them and clicking the download icon, or grab the complete project as a .zip

4. **Clear and start fresh** by pasting your own code with file paths into the input box

This tool is perfect for quickly turning AI assistant code outputs into usable project files!`
