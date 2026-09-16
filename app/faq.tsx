const questions = [
  {
    id: "getting-started",
    question: "How do I turn an AI response into files?",
    answer:
      "Copy the response, then use Paste text or paste directly into the source editor. Text to Files extracts fenced code blocks as you type. Select a file in the tree to review it, then download an individual file or choose Download ZIP for all extracted files. Try example loads a small project so you can explore the workflow.",
  },
  {
    id: "format",
    question: "How should I format filenames and code blocks?",
    answer:
      "For the most predictable result, put the filename or relative path on the line immediately above a code block enclosed in triple backticks. Plain paths, bold paths, and paths wrapped in inline backticks are supported. Include the language after the opening fence for syntax highlighting. You can ask your AI assistant to follow the example below.",
  },
  {
    id: "folders",
    question: "Will my folder structure be preserved?",
    answer:
      "Yes. A path such as src/components/Button.tsx creates nested folders in the file tree and ZIP. Use relative paths from the root of your project. Only the files represented by code blocks are included; dependencies, images, and other referenced assets are not fetched automatically.",
  },
  {
    id: "editing",
    question: "Can I edit the extracted files?",
    answer:
      "Edit their code in the source panel. The file tree and preview update automatically, including when you add or remove a code block. The extracted-file preview is read-only. On smaller screens, choose View files to review the result and Back to source to continue editing.",
  },
  {
    id: "missing-files",
    question: "Why is a file missing or named incorrectly?",
    answer:
      "Check that the code block has opening and closing triple backticks on separate lines and a filename directly above it. Empty code blocks are skipped. Without a recognized path, a block may receive a fallback name based on its language. Explicit filenames are more reliable than descriptions such as “Here is your component.”",
  },
  {
    id: "renaming",
    question: "Can I change the filename style?",
    answer:
      "Use Rename files below the file tree to apply camelCase, PascalCase, kebab-case, or snake_case. The tool also attempts to update supported import paths. This is a text transformation, not a full compiler: review imports after renaming, especially complex relative paths. Imported variable names are not renamed. Choose the original naming option to return to the paths in your source.",
  },
  {
    id: "storage",
    question: "Where is my text processed and saved?",
    answer:
      "Extraction and ZIP creation run in your browser. The source text and naming preference are saved in this site's local storage so you can return to your work in the same browser profile. Clearing site data removes that saved state. The site also uses PostHog for usage analytics; browser-based extraction does not mean the site makes no network requests.",
  },
  {
    id: "compatibility",
    question: "Does it work with any AI assistant or programming language?",
    answer:
      "The tool reads text, so you can paste a response from any assistant or a Markdown document. No AI account connection is required. Extraction depends on code block formatting and filenames, rather than the assistant that produced the response. Syntax highlighting varies by language. The tool does not execute, test, or verify the generated code.",
  },
]

export function FAQ() {
  return (
    <div>
      {questions.map(({ id, question, answer }) => (
        <section
          key={id}
          id={id}
          aria-labelledby={`${id}-title`}
          className="scroll-mt-24 border-t py-7"
        >
          <h2 id={`${id}-title`} className="text-lg font-medium tracking-tight">
            {question}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {answer}
          </p>
          {id === "format" && (
            <pre className="mt-4 overflow-x-auto rounded-xl border bg-card p-5 font-mono text-sm leading-6">
              <code>
                {
                  '**src/hello.ts**\n```ts\nexport const hello = "Hello, world!";\n```'
                }
              </code>
            </pre>
          )}
        </section>
      ))}
    </div>
  )
}
