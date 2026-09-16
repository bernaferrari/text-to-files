"use client"

import React, { useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { saveAs } from "file-saver"
import JSZip from "jszip"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  FileText,
  Folder,
  FolderTree,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tree } from "@/components/ui/tree"
import { BorderBeam } from "@/components/magicui/border-beam"

import { demoContent } from "./demo-content"
import { ExtractedFile, extractFilesFromText } from "./extractor"

// --- Interface Definitions (keep existing) ---
interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children: FileNode[]
  content?: string
  id?: string
  expanded?: boolean
}

interface TreeItem {
  id: string
  name: string
  icon?: React.ElementType
  children?: TreeItem[]
  path?: string
  content?: string
  language?: string
  type?: "file" | "folder"
}

type TransformType =
  "camelCase" | "kebabCase" | "snakeCase" | "pascalCase" | "none"

// --- Helper Functions (keep existing: getLanguageFromFilename, transformations, transformPath, cleanFilePath, convertToTreeItems, updateImportsInContent, updateImportsAcrossFiles) ---
const getLanguageFromFilename = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase() || ""
  const extensionMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    swift: "swift",
    kt: "kotlin",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    graphql: "graphql",
    dart: "dart",
    vue: "vue",
    svelte: "svelte",
    sol: "solidity",
  }
  return extensionMap[extension] || "plaintext"
}

const transformations = {
  camelCase: (str: string) =>
    str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, (c) => c.toLowerCase()),
  pascalCase: (str: string) =>
    str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase()),
  kebabCase: (str: string) =>
    str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase(),
  snakeCase: (str: string) =>
    str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase(),
  none: (str: string) => str,
}

const transformPath = (path: string, transform: TransformType): string => {
  if (transform === "none") return path
  const parts = path.split("/")
  const fileName = parts.pop() || ""
  const fileNameParts = fileName.split(".")
  const extension = fileNameParts.length > 1 ? fileNameParts.pop() : null
  const transformedDirs = parts.map((dir) => transformations[transform](dir))
  let transformedFileName = transformations[transform](fileNameParts.join("."))
  if (extension) transformedFileName = `${transformedFileName}.${extension}`
  transformedDirs.push(transformedFileName)
  return transformedDirs.join("/")
}

const cleanFilePath = (path: string): string => {
  // Remove leading/trailing markdown like **, *, `
  path = path.replace(/^\*\*`?|\*\*$|^`|`$/g, "").trim()
  // Remove trailing parenthesized text like (optional)
  path = path.replace(/\s*\([^)]*\)\s*$/, "").trim()
  // Remove trailing colon and anything after it (like code block markers)
  path = path.replace(/:.*$/, "").trim()
  return path
}

const convertToTreeItems = (nodes: FileNode[]): TreeItem[] => {
  return nodes.map((node) => {
    const treeItem: TreeItem = {
      id: node.path,
      name: node.name,
      icon: node.type === "folder" ? Folder : FileText,
      path: node.path,
      type: node.type,
    }
    if (node.type === "folder" && node.children.length > 0)
      treeItem.children = convertToTreeItems(node.children)
    if (node.type === "file" && node.content !== undefined) {
      treeItem.content = node.content
      treeItem.language = getLanguageFromFilename(node.name)
    }
    return treeItem
  })
}

const updateImportsInContent = (
  content: string,
  oldPath: string,
  newPath: string
): string => {
  if (oldPath === newPath) return content
  const oldPathParts = oldPath.split("/")
  const newPathParts = newPath.split("/")
  const oldFileNameWithoutExt = oldPathParts[oldPathParts.length - 1].replace(
    /\.[^/.]+$/,
    ""
  )
  const newFileNameWithoutExt = newPathParts[newPathParts.length - 1].replace(
    /\.[^/.]+$/,
    ""
  )
  const oldDirPath = oldPathParts.slice(0, -1).join("/")
  const newDirPath = newPathParts.slice(0, -1).join("/")
  const baseNameChanged = oldFileNameWithoutExt !== newFileNameWithoutExt
  const dirChanged = oldDirPath !== newDirPath

  // Get file extension to determine file type
  const fileExtension = oldPath.split(".").pop()?.toLowerCase()
  const isPythonFile = fileExtension === "py"

  if (!baseNameChanged && !dirChanged) return content

  let updatedContent = content

  // Handle JS/TS imports
  const importRequireRegex = new RegExp(
    `(import(?:\\s+[^;]+?\\s+from)?\\s*|require\\s*\\(|import\\s*\\()([\'\"])(\.?./|\.\./|@/|~/)?([^\'\"\n]*?/)?(${oldFileNameWithoutExt})(\\.\\w+)?([\'\"])`,
    "g"
  )

  updatedContent = updatedContent.replace(
    importRequireRegex,
    (
      match,
      prefix,
      quote1,
      pathPrefix = "",
      dirPath = "",
      oldName,
      extension = "",
      quote2
    ) => {
      if (baseNameChanged)
        return `${prefix}${quote1}${pathPrefix}${dirPath}${newFileNameWithoutExt}${extension}${quote2}`
      return match
    }
  )

  // Handle Python imports
  if (
    isPythonFile ||
    content.includes("import ") ||
    content.includes("from ")
  ) {
    // Regular import: import module_name or import package.module_name
    const pyImportRegex = new RegExp(
      `\\bimport\\s+((?:[\\w.]+\\.)?)(${oldFileNameWithoutExt})\\b`,
      "g"
    )

    updatedContent = updatedContent.replace(
      pyImportRegex,
      (match, prefix, moduleName) => {
        if (baseNameChanged) {
          return `import ${prefix}${newFileNameWithoutExt}`
        }
        return match
      }
    )

    // From import: from package.module import symbol
    const pyFromImportRegex = new RegExp(
      `\\bfrom\\s+((?:[\\w.]+\\.)?)(${oldFileNameWithoutExt})\\b\\s+import\\s+`,
      "g"
    )

    updatedContent = updatedContent.replace(
      pyFromImportRegex,
      (match, prefix, moduleName) => {
        if (baseNameChanged) {
          return `from ${prefix}${newFileNameWithoutExt} import `
        }
        return match
      }
    )
  }

  if (dirChanged)
    console.warn(
      `Warning: Directory changed for path ${oldPath} -> ${newPath}. Relative imports might need manual adjustment.`
    )

  return updatedContent
}

const updateImportsAcrossFiles = (
  oldFiles: ExtractedFile[],
  newFiles: ExtractedFile[]
): ExtractedFile[] => {
  const pathMap = new Map<string, string>()
  oldFiles.forEach((oldFile, index) => {
    if (index < newFiles.length) pathMap.set(oldFile.path, newFiles[index].path)
  })
  return newFiles.map((file) => {
    let updatedContent = file.content
    pathMap.forEach((newPath, oldPath) => {
      if (oldPath !== newPath)
        updatedContent = updateImportsInContent(
          updatedContent,
          oldPath,
          newPath
        )
    })
    return { ...file, content: updatedContent }
  })
}

// --- Animated Arrow Components ---
interface AnimatedArrowProps {
  className?: string
  inputContent: string
}

export default function FileExtractor() {
  const [inputContent, setInputContent] = useState<string>("")
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([])
  const [fileTree, setFileTree] = useState<FileNode>({
    name: "root",
    path: "",
    type: "folder",
    children: [],
    expanded: true,
  })
  const [selectedItem, setSelectedItem] = useState<{
    path: string
    content?: string
    language?: string
    type: "file" | "folder"
    id?: string
  } | null>(null)
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark")
  const [transformType, setTransformType] = useState<TransformType>("none")
  const [extractionSuccess, setExtractionSuccess] = useState<boolean>(false) // For beam effect
  const [copyButtonClicked, setCopyButtonClicked] = useState<string | null>(
    null
  ) // Track which copy button
  const { resolvedTheme } = useTheme()
  const beamTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (beamTimeout.current) clearTimeout(beamTimeout.current)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
    },
    []
  )
  const [initialized, setInitialized] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [mobileFilesOpen, setMobileFilesOpen] = useState(false)
  const treeItems = React.useMemo(
    () => convertToTreeItems(fileTree.children),
    [fileTree]
  )

  useEffect(() => {
    const flat = (nodes: TreeItem[]): TreeItem[] =>
      nodes.flatMap((node) => [node, ...flat(node.children ?? [])])
    const items = flat(treeItems)
    setSelectedItem((previous) => {
      const item =
        items.find((item) => item.path === previous?.path) ??
        items.find((item) => item.type === "file")
      return item
        ? {
            path: item.path!,
            id: item.id,
            type: item.type!,
            content: item.content,
            language: item.language,
          }
        : null
    })
  }, [treeItems])

  // Set editor theme based on app theme setting
  useEffect(() => {
    // Use the app's theme setting instead of just system preference
    setEditorTheme(resolvedTheme === "dark" ? "vs-dark" : "light")
  }, [resolvedTheme])

  // Rebuild from the saved source rather than relying on a stale extracted-file cache.
  useEffect(() => {
    let source = ""
    let style: TransformType = "none"
    try {
      source = localStorage.getItem("code-extractor-input") ?? ""
      const savedStyle = localStorage.getItem("code-extractor-transform")
      if (
        ["none", "camelCase", "pascalCase", "kebabCase", "snakeCase"].includes(
          savedStyle ?? ""
        )
      )
        style = savedStyle as TransformType
    } catch {
      /* The workspace still works when storage is unavailable. */
    }
    setTransformType(style)
    handleInputChange(source, style)
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return
    try {
      localStorage.setItem("code-extractor-input", inputContent)
      localStorage.setItem("code-extractor-transform", transformType)
    } catch {
      /* Storage may be unavailable or full. */
    }
  }, [inputContent, transformType, initialized])

  // Build file tree (modified slightly for clarity/robustness)
  const buildFileTree = (files: ExtractedFile[]) => {
    const root: FileNode = {
      name: "root",
      path: "",
      type: "folder",
      children: [],
      expanded: true,
    }
    const pathsAdded = new Set<string>()

    // Clean paths first
    const cleanedFiles = files.map((file) => ({
      ...file,
      path: cleanFilePath(file.path),
    }))

    cleanedFiles.forEach((file) => {
      const pathParts = file.path.split("/")
      let currentNode = root

      // Create folders
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        const currentPath = pathParts.slice(0, i + 1).join("/")
        let found = currentNode.children.find(
          (child) => child.type === "folder" && child.path === currentPath
        )
        if (!found) {
          found = {
            name: part,
            path: currentPath,
            type: "folder",
            children: [],
            expanded: true,
          }
          currentNode.children.push(found)
        }
        currentNode = found
      }

      // Add file, handling duplicates
      const fileName = pathParts[pathParts.length - 1]
      let uniquePath = file.path
      let counter = 1
      while (pathsAdded.has(uniquePath)) {
        const nameParts = fileName.split(".")
        const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : ""
        const baseName = nameParts.join(".")
        const newFileName = `${baseName} (${counter})${ext}`
        uniquePath = [...pathParts.slice(0, -1), newFileName].join("/")
        counter++
      }
      pathsAdded.add(uniquePath)

      currentNode.children.push({
        name: uniquePath.split("/").pop() || fileName, // Use name from unique path
        path: uniquePath,
        type: "file",
        children: [],
        content: file.content,
        id: file.id,
      })
    })

    // Sort tree
    const sortNode = (node: FileNode) => {
      node.children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name)
        return a.type === "folder" ? -1 : 1
      })
      node.children.forEach((child) => {
        if (child.type === "folder") sortNode(child)
      })
    }
    sortNode(root)
    setFileTree(root)
  }

  // Handle input change and parse files
  const handleInputChange = (
    content: string | undefined,
    style: TransformType = transformType
  ) => {
    const newContent = content || ""
    setInputContent(newContent)

    try {
      let newFiles = extractFilesFromText(newContent)

      const originals = newFiles.map((file) => ({
        ...file,
        path: cleanFilePath(file.path),
      }))
      newFiles = updateImportsAcrossFiles(
        originals,
        originals.map((file) => ({
          ...file,
          path: style === "none" ? file.path : transformPath(file.path, style),
        }))
      )

      setExtractedFiles(newFiles)
      buildFileTree(newFiles)

      if (newFiles.length > 0) {
        setExtractionSuccess(true)
        if (beamTimeout.current) clearTimeout(beamTimeout.current)
        beamTimeout.current = setTimeout(
          () => setExtractionSuccess(false),
          1200
        )
      } else {
        setExtractionSuccess(false)
      }
    } catch (error) {
      console.error("Error extracting files:", error)
      toast.error("Extraction Failed", {
        description: "Could not parse files from input.",
      })
      setExtractionSuccess(false)
    }
  }

  function isPathFolder(tree: FileNode, targetPath: string): boolean {
    // BFS or DFS to locate the node
    const queue = [tree]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.path === targetPath && current.type === "folder") {
        return true
      }
      current.children.forEach((child) => queue.push(child))
    }
    return false
  }

  // Transform all paths
  const transformAllPaths = (transform: TransformType) => {
    if (extractedFiles.length === 0) return

    // Remember the currently selected path and type (folder or file)
    const oldSelectedPath = selectedItem?.path
    const oldSelectedType = selectedItem?.type

    // Create a map of oldPath -> newPath
    const pathTransformMap = new Map<string, string>()

    const originalFiles = extractFilesFromText(inputContent).map((file) => ({
      ...file,
      path: cleanFilePath(file.path),
    }))
    let transformedFiles = originalFiles.map((file) => {
      const cleanPath = cleanFilePath(file.path)
      const newPath =
        transform === "none" ? cleanPath : transformPath(cleanPath, transform)
      pathTransformMap.set(file.path, newPath)
      return { ...file, path: newPath }
    })

    // Update imports
    transformedFiles = updateImportsAcrossFiles(originalFiles, transformedFiles)

    // Update state
    setExtractedFiles(transformedFiles)
    buildFileTree(transformedFiles)
    setTransformType(transform)

    // If we had a selected item, re-select it based on oldSelectedPath & oldSelectedType
    if (oldSelectedPath) {
      const newPath = pathTransformMap.get(oldSelectedPath)
      if (newPath) {
        // After buildFileTree, check if path is actually a folder
        const folderCheck = isPathFolder(fileTree, newPath)
        if (folderCheck) {
          setSelectedItem({
            path: newPath,
            id: newPath,
            type: "folder",
          })
        } else {
          // It's a file, find the updated file
          const updatedFile = transformedFiles.find(
            (file) => file.path === newPath
          )
          if (updatedFile) {
            setSelectedItem({
              ...updatedFile,
              id: updatedFile.path,
              type: "file",
              language: getLanguageFromFilename(updatedFile.path),
            })
          } else {
            setSelectedItem(null)
          }
        }
      } else {
        setSelectedItem(null)
      }
    }

    toast.success(
      transform === "none"
        ? "Reset paths to original"
        : `Transformed paths to ${transform}`
    )
  }

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setInputContent(clipboardText)
      handleInputChange(clipboardText) // Trigger extraction immediately
      toast.success("Pasted from clipboard")
    } catch (error) {
      toast.error("Failed to paste from clipboard")
    }
  }

  // Load demo content
  const handleLoadDemo = () => {
    setInputContent(demoContent)
    handleInputChange(demoContent, "none") // Process demo content
    setTransformType("none") // Reset transform for demo
    setSelectedItem(null)
  }

  // Copy file content
  const copyFileContent = (content: string, itemId: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopyButtonClicked(itemId)
        if (copyTimeout.current) clearTimeout(copyTimeout.current)
        copyTimeout.current = setTimeout(() => setCopyButtonClicked(null), 1500)
      })
      .catch(() => toast.error("Failed to copy to clipboard"))
  }

  // Download single file
  const downloadFile = (path: string, content: string, filename?: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    saveAs(blob, filename || path.split("/").pop() || "file.txt")
    toast.success(`Downloaded: ${filename || path.split("/").pop()}`)
  }

  // Get all files in folder (recursive helper needed if tree structure is deep)
  const downloadFolderAsZip = async (
    folderPath: string,
    folderName: string
  ) => {
    const zip = new JSZip()
    let filesAdded = 0

    // Find the starting node in the tree to get relative paths correctly
    const findNode = (
      nodes: FileNode[],
      targetPath: string
    ): FileNode | null => {
      for (const node of nodes) {
        if (node.path === targetPath) return node
        if (node.type === "folder" && targetPath.startsWith(node.path + "/")) {
          const found = findNode(node.children, targetPath)
          if (found) return found
        }
      }
      return null
    }

    const startNode =
      folderPath === "" ? fileTree : findNode(fileTree.children, folderPath)

    const addFilesToZip = (node: FileNode, currentZipFolder: JSZip) => {
      node.children.forEach((child) => {
        if (child.type === "file" && child.content !== undefined) {
          currentZipFolder.file(child.name, child.content)
          filesAdded++
        } else if (child.type === "folder") {
          const subFolder = currentZipFolder.folder(child.name)
          if (subFolder) {
            // Check if folder creation was successful
            addFilesToZip(child, subFolder)
          }
        }
      })
    }

    if (startNode) {
      addFilesToZip(startNode, zip)
    } else {
      // Fallback for flat list if tree node not found (less ideal for structure)
      const folderFiles = extractedFiles.filter(
        (file) =>
          file.path === folderPath || file.path.startsWith(folderPath + "/")
      )
      folderFiles.forEach((file) => {
        const relativePath =
          folderPath === ""
            ? file.path
            : file.path.substring(folderPath.length + 1)
        if (relativePath) {
          // Avoid adding empty path files
          zip.file(relativePath, file.content)
          filesAdded++
        }
      })
    }

    if (filesAdded === 0) {
      toast.error("No files found in this directory to zip")
      return
    }

    try {
      const blob = await zip.generateAsync({ type: "blob" })
      saveAs(blob, `${folderName || "directory"}.zip`)
      toast.success(
        `Downloaded ${folderName || "directory"} as zip (${filesAdded} files)`
      )
    } catch (error) {
      console.error("Failed to create zip:", error)
      toast.error("Failed to create zip file")
    }
  }

  // Download project
  const downloadProject = async () => {
    if (extractedFiles.length === 0) {
      toast.error("No files to download")
      return
    }
    const zip = new JSZip()

    // Use the tree structure to build the zip accurately
    const addFilesToZip = (node: FileNode, currentZipFolder: JSZip) => {
      node.children.forEach((child) => {
        if (child.type === "file" && child.content !== undefined) {
          currentZipFolder.file(child.name, child.content)
        } else if (child.type === "folder") {
          const subFolder = currentZipFolder.folder(child.name)
          if (subFolder) {
            // Check if folder creation was successful
            addFilesToZip(child, subFolder)
          }
        }
      })
    }

    addFilesToZip(fileTree, zip) // Start from the root

    try {
      const blob = await zip.generateAsync({ type: "blob" })
      saveAs(blob, "extracted_project.zip")
      toast.success(
        `Downloaded ${extractedFiles.length} ${extractedFiles.length === 1 ? "file" : "files"} as ZIP`
      )
    } catch (error) {
      console.error("Failed to create zip:", error)
      toast.error("Failed to create zip file")
    }
  }

  // Handle item selection
  const handleSelectItem = (item: TreeItem | null) => {
    setReviewing(true)
    setMobileFilesOpen(false)
    if (!item) {
      setSelectedItem(null)
      return
    }

    // IMPORTANT: Fix duplicate id property
    setSelectedItem({
      path: item.path || "",
      // Only use path as id consistently
      id: item.path || "",
      type: item.type || "file",
      content: item.content,
      language: item.language,
      // Removed duplicate id property that was overriding the path-based id
    })
  }

  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 23,
    fontFamily: "var(--font-jetbrains), monospace",
    padding: { top: 18, bottom: 18 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    scrollbar: { alwaysConsumeMouseWheel: false },
  }

  const sourceEditor = (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b pl-4 pr-2">
        <span className="shrink-0 text-xs text-muted-foreground">
          Source text
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadDemo}
            className="text-xs text-muted-foreground"
          >
            Try example
          </Button>
          <Button
            variant={inputContent.trim() ? "outline" : "default"}
            size="sm"
            onClick={handlePaste}
            className="text-xs"
          >
            <ClipboardPaste className="size-3.5" />
            Paste text
          </Button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col after:pointer-events-none after:absolute after:inset-0 after:z-10 after:border-2 after:border-transparent focus-within:after:border-ring">
        <Editor
          height="100%"
          language="markdown"
          value={inputContent}
          onChange={(value) => handleInputChange(value ?? "")}
          theme={editorTheme}
          loading={<EditorLoading />}
          options={{
            ...editorOptions,
            ariaLabel: "Source text",
            wordWrap: "on",
            lineNumbers: "off",
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 16,
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            wordBasedSuggestions: "off",
            tabCompletion: "off",
            accessibilitySupport: "auto",
          }}
        />
        {!inputContent && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-[18px] whitespace-pre-wrap font-mono text-[13px] leading-[23px] text-muted-foreground"
          >
            {
              'Paste your response here…\n\nsrc/hello.ts\n```ts\nexport const hello = "Hello, world!";\n```'
            }
          </div>
        )}
      </div>
      <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-t px-4 py-2 text-xs leading-5 text-muted-foreground">
        <span>
          {inputContent.trim() && !extractedFiles.length
            ? "No files found. Put a filename above each fenced code block."
            : "Put a filename above each code block. Files update as you edit."}
        </span>
        {extractedFiles.length > 0 && (
          <button
            onClick={() => {
              setReviewing(true)
            }}
            className="shrink-0 font-medium text-foreground hover:underline md:hidden"
          >
            View files
          </button>
        )}
      </div>
    </>
  )
  const filePreview = selectedItem ? (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b pl-4 pr-2">
        <span
          title={selectedItem.path}
          className="min-w-0 truncate font-mono text-xs text-muted-foreground"
        >
          {selectedItem.path}
        </span>
        <div className="flex shrink-0 gap-1">
          <IconAction
            label={
              selectedItem.type === "folder"
                ? "Download folder ZIP"
                : "Download file"
            }
            onClick={() =>
              selectedItem.type === "folder"
                ? downloadFolderAsZip(
                    selectedItem.path,
                    selectedItem.path.split("/").pop()!
                  )
                : downloadFile(selectedItem.path, selectedItem.content ?? "")
            }
          >
            <Download className="size-4" />
          </IconAction>
          {selectedItem.type === "file" && (
            <IconAction
              label={
                copyButtonClicked === selectedItem.id ? "Copied" : "Copy file"
              }
              onClick={() =>
                copyFileContent(selectedItem.content ?? "", selectedItem.id!)
              }
            >
              <span className="relative size-4">
                {[Copy, Check].map((Icon, i) => (
                  <Icon
                    key={i}
                    className={cn(
                      "absolute size-4 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                      (copyButtonClicked === selectedItem.id) === !!i
                        ? "scale-100 opacity-100"
                        : "scale-50 opacity-0"
                    )}
                  />
                ))}
              </span>
            </IconAction>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {selectedItem.type === "file" ? (
          <Editor
            height="100%"
            language={selectedItem.language}
            value={selectedItem.content ?? ""}
            theme={editorTheme}
            loading={<EditorLoading />}
            options={{
              ...editorOptions,
              ariaLabel: "File preview",
              readOnly: true,
              wordWrap: "off",
              lineNumbersMinChars: 3,
              folding: false,
            }}
          />
        ) : (
          <div className="p-4">
            {extractedFiles
              .filter((file) => file.path.startsWith(selectedItem.path + "/"))
              .map((file) => (
                <button
                  key={file.id}
                  onClick={() =>
                    handleSelectItem({
                      id: file.path,
                      name: file.path,
                      path: file.path,
                      content: file.content,
                      language: getLanguageFromFilename(file.path),
                      type: "file",
                    })
                  }
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2"
                >
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="flex h-full flex-col items-center justify-center px-6 py-6 text-center">
      <h2 className="text-base font-medium">
        {inputContent.trim()
          ? "No files found yet"
          : "Your files will appear here"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {inputContent.trim()
          ? "Place a filename above each fenced code block. You can include the rest of the conversation, too."
          : "Each named code block becomes a file. Folder paths stay intact."}
      </p>
      <Button variant="outline" className="mt-5" onClick={handleLoadDemo}>
        Try an example
      </Button>
      <span className="mt-2 text-xs text-muted-foreground">
        See the source and its extracted files.
      </span>
    </div>
  )

  return (
    <section
      aria-label="Text to files workspace"
      className="flex min-h-[600px] flex-col"
      style={{ height: "calc(100dvh - 268px)" }}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-1 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle file sidebar"
            aria-expanded={mobileFilesOpen}
            onClick={() => setMobileFilesOpen(!mobileFilesOpen)}
            className="md:hidden"
          >
            <FolderTree className="size-4" />
          </Button>
          {reviewing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReviewing(false)
                setMobileFilesOpen(false)
              }}
              className="shrink-0 text-xs md:hidden"
            >
              <ArrowLeft className="size-3.5" />
              Back to source
            </Button>
          )}
          <span
            className={cn(
              "text-sm font-medium",
              reviewing && "hidden md:block"
            )}
          >
            Source text
          </span>
        </div>
        <Button
          onClick={downloadProject}
          disabled={!extractedFiles.length}
          className="h-8 shrink-0 px-3 text-xs"
        >
          <Download className="size-3.5" />
          Download ZIP
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 md:grid-rows-[220px_minmax(0,1fr)] xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.65fr)] xl:grid-rows-1">
        <div className="hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card md:flex">
          {sourceEditor}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="hidden h-12 shrink-0 items-center justify-between border-b pl-4 pr-2 md:flex">
            <h2 className="text-sm font-medium">
              Extracted files{" "}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {extractedFiles.length}
              </span>
            </h2>
            <Button
              onClick={downloadProject}
              disabled={!extractedFiles.length}
              className="h-8 px-3 text-xs"
            >
              <Download className="size-3.5" />
              Download ZIP
            </Button>
          </div>
          <div
            className={cn(
              "relative grid min-h-0 flex-1 grid-cols-1",
              extractedFiles.length > 0 && "md:grid-cols-[200px_minmax(0,1fr)]"
            )}
          >
            {mobileFilesOpen && (
              <button
                aria-label="Close file sidebar"
                onClick={() => setMobileFilesOpen(false)}
                className="absolute inset-0 z-10 bg-black/20 md:hidden"
              />
            )}
            <aside
              aria-label="Project files"
              className={cn(
                "min-h-0 flex-col border-r bg-muted/25 p-3 md:static md:w-auto",
                extractedFiles.length > 0 ? "md:flex" : "md:hidden",
                mobileFilesOpen
                  ? "absolute inset-y-0 left-0 z-20 flex w-64 bg-card shadow-xl md:shadow-none"
                  : "hidden"
              )}
            >
              <button
                onClick={() => {
                  setReviewing(false)
                  setMobileFilesOpen(false)
                }}
                aria-pressed={!reviewing}
                className={cn(
                  "md:hidden flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-2",
                  !reviewing
                    ? "bg-primary/8 font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <FileText className="size-4 shrink-0" />
                Source text
              </button>
              <div className="mt-7 flex items-center justify-between px-3 text-[11px] font-medium text-muted-foreground md:hidden">
                <h2 className="text-xs">Files</h2>
                <span aria-live="polite" className="font-normal tabular-nums">
                  {extractedFiles.length}
                </span>
              </div>
              <div className="mt-2 min-h-0 flex-1 overflow-auto">
                {extractedFiles.length ? (
                  <Tree
                    data={treeItems}
                    selectedId={selectedItem?.id}
                    onSelectChange={handleSelectItem}
                    folderIcon={Folder}
                    itemIcon={FileText}
                  />
                ) : (
                  <p className="px-3 py-4 text-xs leading-5 text-muted-foreground">
                    Your files will appear here as you add text.
                  </p>
                )}
              </div>
              <div className="mt-3 border-t pt-3">
                {" "}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!extractedFiles.length}
                        aria-label="Rename files"
                        className="text-muted-foreground"
                      >
                        <span>Rename files</span>
                        <ChevronDown className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="min-w-48">
                    <DropdownMenuLabel>Filename style</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(
                      [
                        "none",
                        "camelCase",
                        "pascalCase",
                        "kebabCase",
                        "snakeCase",
                      ] as const
                    ).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => transformAllPaths(type)}
                      >
                        {type === "none"
                          ? "Original names"
                          : type === "pascalCase"
                            ? "PascalCase"
                            : type === "kebabCase"
                              ? "kebab-case"
                              : type === "snakeCase"
                                ? "snake_case"
                                : type}
                        {transformType === type && (
                          <Check className="ml-auto size-3.5" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </aside>
            <div className="relative flex min-h-0 min-w-0 flex-col">
              <div
                className={cn(
                  "min-h-0 flex-1 flex-col md:hidden",
                  !reviewing || !selectedItem ? "flex" : "hidden"
                )}
              >
                {sourceEditor}
              </div>
              <div
                className={cn(
                  "min-h-0 flex-1 flex-col md:flex",
                  reviewing && selectedItem ? "flex" : "hidden"
                )}
              >
                {filePreview}
              </div>
              {extractionSuccess && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
                  <BorderBeam
                    duration={1.2}
                    size={180}
                    colorFrom="#a3a3a3"
                    colorTo="#737373"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={onClick}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
function EditorLoading() {
  return (
    <div className="p-5 text-xs text-muted-foreground">Loading editor…</div>
  )
}
