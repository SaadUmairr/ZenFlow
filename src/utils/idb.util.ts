"use client"

import { VideoItem } from "@/data/lofi"
import { IDBPDatabase, openDB } from "idb"

import { SessionData } from "@/components/stopwatch"
import { TodoItemType } from "@/components/todo"

const DB_NAME = "lofi"
const DB_VERSION = 1

export const STORES = ["session", "video", "goal", "todo"] as const
const STORE_KEY = "items"

export type IDB_STORES = (typeof STORES)[number]

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        STORES.forEach((STORE) => {
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE)
          }
        })
      },
    })
  }
  return dbPromise
}

export async function appendToLocalStore(
  storeName: IDB_STORES,
  values: string
) {
  const db = await getDB()
  const tx = db.transaction(storeName, "readwrite")
  const store = tx.objectStore(storeName)

  const existingValues = (await store.get(STORE_KEY)) || []
  const parsedValue = JSON.parse(values)
  const updatedValues = [...existingValues, parsedValue]

  await store.put(updatedValues, STORE_KEY)
  await tx.done
}

export async function readFromLocalStore(storeName: IDB_STORES) {
  const db = await getDB()
  const tx = db.transaction(storeName, "readonly")
  const store = tx.objectStore(storeName)

  const data = await store.get(STORE_KEY)
  await tx.done

  return data || []
}

export async function getAllVideoList(): Promise<VideoItem[]> {
  const db = await getDB()
  const tx = db.transaction("video", "readonly")
  const store = tx.objectStore("video")

  const data = await store.get(STORE_KEY)
  await tx.done

  return data || []
}

export async function updateVideoList({
  title,
  url,
}: VideoItem): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction("video", "readwrite")
    const store = tx.objectStore("video")

    const existing = (await store.get(STORE_KEY)) || []
    const updated = [...existing, { title, url }]

    await store.put(updated, STORE_KEY)
    await tx.done
  } catch (error) {
    console.error(`FAILED TO UPDATE: ${(error as Error).message}`)
  }
}

export async function deleteVideoFromList(id: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction("video", "readwrite")
    const store = tx.objectStore("video")

    const existing = ((await store.get(STORE_KEY)) as VideoItem[]) || []
    const updated = existing.filter((video) => video.url !== id)

    await store.put(updated, STORE_KEY)
    await tx.done
  } catch (error) {
    console.error(`FAILED TO UPDATE: ${(error as Error).message}`)
  }
}

export async function getDailyGoalIDB() {
  const db = await getDB()
  const tx = db.transaction("goal", "readonly")
  const store = tx.objectStore("goal")

  const data = await store.get(STORE_KEY)
  await tx.done

  return data ?? null
}

export async function setDailyGoalIDB(goal: number) {
  const db = await getDB()
  const tx = db.transaction("goal", "readwrite")
  const store = tx.objectStore("goal")

  await store.put(goal, STORE_KEY)
  await tx.done
}

export async function saveSessionDataIDB(data: SessionData) {
  try {
    const db = await getDB()
    const tx = db.transaction("session", "readwrite")
    const store = tx.objectStore("session")

    const existing = (await store.get(STORE_KEY)) || []
    const updated = [...existing, data]

    await store.put(updated, STORE_KEY)
    await tx.done
  } catch (error) {
    console.error("Failed to save session data", error)
  }
}

export async function getSavedSessionDataIDB(): Promise<SessionData[]> {
  try {
    const db = await getDB()
    const tx = db.transaction("session", "readonly")
    const store = tx.objectStore("session")

    const data = (await store.get(STORE_KEY)) as SessionData[]
    await tx.done

    return data || []
  } catch (error) {
    console.error("COULD NOT GET SESSION DATA", error)
    return []
  }
}

export async function getAllSavedTodosIDB(): Promise<TodoItemType[]> {
  try {
    const db = await getDB()
    const tx = db.transaction("todo", "readonly")
    const store = tx.objectStore("todo")

    const data = await store.get(STORE_KEY)

    await tx.done

    return data || []
  } catch {
    console.error("COULD NOT GET TODO DATA")
    return []
  }
}

export async function saveTodoIDB(data: TodoItemType): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction("todo", "readwrite")
    const store = tx.objectStore("todo")

    const existing = (await store.get(STORE_KEY)) || []
    const updated = [...existing, data]

    await store.put(updated, STORE_KEY)
    await tx.done
  } catch {
    console.error("Failed to save TODO data")
  }
}

// Update a specific todo item
export async function updateTodoInLocalStore(
  todoId: string,
  updates: Partial<Pick<TodoItemType, "title" | "isDone">>
): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction("todo", "readwrite")
    const storeObj = tx.objectStore("todo")

    const existing = (await storeObj.get("items")) as TodoItemType[] | undefined
    if (!Array.isArray(existing)) {
      throw new Error("No todos found")
    }

    const todoIndex = existing.findIndex((todo) => todo.id === todoId)
    if (todoIndex === -1) {
      throw new Error(`Todo with id "${todoId}" not found`)
    }

    // Update the todo item
    existing[todoIndex] = {
      ...existing[todoIndex],
      ...updates,
      // updatedAt: new Date(),
    }

    await storeObj.put(existing, "items")
    await tx.done
  } catch (err) {
    console.error(`Failed to update todo ${todoId}:`, err)
    throw new Error(`Could not update todo "${todoId}"`)
  }
}

// Delete a specific todo item
export async function deleteTodoFromLocalStore(todoId: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction("todo", "readwrite")
    const storeObj = tx.objectStore("todo")

    const existing = (await storeObj.get("items")) as TodoItemType[] | undefined
    if (!Array.isArray(existing)) {
      throw new Error("No todos found")
    }

    const filteredTodos = existing.filter((todo) => todo.id !== todoId)

    if (filteredTodos.length === existing.length) {
      throw new Error(`Todo with id "${todoId}" not found`)
    }

    await storeObj.put(filteredTodos, "items")
    await tx.done
  } catch (err) {
    console.error(`Failed to delete todo ${todoId}:`, err)
    throw new Error(`Could not delete todo "${todoId}"`)
  }
}

export async function clearStoreByName(storeName: IDB_STORES): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)

    await store.clear()

    await tx.done
  } catch {
    console.error("Couldnt clear data")
  }
}
