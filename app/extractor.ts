export interface ExtractedFile {
  path: string
  content: string
  id: string // Unique ID for React keys
}

// Improved regex to extract file paths and code blocks from various formats:
// - Handles **`path/to/file.tsx`** format
// - Handles path/to/file.tsx format
// - Handles `path/to/file.tsx` format
// - Handles paths with descriptions in parentheses
// - Handles special cases like ```filename.ext

export function extractFilesFromText(text: string): ExtractedFile[] {
  const files: ExtractedFile[] = []

  // Main pattern for code blocks with various file path formats
  const codeBlockPattern =
    /(?:\*\*`?([^*`\n]+)`?\*\*|\*\*([^*\n]+)\*\*|`([^`\n]+)`|([^\n]+))?\s*\n```([a-zA-Z0-9._\-]*)\n([\s\S]*?)\n```/g

  // Special pattern for code blocks with filename as language indicator
  const filePathAsLanguagePattern = /```([a-zA-Z0-9._\-\/]+)\n([\s\S]*?)\n```/g

  let match

  // Process regular code blocks (with file path before the block)
  while ((match = codeBlockPattern.exec(text)) !== null) {
    // Extract file path and content
    let filePath = match[1] || match[2] || match[3] || match[4] || ""
    const language = match[5] || ""
    const content = match[6] || ""

    // Clean up the file path
    // 1. Remove markdown artifacts and backticks (**, `, **)
    filePath = filePath.replace(/^\*\*`?|\*\*$|^`|`$/g, "")
    // 2. Remove description in parentheses if present
    filePath = filePath.replace(/\s*\([^)]*\)\s*$/, "").trim()

    if (filePath && content) {
      files.push({
        path: filePath,
        content,
        id: crypto.randomUUID(),
      })
    } else if (!filePath && language && content) {
      // If no file path, but we have a language and content, create a default file
      files.push({
        path: `file.${language || "txt"}`,
        content,
        id: crypto.randomUUID(),
      })
    }
  }

  // Process code blocks with filename as the language indicator
  filePathAsLanguagePattern.lastIndex = 0
  while ((match = filePathAsLanguagePattern.exec(text)) !== null) {
    const filePath = match[1]
    const content = match[2]

    // Only add if the file contains a valid path separator or looks like a filename
    if ((filePath.includes("/") || filePath.includes(".")) && content) {
      // Check if this file was already added
      const alreadyExists = files.some((file) => file.path === filePath)

      if (!alreadyExists) {
        files.push({
          path: filePath,
          content,
          id: crypto.randomUUID(),
        })
      }
    }
  }

  return files
}
