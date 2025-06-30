"use client"

import { useEffect, useState } from "react"
import { todoInfoAtom, TodosInfo } from "@/context/data"
import {
  deleteTodoFromLocalStore,
  getAllSavedTodosIDB,
  saveTodoIDB,
  updateTodoInLocalStore,
} from "@/utils/idb.util"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSetAtom } from "jotai"
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Form, FormControl, FormField, FormItem } from "./ui/form"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"

export interface TodoItemType {
  id: string
  title: string
  isDone: boolean
  createdAt: Date
}

// Form validation schema
const todoFormSchema = z.object({
  title: z
    .string()
    .min(1, "Todo cannot be empty")
    .max(200, "Todo must be less than 200 characters")
    .trim(),
})

type TodoFormValues = z.infer<typeof todoFormSchema>

interface TodoInputProps {
  onTodoAdded: (todo: TodoItemType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Todo() {
  // Global State
  const setTodoStat = useSetAtom(todoInfoAtom)

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

  useEffect(() => {
    // Function that runs every time todo is created to update its stats
    ;(() => {
      if (Array.isArray(todos) && todos.length === 0) return
      if (!Array.isArray(todos)) return
      let completedTodo = 0
      const totalTodos = todos.length
      todos.map((todo) => todo.isDone && completedTodo++)

      const updatedTodoStat: TodosInfo = {
        completed: completedTodo,
        total: totalTodos,
      }

      setTodoStat(updatedTodoStat)
    })()
  }, [todos])

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
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
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
        <ScrollArea className="h-full max-h-72 lg:max-h-full">
          <div className="py-2">
            <AnimatePresence mode="wait">
              {filteredTodos.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {searchQuery
                      ? "No todos match your search"
                      : "No todos yet"}
                  </div>
                  {!searchQuery && (
                    <div className="mt-1 text-xs text-[var(--muted-foreground)] opacity-70">
                      Add one above to get started
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="todo-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <AnimatePresence>
                    {filteredTodos.map((todo, index) => (
                      <TodoItem
                        key={todo.id}
                        id={todo.id}
                        isDone={todo.isDone}
                        title={todo.title}
                        onToggle={handleTodoToggle}
                        onDelete={handleTodoDelete}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: "",
    },
  })

  const onSubmit = async (values: TodoFormValues) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const newTodo: TodoItemType = {
        id: crypto.randomUUID(),
        title: values.title,
        isDone: false,
        createdAt: new Date(),
      }

      await saveTodoIDB(newTodo)
      onTodoAdded(newTodo)
      form.reset()
    } catch (error) {
      console.error("Failed to add todo:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }

  return (
    <div className="space-y-3 pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Add a new todo..."
                        {...field}
                        onKeyDown={handleKeyDown}
                        className={cn(
                          "border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]",
                          "pr-10 placeholder:text-[var(--muted-foreground)]",
                          "transition-all duration-200 ease-in-out",
                          "focus:border-[var(--ring)] focus:bg-[var(--input)] focus:text-[var(--foreground)] focus:ring-1 focus:ring-[var(--ring)]",
                          "hover:border-[var(--ring)]",
                          "[&:focus]:text-[var(--foreground)] [&:focus]:placeholder:text-[var(--muted-foreground)]",
                          form.formState.errors.title &&
                            "border-[var(--destructive)]"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isSubmitting || !form.watch("title")?.trim()}
                size="sm"
                variant="ghost"
                className={cn(
                  "absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0",
                  "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  "hover:border-[var(--border)] hover:bg-[var(--accent)]",
                  "transition-all duration-200 ease-in-out"
                )}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search todos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]",
            "pl-9 placeholder:text-[var(--muted-foreground)]",
            "transition-all duration-200 ease-in-out",
            "focus:border-[var(--ring)] focus:bg-[var(--input)] focus:text-[var(--foreground)] focus:ring-1 focus:ring-[var(--ring)]",
            "hover:border-[var(--ring)]",
            "[&:focus]:text-[var(--foreground)] [&:focus]:placeholder:text-[var(--muted-foreground)]"
          )}
        />
      </div>
    </div>
  )
}

interface TodoItemProps {
  id: string
  isDone: boolean
  title: string
  index: number
  onToggle: (id: string, isDone: boolean) => void
  onDelete: (id: string) => void
}

export function TodoItem({
  id,
  isDone,
  title,
  index,
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
      setIsChecked(!checked)
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
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: index * 0.05,
          duration: 0.3,
          ease: "easeOut",
        },
      }}
      exit={{
        opacity: 0,
        x: -100,
        scale: 0.95,
        transition: {
          duration: 0.2,
          ease: "easeIn",
        },
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5",
        "border border-transparent transition-all duration-200 ease-in-out",
        "hover:border-[var(--border)] hover:bg-[var(--card)]",
        isChecked && "opacity-60",
        isDeleting && "pointer-events-none opacity-30"
      )}
    >
      <motion.div
        animate={isChecked ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Checkbox
          checked={isChecked}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          className={cn(
            "border-[var(--border)] transition-all duration-200",
            "data-[state=checked]:border-[var(--todo-completed)]",
            "data-[state=checked]:bg-[var(--todo-completed)] data-[state=checked]:text-[var(--background)]",
            "hover:border-[var(--ring)]"
          )}
        />
      </motion.div>
      <motion.span
        animate={isChecked ? { x: 10 } : { x: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex-1 text-sm leading-relaxed transition-all duration-200",
          isChecked
            ? "text-[var(--muted-foreground)] line-through opacity-60"
            : "text-[var(--foreground)]"
        )}
      >
        {title}
      </motion.span>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 p-0 opacity-0 transition-all duration-200 ease-in-out",
            "group-hover:opacity-100",
            "text-[var(--muted-foreground)] hover:text-[var(--destructive)]",
            "hover:border-[var(--border)] hover:bg-[var(--card)]",
            "border border-transparent"
          )}
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
