"use client"

import { useEffect, useState } from "react"
import {
  deleteTodoFromLocalStore,
  getAllSavedTodosIDB,
  saveTodoIDB,
  updateTodoInLocalStore,
} from "@/utils/idb.util"
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"

export interface TodoItemType {
  id: string
  title: string
  isDone: boolean
  createdAt: Date
}

interface TodoInputProps {
  onTodoAdded: (todo: TodoItemType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Todo() {
  const [todos, setTodos] = useState<TodoItemType[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const savedTodos = await getAllSavedTodosIDB()
        setTodos(savedTodos)
      } catch (error) {
        console.error("Failed to load todos:", error)
      }
    })()
  }, [])

  // Filter todos based on search query
  const filteredTodos = todos.filter((todo) =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTodoAdded = (newTodo: TodoItemType) => {
    setTodos((prev) => [newTodo, ...prev])
  }

  const handleTodoToggle = (id: string, isDone: boolean) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, isDone } : todo))
    )
  }

  const handleTodoDelete = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 pb-1">
        <h2 className="text-[var (--foreground)] mb-4 text-lg font-semibold">
          Todos
        </h2>
        <TodoInput
          onTodoAdded={handleTodoAdded}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Todo List - Scrollable area that takes remaining space */}
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-sm text-gray-400">
                  {searchQuery ? "No todos match your search" : "No todos yet"}
                </div>
                {!searchQuery && (
                  <div className="mt-1 text-xs text-gray-300">
                    Add one above to get started
                  </div>
                )}
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  id={todo.id}
                  isDone={todo.isDone}
                  title={todo.title}
                  onToggle={handleTodoToggle}
                  onDelete={handleTodoDelete}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function TodoInput({
  onTodoAdded,
  searchQuery,
  onSearchChange,
}: TodoInputProps) {
  const [input, setInput] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const todoInputSubmit = async () => {
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const newTodo: TodoItemType = {
        id: crypto.randomUUID(),
        title: input.trim(),
        isDone: false,
        createdAt: new Date(),
      }

      await saveTodoIDB(newTodo)
      onTodoAdded(newTodo)
      setInput("")
    } catch (error) {
      console.error("Failed to add todo:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      todoInputSubmit()
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Add Todo Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Add a new todo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-none bg-gray-50/50 pr-10 transition-all duration-200 focus:bg-white focus:ring-1 focus:ring-gray-200"
          />
          <Button
            onClick={todoInputSubmit}
            disabled={!input.trim() || isSubmitting}
            size="sm"
            variant="ghost"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0 hover:bg-gray-100"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search todos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-none bg-gray-50/50 pl-9 transition-all duration-200 focus:bg-white focus:ring-1 focus:ring-gray-200"
        />
      </div>
    </div>
  )
}

interface TodoItemProps {
  id: string
  isDone: boolean
  title: string
  onToggle: (id: string, isDone: boolean) => void
  onDelete: (id: string) => void
}

export function TodoItem({
  id,
  isDone,
  title,
  onToggle,
  onDelete,
}: TodoItemProps) {
  const [isChecked, setIsChecked] = useState(isDone)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async (checked: boolean) => {
    if (isUpdating) return

    setIsUpdating(true)
    setIsChecked(checked)

    try {
      await updateTodoInLocalStore(id, { isDone: checked })
      onToggle(id, checked)
    } catch (error) {
      console.error("Failed to update todo:", error)
      setIsChecked(!checked) // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      await deleteTodoFromLocalStore(id)
      onDelete(id)
    } catch (error) {
      console.error("Failed to delete todo:", error)
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
        "hover:border-[var (--border)] hover:bg-[var (--hover-bg-subtle)] border border-transparent",
        isChecked && "opacity-60",
        isDeleting && "pointer-events-none opacity-30"
      )}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className={cn(
          "border-[var (--border)] data-[state=checked]:border-[var (--todo-completed)]",
          "data-[state=checked]:bg-[var (--todo-completed)] data-[state=checked]:text-[var (--background)]"
        )}
      />
      <span
        className={cn(
          "flex-1 text-sm leading-relaxed transition-all duration-200",
          isChecked
            ? "text-[var (--muted-foreground)] line-through opacity-60"
            : "text-[var (--foreground)]"
        )}
      >
        {title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 p-0 opacity-0 transition-all duration-200",
          "hover:bg-[var (--hover-bg)] group-hover:opacity-100",
          "hover:border-[var (--border)] hover:text-[var (--destructive)] border border-transparent"
        )}
        disabled={isDeleting}
        onClick={handleDelete}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  )
}
