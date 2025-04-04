"use client"

import React, { useEffect, useRef, useState } from "react"
import Editor, { OnMount } from "@monaco-editor/react"
import { saveAs } from "file-saver"
import { AnimationControls, motion, useAnimation } from "framer-motion" // Added for animation
import JSZip from "jszip"
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  File,
  FileText,
  Folder,
  FolderTree,
  Package,
  RefreshCw,
} from "lucide-react"
import * as monaco from "monaco-editor"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tree } from "@/components/ui/tree"
import { BorderBeam } from "@/components/magicui/border-beam"
import { Shell } from "@/components/shells/shell"

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
  | "camelCase"
  | "kebabCase"
  | "snakeCase"
  | "pascalCase"
  | "none"

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
  path = path.replace(/^\*\*`?|\*\*$|^`|`$/g, "")
  path = path.replace(/\s*\([^)]*\)\s*$/, "").trim()
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
    if (node.type === "file" && node.content) {
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

const AnimatedArrowRight: React.FC<AnimatedArrowProps> = ({
  className,
  inputContent,
}) => {
  const controls: AnimationControls = useAnimation()
  useEffect(() => {
    const animateArrow = async (): Promise<void> => {
      await controls.start({ x: 5, transition: { duration: 0.2 } })
      await controls.start({ x: 0, transition: { duration: 0.2 } })
    }
    if (inputContent) {
      animateArrow()
    }
  }, [inputContent, controls])
  return (
    <motion.div animate={controls}>
      <ArrowRight className={className} />
    </motion.div>
  )
}

const AnimatedArrowDown: React.FC<AnimatedArrowProps> = ({
  className,
  inputContent,
}) => {
  const controls: AnimationControls = useAnimation()
  useEffect(() => {
    const animateArrow = async (): Promise<void> => {
      await controls.start({ y: 5, transition: { duration: 0.2 } })
      await controls.start({ y: 0, transition: { duration: 0.2 } })
    }
    if (inputContent) {
      animateArrow()
    }
  }, [inputContent, controls])
  return (
    <motion.div animate={controls}>
      <ArrowDown className={className} />
    </motion.div>
  )
}

// --- Main Component ---
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
  const [hasContent, setHasContent] = useState<boolean>(false)
  const [extractionSuccess, setExtractionSuccess] = useState<boolean>(false) // For beam effect
  const [copyButtonClicked, setCopyButtonClicked] = useState<string | null>(
    null
  ) // Track which copy button

  const { theme } = useTheme()

  const isInitialLoad = useRef(true)
  const inputEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  )

  const PANEL_HEIGHT = "calc(100vh - 300px)" // Adjusted height slightly
  const MIN_PANEL_HEIGHT = "550px" // Adjusted min height

  const treeItems = React.useMemo(
    () => convertToTreeItems(fileTree.children),
    [fileTree]
  )

  // Set editor theme based on app theme setting
  useEffect(() => {
    // Use the app's theme setting instead of just system preference
    setEditorTheme(theme === "dark" ? "vs-dark" : "light")
  }, [theme])

  // Load saved data from localStorage
  useEffect(() => {
    const savedInput = localStorage.getItem("code-extractor-input")
    if (savedInput) {
      setInputContent(savedInput)
      setHasContent(savedInput.trim().length > 0)
    }
    const savedFiles = localStorage.getItem("code-extractor-files")
    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExtractedFiles(parsed)
          buildFileTree(parsed)
        }
      } catch (e) {
        console.error("Failed to parse saved files:", e)
      }
    }
    const savedTransform = localStorage.getItem("code-extractor-transform")
    if (savedTransform) {
      try {
        setTransformType(savedTransform as TransformType)
      } catch (e) {
        console.error("Failed to parse transform type:", e)
      }
    }
    isInitialLoad.current = false
  }, [])

  // Save input to localStorage
  useEffect(() => {
    if (!isInitialLoad.current)
      localStorage.setItem("code-extractor-input", inputContent)
    setHasContent(inputContent.trim().length > 0)
  }, [inputContent])

  // Save files to localStorage
  useEffect(() => {
    if (!isInitialLoad.current)
      localStorage.setItem(
        "code-extractor-files",
        JSON.stringify(extractedFiles)
      )
  }, [extractedFiles])

  // Save transform preference
  useEffect(() => {
    if (!isInitialLoad.current)
      localStorage.setItem("code-extractor-transform", transformType)
  }, [transformType])

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
  const handleInputChange = (content: string | undefined) => {
    const newContent = content || ""
    setInputContent(newContent)
    try {
      let newFiles = extractFilesFromText(newContent)

      // Apply current transformation if needed (before building tree)
      if (transformType !== "none") {
        newFiles = newFiles.map((file) => ({
          ...file,
          path: transformPath(cleanFilePath(file.path), transformType), // Clean first
        }))
        // Note: Import updates happen *during* transformAllPaths, not here.
        // If needed immediately, call updateImportsAcrossFiles here.
      } else {
        // Ensure paths are cleaned even if no transform is active
        newFiles = newFiles.map((file) => ({
          ...file,
          path: cleanFilePath(file.path),
        }))
      }

      setExtractedFiles(newFiles)
      buildFileTree(newFiles)

      if (newFiles.length > 0) {
        setExtractionSuccess(true)
        setTimeout(() => setExtractionSuccess(false), 750) // Trigger beam effect
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

  // Transform all paths
  const transformAllPaths = (transform: TransformType) => {
    if (extractedFiles.length === 0) return
    const originalFiles = [...extractedFiles]
    let transformedFiles = extractedFiles.map((file) => ({
      ...file,
      path:
        transform === "none"
          ? cleanFilePath(file.path)
          : transformPath(cleanFilePath(file.path), transform),
    }))

    transformedFiles = updateImportsAcrossFiles(originalFiles, transformedFiles)
    setExtractedFiles(transformedFiles)
    buildFileTree(transformedFiles)
    setTransformType(transform)

    if (selectedItem) {
      const updatedSelectedItem = transformedFiles.find(
        (f) => f.id === selectedItem.id
      )
      if (updatedSelectedItem) {
        handleSelectItem({
          ...selectedItem,
          id: updatedSelectedItem.id,
          path: updatedSelectedItem.path,
          content: updatedSelectedItem.content,
          name: updatedSelectedItem.path.split("/").pop() || "",
          language: getLanguageFromFilename(
            updatedSelectedItem.path.split("/").pop() || ""
          ),
        })
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
    handleInputChange(demoContent) // Process demo content
    setTransformType("none") // Reset transform for demo
    setSelectedItem(null)
    toast.success("Demo content loaded")
  }

  // Copy file content
  const copyFileContent = (content: string, itemId: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopyButtonClicked(itemId)
        toast.success("Copied to clipboard")
        setTimeout(() => setCopyButtonClicked(null), 1000) // Reset after 1s
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
  const getAllFilesInFolder = (folderPath: string): ExtractedFile[] => {
    // Simple filter based on path prefix for now
    return extractedFiles.filter(
      (file) =>
        file.path.startsWith(folderPath + "/") && file.path !== folderPath
    )
  }

  // Download folder as zip
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
      toast.error("No files found in this folder to zip")
      return
    }

    try {
      const blob = await zip.generateAsync({ type: "blob" })
      saveAs(blob, `${folderName || "folder"}.zip`)
      toast.success(
        `Downloaded ${folderName || "folder"} as zip (${filesAdded} files)`
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
        `Downloaded Project as ZIP (${extractedFiles.length} files)`
      )
    } catch (error) {
      console.error("Failed to create zip:", error)
      toast.error("Failed to create zip file")
    }
  }

  // Handle item selection
  const handleSelectItem = (item: TreeItem | null) => {
    if (!item) {
      setSelectedItem(null)
      return
    }

    setSelectedItem({
      path: item.path || "",
      type: item.type || "file", // Default to file if type missing
      content: item.content,
      language: item.language,
      id: item.id, // Pass ID for copy button state
    })
  }

  // Get all files and folders in a directory
  const getContentsInFolder = (
    folderPath: string
  ): {
    fileCount: number
    folderCount: number
  } => {
    // Find all direct child files
    const files = extractedFiles.filter((file) => {
      const parentPath = file.path.substring(0, file.path.lastIndexOf("/"))
      return parentPath === folderPath
    })

    // Find all direct child folders (unique parent paths)
    const childFolderPaths = new Set<string>()
    extractedFiles.forEach((file) => {
      if (file.path.startsWith(folderPath + "/")) {
        const remainingPath = file.path.substring(folderPath.length + 1)
        const nextSegment = remainingPath.split("/")[0]
        if (nextSegment) {
          childFolderPaths.add(`${folderPath}/${nextSegment}`)
        }
      }
    })

    return {
      fileCount: files.length,
      folderCount: childFolderPaths.size,
    }
  }

  // Add a handler for the input editor mounting
  const handleInputEditorDidMount: OnMount = (editor, monaco) => {
    inputEditorRef.current = editor

    // Configure Monaco to ignore certain TypeScript errors
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [7027, 6133, 6196], // Ignore unreachable code & unused var warnings
    })

    // Configure Markdown settings to be less strict
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [7027, 6133, 6196],
    })

    // If there's saved content that should be loaded on component mount
    if (inputContent && !isInitialLoad.current) {
      editor.setValue(inputContent)
    }
  }

  return (
    <Shell className="space-y-4">
      <div className="flex flex-col relative">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 w-full">
          {/* Input Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <span>Input</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePaste}
                        className="h-8 px-3 text-xs gap-1.5"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Paste</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Paste from Clipboard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadDemo}
                        className="h-8 px-3 text-xs gap-1.5"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Demo</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Load Example Content</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="relative">
              <Card
                className={cn(
                  "relative overflow-hidden border-muted-foreground/10 shadow-sm",
                  "bg-card", // Simpler background
                  hasContent && "border-primary/20"
                )}
                style={{ height: PANEL_HEIGHT, minHeight: MIN_PANEL_HEIGHT }}
              >
                <CardContent className="p-0 h-full">
                  {/* Replace ScrollArea and Textarea with Editor */}
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    value={inputContent}
                    onChange={handleInputChange}
                    onMount={handleInputEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      wordWrap: "on",
                      lineNumbers: "off",
                      folding: true,
                      renderLineHighlight: "none",
                      occurrencesHighlight: "off",
                      scrollbar: {
                        alwaysConsumeMouseWheel: false,
                        vertical: "auto",
                        horizontal: "auto",
                      },
                      renderValidationDecorations: "off",
                      overviewRulerLanes: 0,
                      padding: { top: 16, bottom: 16 },
                      cursorBlinking: "solid",
                      lineHeight: 1.5,
                    }}
                    theme={editorTheme}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center Arrow Column */}
          <div className="flex items-center justify-center h-full">
            <div
              className={cn(
                "flex flex-col items-center justify-center",
                !hasContent && "opacity-50"
              )}
            >
              <div className="hidden lg:flex">
                <AnimatedArrowRight
                  className="h-6 w-6 text-primary"
                  inputContent={inputContent}
                />
              </div>
              <AnimatedArrowDown
                className="h-6 w-6 text-primary/80 lg:hidden"
                inputContent={inputContent}
              />
            </div>
          </div>

          {/* File Explorer & Editor Split View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <span>Files</span>
                <span className="text-sm font-normal text-muted-foreground truncate">
                  ({extractedFiles.length} extracted)
                </span>
              </h2>
              <div className="flex items-center gap-1.5">
                {extractedFiles.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs gap-1.5"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {transformType === "none"
                                ? "Rename Files"
                                : transformType === "camelCase"
                                  ? "camelCase"
                                  : transformType === "pascalCase"
                                    ? "PascalCase"
                                    : transformType === "kebabCase"
                                      ? "kebab-case"
                                      : transformType === "snakeCase"
                                        ? "snake_case"
                                        : "Rename Files"}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="flex flex-col">
                            <span>Rename File Format</span>
                            <span className="font-normal text-xs text-muted-foreground mt-1">
                              Changes naming style & updates imports
                            </span>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {[
                            "camelCase",
                            "pascalCase",
                            "kebabCase",
                            "snakeCase",
                          ].map((type) => (
                            <DropdownMenuItem
                              key={type}
                              onClick={() =>
                                transformAllPaths(type as TransformType)
                              }
                              className={cn(
                                transformType === type &&
                                  "bg-accent font-medium text-accent-foreground",
                                "flex items-center justify-between"
                              )}
                            >
                              {type === "camelCase"
                                ? "camelCase"
                                : type === "pascalCase"
                                  ? "PascalCase"
                                  : type === "kebabCase"
                                    ? "kebab-case"
                                    : "snake_case"}
                              {transformType === type && (
                                <span className="ml-2 text-xs opacity-70">
                                  ✓
                                </span>
                              )}
                            </DropdownMenuItem>
                          ))}
                          {transformType !== "none" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => transformAllPaths("none")}
                              >
                                Reset to Original
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <TooltipContent side="bottom" className="max-w-[220px]">
                        Change files/folders naming style (camelCase,
                        kebab-case, etc.) with automatic import path updates
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadProject}
                        disabled={extractedFiles.length === 0}
                        className={cn(
                          "h-8 px-3 text-xs gap-1.5",
                          "border-primary/30 hover:border-primary/60 transition-colors"
                        )}
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          Download Project
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download all files as .zip</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="relative">
              <Card
                className={cn(
                  "overflow-hidden border-muted-foreground/10 shadow-sm",
                  "bg-card" // Simpler background
                )}
                style={{ height: PANEL_HEIGHT, minHeight: MIN_PANEL_HEIGHT }}
              >
                <CardContent className="p-0 h-full">
                  <div className="grid grid-cols-5 h-full">
                    {/* Using grid for split */}
                    {/* File Tree */}
                    <div className="col-span-2 border-r border-border/50 overflow-hidden">
                      {extractedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                          <FolderTree className="h-10 w-10 mb-3 opacity-50" />
                          <p className="text-sm font-medium">
                            No files extracted
                          </p>
                          <p className="text-xs mt-1 max-w-[200px] opacity-80">
                            Paste content in the left panel to see the file
                            structure here.
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-full w-full">
                          <Tree
                            data={treeItems}
                            onSelectChange={handleSelectItem}
                            folderIcon={Folder}
                            itemIcon={FileText}
                            className="p-2" // Add padding inside scroll area
                          />
                        </ScrollArea>
                      )}
                    </div>
                    {/* Monaco Editor or Folder View */}
                    <div className="col-span-3 h-full bg-muted/20">
                      {/* Subtle background difference */}
                      {selectedItem ? (
                        selectedItem.type === "file" && selectedItem.id ? ( // Check for ID
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5 bg-background">
                              {/* File header */}
                              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                <FileText className="h-4 w-4 flex-shrink-0 text-primary/80" />
                                <span
                                  className="font-mono text-xs truncate"
                                  title={selectedItem.path}
                                >
                                  {selectedItem.path.split("/").pop()}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        selectedItem.content &&
                                        copyFileContent(
                                          selectedItem.content,
                                          selectedItem.id!
                                        )
                                      }
                                      className="h-7 w-7"
                                    >
                                      <div className="w-3.5 h-3.5 relative flex items-center justify-center">
                                        <Check
                                          size={14}
                                          className={cn(
                                            "absolute transition-all",
                                            copyButtonClicked ===
                                              selectedItem.id
                                              ? "opacity-100 scale-100 text-green-500"
                                              : "opacity-0 scale-0"
                                          )}
                                        />
                                        <Copy
                                          size={14}
                                          className={cn(
                                            "absolute transition-all",
                                            copyButtonClicked ===
                                              selectedItem.id
                                              ? "opacity-0 scale-0"
                                              : "opacity-100 scale-100"
                                          )}
                                        />
                                      </div>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy Content</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        selectedItem.content &&
                                        downloadFile(
                                          selectedItem.path,
                                          selectedItem.content
                                        )
                                      }
                                      className="h-7 w-7"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download File</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              {/* Editor takes remaining space */}
                              <Editor
                                height="100%"
                                language={selectedItem.language}
                                value={selectedItem.content}
                                theme={editorTheme}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  fontSize: 13,
                                  wordWrap: "off", // Default off
                                  scrollbar: {
                                    vertical: "auto",
                                    horizontal: "auto",
                                  },
                                }}
                              />
                            </div>
                          </div>
                        ) : selectedItem.type === "folder" ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                            <Folder className="h-12 w-12 mb-4 text-blue-500/70" />
                            <p className="text-base font-medium mb-1 text-foreground">
                              {selectedItem.path.split("/").pop() ||
                                "Project Root"}
                            </p>
                            <p className="text-xs mb-4">
                              {(() => {
                                const { fileCount, folderCount } =
                                  getContentsInFolder(selectedItem.path)
                                const fileTxt =
                                  fileCount === 1 ? "file" : "files"
                                const folderTxt =
                                  folderCount === 1 ? "folder" : "folders"

                                if (fileCount === 0 && folderCount === 0) {
                                  return "Empty folder"
                                }

                                if (fileCount === 0) {
                                  return `Contains ${folderCount} ${folderTxt}`
                                }

                                if (folderCount === 0) {
                                  return `Contains ${fileCount} ${fileTxt}`
                                }

                                return `Contains ${fileCount} ${fileTxt} and ${folderCount} ${folderTxt}`
                              })()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                downloadFolderAsZip(
                                  selectedItem.path,
                                  selectedItem.path.split("/").pop() || "folder"
                                )
                              }
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" /> Download Folder
                              (.zip)
                            </Button>
                          </div>
                        ) : null // Handle potential invalid state
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                          <File className="h-10 w-10 mb-3 opacity-50" />
                          <p className="text-sm font-medium">
                            Select a file or folder
                          </p>
                          <p className="text-xs mt-1 max-w-[200px] opacity-80">
                            Click an item in the file explorer on the left to
                            view its content or actions.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Output Beam effect */}
              <div
                className={cn(
                  "absolute overflow-hidden inset-0 transition-opacity duration-500 pointer-events-none",
                  extractionSuccess ? "opacity-100" : "opacity-0"
                )}
              >
                <BorderBeam
                  duration={3}
                  size={300}
                  className="from-purple-500 via-blue-500 to-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
