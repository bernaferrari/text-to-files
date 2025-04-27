export interface ExtractedFile {
  path: string
  content: string
  id: string // Unique ID for React keys
}

// Helper function to remove leading indent (no changes needed)
const removeIndent = (content: string, indent: string): string => {
  if (!indent || indent.length === 0) {
    return content
  }
  const lines = content.split("\n")
  const indentRegex = new RegExp("^" + indent)
  const dedentedLines = lines.map((line) => line.replace(indentRegex, ""))
  // Remove potential leading empty line after dedenting
  if (dedentedLines[0] === "" && lines.length > 1) {
    dedentedLines.shift()
  }
  // Remove potential trailing empty line
  if (
    dedentedLines.length > 0 &&
    dedentedLines[dedentedLines.length - 1].trim() === ""
  ) {
    dedentedLines.pop()
  }
  return dedentedLines.join("\n")
}

// Rewritten helper function to specifically check a line for a file path using stripping
const tryExtractPathFromLine = (line: string): string | null => {
  console.log(`[Debug] Input line: "${line}"`) // Log initial input
  let potentialPath = line.trim()
  if (!potentialPath) {
    return null
  }

  // 1. Remove optional list marker (*, -, +) and trim again
  potentialPath = potentialPath.replace(/^[*\-+]\s+/, "").trim()

  // 2. Stripping logic - colon, outer formatting, colon again, THEN backticks
  const originalPathBeforeFormatting = potentialPath

  // Strip trailing colon first
  if (potentialPath.endsWith(":")) {
    potentialPath = potentialPath.slice(0, -1).trim()
  }

  // Strip surrounding **
  if (potentialPath.startsWith("**") && potentialPath.endsWith("**")) {
    potentialPath = potentialPath.slice(2, -2).trim()
    console.log(`[Debug] After ** strip: "${potentialPath}"`)
  }
  // Strip surrounding * (if not already handled by **)
  else if (potentialPath.startsWith("*") && potentialPath.endsWith("*")) {
    potentialPath = potentialPath.slice(1, -1).trim()
  }

  // Strip trailing colon again (in case it was inside outer formatting)
  if (potentialPath.endsWith(":")) {
    potentialPath = potentialPath.slice(0, -1).trim()
  }

  // Strip surrounding ` (Moved to run LAST before parenthesis/validation)
  if (potentialPath.startsWith("`") && potentialPath.endsWith("`")) {
    potentialPath = potentialPath.slice(1, -1).trim()
  }

  // 3. Clean potential parenthesized comments
  potentialPath = potentialPath.replace(/\s*\([^)]*\)\s*$/, "").trim()

  // 4. Validate the result
  console.log(`[Debug] Validating path: "${potentialPath}"`)
  const isValid =
    potentialPath.length > 0 &&
    !potentialPath.includes("```") &&
    !potentialPath.includes("\n") &&
    (potentialPath.includes(".") ||
      potentialPath.includes("/") ||
      /^[a-zA-Z0-9_\-]+$/.test(potentialPath)) &&
    !potentialPath.startsWith("-")

  console.log(`[Debug] Initial validation result: ${isValid}`)

  if (isValid) {
    // Final check for invalid characters that might remain
    const looksClean = /^[a-zA-Z0-9._\-\/\s]+$/.test(potentialPath)
    console.log(`[Debug] Final character check result: ${looksClean}`)
    if (looksClean) {
      console.log(`[Debug] Returning valid path: "${potentialPath}"`)
      return potentialPath
    } else {
      console.log(
        `[Debug] Path failed final character check: "${potentialPath}"`
      )
    }
  } else {
    console.log(`[Debug] Path failed initial validation: "${potentialPath}"`)
  }

  console.log("[Debug] Returning null (no valid path found).")
  return null
}

export function extractFilesFromText(text: string): ExtractedFile[] {
  const files: ExtractedFile[] = []
  const addedFiles = new Set<string>() // Keep track of path+content to avoid duplicates

  // Updated Regex: Allow optional leading whitespace. Capture line before, indent, language, content.
  // Group 1: Line before ``` (including potential list marker and formatting)
  // Group 2: Indentation before ```
  // Group 3: Language identifier
  // Group 4: Code block content
  const codeBlockPattern =
    /^\s*(.*)\n(\s*)```([a-zA-Z0-9._\-\/]*)\n([\s\S]*?)\n\s*```/gm

  let match
  while ((match = codeBlockPattern.exec(text)) !== null) {
    const lineBefore = match[1] || "" // Includes potential list marker etc.
    const indent = match[2] || ""
    const language = match[3] || ""
    let content = match[4] || ""

    // 1. Try extracting path from the line before the code block (handles list markers internally now)
    let filePath = tryExtractPathFromLine(lineBefore)

    // 2. If no path found above, check if the language identifier looks like a path
    if (
      !filePath &&
      language &&
      (language.includes("/") || language.includes("."))
    ) {
      // Basic check to avoid treating common languages like 'c++' or 'c#' as paths
      if (!["c++", "c#", "f#", "vb.net"].includes(language.toLowerCase())) {
        filePath = language
      }
    }

    // 3. Clean the content
    content = removeIndent(content, indent)

    // 4. Determine final path (use default if necessary)
    let finalPath = filePath
    // Only create default path if no path was found AND content exists
    if (!finalPath && content && content.trim().length > 0) {
      finalPath = `file.${language || "txt"}`
    }

    // 5. Add the file if path and content are valid and not a duplicate
    // Ensure content is not just whitespace
    if (finalPath && content && content.trim().length > 0) {
      const fileKey = `${finalPath}::${content}` // Use path and content for uniqueness
      if (!addedFiles.has(fileKey)) {
        files.push({
          path: finalPath,
          content,
          id: crypto.randomUUID(),
        })
        addedFiles.add(fileKey)
      }
    }
  }

  // --- Keep the logic for ```path/to/file blocks as a secondary check ---
  // This handles cases where the path is *only* in the language slot
  const filePathAsLanguagePattern =
    /(\s*)```([a-zA-Z0-9._\-\/]+)\n([\s\S]*?)\n\s*```/g
  filePathAsLanguagePattern.lastIndex = 0 // Reset index
  while ((match = filePathAsLanguagePattern.exec(text)) !== null) {
    const indent = match[1] || ""
    const filePath = match[2] || ""
    let content = match[3] || ""

    // Check if this specific block was *already* processed by the main loop
    // (This check is simplified; a more robust check might compare exact match indices)
    const alreadyProcessed = files.some(
      (f) => f.path === filePath && f.content === removeIndent(content, indent)
    )

    if (
      !alreadyProcessed &&
      (filePath.includes("/") || filePath.includes(".")) &&
      content
    ) {
      content = removeIndent(content, indent)
      const fileKey = `${filePath}::${content}`
      if (!addedFiles.has(fileKey)) {
        files.push({
          path: filePath,
          content,
          id: crypto.randomUUID(),
        })
        addedFiles.add(fileKey)
      }
    }
  }
  // --- End of secondary check ---

  return files
}
