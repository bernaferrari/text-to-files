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
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md cursor-pointer select-none",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50",
          level === 0 ? "mt-1" : "mt-0.5"
        )}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={() => onSelectItem(item)}
      >
        {hasChildren ? (
          <div
            className="mr-1 rounded hover:bg-muted w-4 h-4 flex items-center justify-center"
            onClick={handleToggleExpand}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        ) : (
          <div className="mr-1 w-4" />
        )}
        <Icon
          className="h-4 w-4 mr-2 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm truncate">{item.name}</span>
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
