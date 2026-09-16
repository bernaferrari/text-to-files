"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react"

import { cn } from "@/lib/utils"

type TreeItem = {
  id: string
  name: string
  icon?: React.ElementType
  children?: TreeItem[]
}

type TreeProps = {
  data: TreeItem[]
  initialSelectedItemId?: string
  selectedId?: string | null
  onSelectChange?: (item: TreeItem | null) => void
  folderIcon?: React.ElementType
  itemIcon?: React.ElementType
  className?: string
}

export function Tree({
  data,
  initialSelectedItemId,
  selectedId,
  onSelectChange,
  folderIcon: FolderIcon = Folder,
  itemIcon: ItemIcon = File,
  className,
}: TreeProps) {
  // Use internal state only if selectedId is not provided
  const [internalSelectedId, setInternalSelectedId] = React.useState<
    string | null
  >(initialSelectedItemId || null)

  // Use the controlled value if provided, otherwise use internal state
  const effectiveSelectedId =
    selectedId !== undefined ? selectedId : internalSelectedId

  const handleSelectItem = (item: TreeItem) => {
    // Only update internal state if we're not in controlled mode
    if (selectedId === undefined) {
      setInternalSelectedId(item.id)
    }

    if (onSelectChange) {
      onSelectChange(item)
    }
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="overflow-y-auto pb-10">
        {data.map((item) => (
          <TreeItem
            key={item.id}
            item={item}
            selectedItemId={effectiveSelectedId}
            onSelectItem={handleSelectItem}
            FolderIcon={FolderIcon}
            ItemIcon={ItemIcon}
          />
        ))}
      </div>
    </div>
  )
}

type TreeItemProps = {
  item: TreeItem
  selectedItemId: string | null
  onSelectItem: (item: TreeItem) => void
  FolderIcon: React.ElementType
  ItemIcon: React.ElementType
  level?: number
}

function TreeItem({
  item,
  selectedItemId,
  onSelectItem,
  FolderIcon,
  ItemIcon,
  level = 0,
}: TreeItemProps) {
  const [expanded, setExpanded] = React.useState(true)
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedItemId === item.id
  const Icon = item.icon || (hasChildren ? FolderIcon : ItemIcon)

  const handleToggleExpand = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-md select-none",
          isSelected ? "bg-primary/8 text-foreground" : "hover:bg-accent/50",
          level === 0 ? "mt-1" : "mt-0.5"
        )}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.name}`}
            aria-expanded={expanded}
            className="rounded hover:bg-muted w-6 h-8 shrink-0 flex items-center justify-center focus-visible:outline-2"
            onClick={handleToggleExpand}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelectItem(item)}
          aria-pressed={isSelected}
          title={item.name}
          className="flex min-w-0 flex-1 items-center py-2 pr-2 text-left focus-visible:outline-2"
        >
          <Icon
            className="h-4 w-4 mr-2 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-[13px] truncate">{item.name}</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {item.children!.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
              FolderIcon={FolderIcon}
              ItemIcon={ItemIcon}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
