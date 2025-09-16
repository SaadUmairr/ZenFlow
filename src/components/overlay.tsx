"use client"

import { JSX, useCallback, useEffect, useRef, useState } from "react"
import {
  AllVideosListAtom,
  CurrentlyPlayingMediaAtom,
  dailyGoalAtom,
  isMediaPlayingAtom,
  isPomodoroBreakAtom,
  openAmbientDrawerAtom,
  showAbsoluteFocusAtom,
  timerAtom,
} from "@/context/data"
import { BREAK_ACTIVITIES, BREAK_QUOTES } from "@/data/lofi"
import {
  clearStoreByName,
  deleteVideoFromList,
  IDB_STORES,
  setDailyGoalIDB,
  STORES,
  updateVideoList,
} from "@/utils/idb.util"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  AudioLines,
  Coffee,
  ListMusicIcon,
  MenuIcon,
  MinusIcon,
  PauseIcon,
  PlayCircleIcon,
  PlusIcon,
  SettingsIcon,
  SquarePenIcon,
  TargetIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn, formatTimeMain } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ThemeDropdown } from "./theme-toggle"
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"

const ONE_HOUR = 60 * 60 * 1000
const MAX_FOCUS_TIME = 12 * ONE_HOUR

export function UserSettingNavButton({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  const storeClearHandler = async (name: IDB_STORES) => {
    try {
      await clearStoreByName(name)
    } catch {
      console.error("COULD NOT CLEAR DATA")
    }
  }

  const handleClearEverything = async () => {
    STORES.map(async (store) => storeClearHandler(store))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(className)}>
          <SettingsIcon className="h-4 w-4" />
          {label?.trim() ? (
            <p className="text-muted-foreground">{label}</p>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-[family-name:var(--font-geist-sans)]">
        {/* <DropdownMenuLabel>Settings</DropdownMenuLabel> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => storeClearHandler("session")}>
          Clear Stats
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => storeClearHandler("todo")}>
          Clear Todos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => storeClearHandler("video")}>
          Clear Video List
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-500"
          onClick={handleClearEverything}
        >
          Clear Everything
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type VideoItem = {
  title: string
  url: string
}

const youtubeVideoUrlRegex =
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+$/i

const musicYoutubeUrlRegex = /^(https?:\/\/)?(music\.youtube\.com)\/.+$/i

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Enter at least 3 characters",
  }),
  url: z
    .string()
    .url("Invalid URL format")
    .refine((val) => !musicYoutubeUrlRegex.test(val), {
      message:
        "Youtube Music URLs work in unexpected ways. Please use a regular YouTube video URL.",
    })
    .refine((val) => youtubeVideoUrlRegex.test(val), {
      message: "Must be a valid YouTube video URL.",
    }),
})

type SubmitFormData = z.infer<typeof formSchema>

interface VideoItemComponentProps {
  video: VideoItem
  onPlay: (video: VideoItem) => void
  onDelete: (videoId: string) => void
  index: number
  isPlaying?: boolean
}

function VideoItemComponent({
  video,
  onPlay,
  onDelete,
  index,
  isPlaying = false,
}: VideoItemComponentProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.2,
        delay: index * 0.03,
      }}
      className="group mb-3 font-[family-name:var(--font-geist-sans)]"
    >
      <div
        className={`flex items-center rounded-lg border p-3 transition-all duration-200 ${
          isPlaying
            ? "border-[--accent] bg-[--accent]/10"
            : "border-[--border] bg-transparent hover:border-[--muted] hover:bg-[--muted]/10"
        }`}
      >
        {/* Play button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPlay(video)}
          className={`mr-3 h-8 w-8 rounded-full p-0 ${
            isPlaying ? "text-[--accent]" : "text-[--muted-foreground]"
          }`}
        >
          {isPlaying ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayCircleIcon className="h-4 w-4" />
          )}
        </Button>

        {/* Video info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-[--foreground]">
            {video.title}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-[--muted-foreground]">
            <VideoIcon className="h-3 w-3" />
            <span>YouTube</span>
            {isPlaying && (
              <span className="ml-2 font-medium text-[--accent]">
                • Playing
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-[--muted-foreground] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-[--destructive]"
          onClick={() => onDelete(video.url)}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export function AddVideoDialog() {
  const form = useForm<SubmitFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  })
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [allChannels, setAllChannels] = useAtom(AllVideosListAtom)
  const [loading, setLoading] = useState<boolean>(false)

  const AddVideoHandler = async (values: SubmitFormData): Promise<void> => {
    if (loading) return
    try {
      setLoading(true)

      const alreadyExists = allChannels.find(
        (video) => video.url === values.url
      )

      if (alreadyExists) return

      setAllChannels((prev) => [
        ...prev,
        { title: values.title, url: values.url },
      ])

      await updateVideoList({ title: values.title, url: values.url })
    } catch {
    } finally {
      form.reset()
      setIsOpen(false)
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Video
        </Button>
      </DialogTrigger>
      <DialogContent className="font-[family-name:var(--font-geist-sans)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Video</DialogTitle>
          <DialogDescription>
            Enter the title and YouTube link for your video
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(AddVideoHandler)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="title">Video Title</Label>
                  <FormControl>
                    <Input
                      id="title"
                      placeholder="Enter video title..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="url">YouTube URL</Label>
                  <FormControl>
                    <Input
                      id="url"
                      placeholder="https://youtube.com/watch?v=..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add Video"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AllVideoPanel() {
  const [videos, setVideos] = useAtom(AllVideosListAtom)
  const [currentVideo, setCurrentVideo] = useAtom(CurrentlyPlayingMediaAtom)
  const isMediaPlaying = useAtomValue(isMediaPlayingAtom)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [removeAllDialog, setRemoveAllDialog] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const handlePlayVideo = (video: VideoItem) => {
    setCurrentVideo(video.url)
    setIsOpen(false)
  }

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideoFromList(videoId)
    setVideos((prev) => prev.filter((video) => video.url !== videoId))
  }

  const handleRemoveAll = () => {
    setVideos([])
    setRemoveAllDialog(false)
  }

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ListMusicIcon className="h-4 w-4 text-[var(--foreground)]" />
          </Button>
        </SheetTrigger>

        <SheetContent className="flex h-full w-full flex-col bg-[var(--popover)] p-0 font-[family-name:var(--font-geist-sans)] text-[var(--popover-foreground)] sm:max-w-lg">
          <div className="flex h-full flex-col">
            {/* Header - Fixed at top */}
            <div className="shrink-0 border-b border-[var(--border)] px-6 py-4">
              <SheetHeader className="space-y-2">
                <SheetTitle className="flex items-center gap-2 text-[var(--foreground)]">
                  <VideoIcon className="h-5 w-5 text-[var(--foreground)]" />
                  Video Library
                </SheetTitle>
                <SheetDescription className="text-[var(--muted-foreground)]">
                  Manage and play your saved YouTube videos
                </SheetDescription>
              </SheetHeader>

              {/* Search Bar */}
              {videos.length > 0 && (
                <div className="mt-4">
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 border-[var(--input)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <AddVideoDialog />
                {videos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRemoveAllDialog(true)}
                    className="gap-2 text-[var(--destructive)] hover:text-[oklch(0.6_0.25_27)]"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable Content - Takes remaining space */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-6 py-4">
                <AnimatePresence mode="wait">
                  {filteredVideos.length === 0 ? (
                    videos.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-12 text-center"
                      >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
                          <ListMusicIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
                        </div>
                        <h3 className="mb-2 font-medium text-[var(--foreground)]">
                          No videos yet
                        </h3>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Add some videos to get started
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-12 text-center"
                      >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
                          <XIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          No videos match your search
                        </p>
                      </motion.div>
                    )
                  ) : (
                    <motion.div
                      key="video-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <AnimatePresence>
                        {filteredVideos.map((video, index) => (
                          <VideoItemComponent
                            key={video.url}
                            video={video}
                            onPlay={handlePlayVideo}
                            onDelete={handleDeleteVideo}
                            index={index}
                            isPlaying={
                              currentVideo === video.url && isMediaPlaying
                            }
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            {videos.length > 0 && (
              <div className="shrink-0 border-t border-[var(--border)] px-6 py-3">
                <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                  <span>
                    {filteredVideos.length} of {videos.length} video
                    {videos.length !== 1 ? "s" : ""}
                  </span>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="h-auto p-1 text-xs text-[var(--foreground)]"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Remove All Dialog */}
      <Dialog open={removeAllDialog} onOpenChange={setRemoveAllDialog}>
        <DialogContent className="border-[var(--border)] bg-[var(--popover)] font-[family-name:var(--font-geist-sans)] text-[var(--popover-foreground)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--destructive)]">
              <Trash2Icon className="h-5 w-5" />
              Remove All Videos?
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              This will permanently delete all {videos.length} video
              {videos.length !== 1 ? "s" : ""} from your library. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setRemoveAllDialog(false)}
              className="flex-1 border-[var(--border)] text-[var(--foreground)]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAll}
              className="flex-1 text-[var(--destructive-foreground)]"
            >
              Remove All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
export function DailyGoalDrawerTrigger({ name = false }: { name?: boolean }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [dailyGoal, setDailyGoal] = useAtom(dailyGoalAtom)
  const [goal, setGoal] = useState<number>(dailyGoal)

  const formatTimeInHours = useCallback(
    (ms: number) => ms / (60 * 60 * 1000),
    []
  )

  function onClick(adjustment: number) {
    setGoal(Math.max(ONE_HOUR, Math.min(MAX_FOCUS_TIME, goal + adjustment)))
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <SquarePenIcon /> {name ? "Daily Goal" : ""}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="font-[family-name:var(--font-geist-sans)]">
        <DrawerHeader>
          <DrawerTitle>Move Goal</DrawerTitle>
          <DrawerDescription>Set your daily focus goal</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 pb-0">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="btn-theme h-8 w-8 shrink-0 rounded-full"
              onClick={() => onClick(-(ONE_HOUR / 2))}
              disabled={goal <= ONE_HOUR}
            >
              <MinusIcon />
              <span className="sr-only">Decrease</span>
            </Button>
            <div className="flex-1 text-center">
              <div className="text-7xl font-bold tracking-tighter">
                {formatTimeInHours(goal)}
              </div>
              <div className="text-muted-foreground text-[0.70rem] uppercase">
                Hours/day
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="btn-theme h-8 w-8 shrink-0 rounded-full"
              onClick={() => onClick(ONE_HOUR / 2)}
              disabled={goal >= MAX_FOCUS_TIME}
            >
              <PlusIcon />
              <span className="sr-only">Increase</span>
            </Button>
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={() => {
              setDailyGoal(goal)
              setDailyGoalIDB(goal)
              setIsOpen(false)
            }}
          >
            SET MY GOAL
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function PomoBreakOverlay() {
  const [areWeOnBreak, closeBreakOverlay] = useAtom(isPomodoroBreakAtom)
  const [currentQuote, setCurrentQuote] = useState(BREAK_QUOTES[0])
  const [currentActivity, setCurrentActivity] = useState(BREAK_ACTIVITIES[0])

  const time = useAtomValue(timerAtom)

  useEffect(() => {
    if (!areWeOnBreak) return

    const interval = setInterval(() => {
      setCurrentQuote(
        BREAK_QUOTES[Math.floor(Math.random() * BREAK_QUOTES.length)]
      )
      setCurrentActivity(
        BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)]
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [areWeOnBreak])

  const formatTime = useCallback(formatTimeMain, [])

  return (
    <AnimatePresence>
      {areWeOnBreak && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-[family-name:var(--font-geist-sans)] backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto max-w-lg px-8 text-center"
          >
            {/* Break indicator */}
            <motion.div
              className="mb-8 flex items-center justify-center gap-3"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Coffee className="h-6 w-6 text-amber-400" />
              </motion.div>
              <h1 className="text-2xl font-medium text-white">Break Time</h1>
            </motion.div>

            {/* Quote */}
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <p className="text-xl leading-relaxed font-light text-white/90">
                {currentQuote}
              </p>
            </motion.div>

            {/* Activity suggestion */}
            <motion.div
              key={currentActivity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-lg border border-white/20 bg-white/10 p-4"
            >
              <p className="text-sm font-medium text-white/80">
                {currentActivity}
              </p>
            </motion.div>
            <motion.p className="my-4 text-sm font-medium text-white/80">
              {formatTime(time)}
            </motion.p>
            {/* Breathing indicator */}
            <motion.div
              className="mt-8 flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="h-3 w-3 rounded-full bg-white/40"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <p className="text-xs text-white/60">Take Deep Breaths</p>
            </motion.div>
            <motion.div className="mt-8 rounded-full text-xl leading-relaxed font-light">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => closeBreakOverlay(false)}
              >
                <XIcon />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function formatCurrentTime() {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()

  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const ampm = hours >= 12 ? "PM" : "AM"

  return {
    time: `${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    period: ampm,
  }
}

const EASING = [0.25, 0.46, 0.45, 0.94] as const

const CLOCK_UPDATE_INTERVAL = 60000 // 60 seconds
const FULLSCREEN_ERROR_PREFIX = "Failed to"

interface TimeDisplay {
  time: string
  period: string | null
}

export function AbsoluteFocusButton({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  const [isFocusMode, setIsFocusMode] = useAtom(showAbsoluteFocusAtom)
  const handleFullscreenToggle = useCallback(
    async (enterFullscreen: boolean): Promise<void> => {
      try {
        if (enterFullscreen) {
          const elem = document.documentElement
          if (elem.requestFullscreen) {
            await elem.requestFullscreen()
          }
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen()
          }
        }
      } catch (error) {
        const action = enterFullscreen ? "enter" : "exit"
        console.error(
          `${FULLSCREEN_ERROR_PREFIX} ${action} fullscreen mode:`,
          error
        )
      }
    },
    []
  )

  const toggleFocusMode = useCallback(async (): Promise<void> => {
    const newFocusMode = !isFocusMode
    await handleFullscreenToggle(newFocusMode)
    setIsFocusMode(newFocusMode)
  }, [isFocusMode, handleFullscreenToggle])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFocusMode}
      className={cn(
        "transition-colors",
        isFocusMode ? "text-primary-foreground" : "",
        className
      )}
      aria-label={isFocusMode ? "Exit focus mode" : "Enter focus mode"}
    >
      <TargetIcon className="h-4 w-4" />
      {label?.trim() ? <p className="text-muted-foreground">{label}</p> : null}
    </Button>
  )
}

export function AbsoluteFocusOverlay(): JSX.Element {
  const [currentTime, setCurrentTime] = useState("")
  const [currentPeriod, setCurrentPeriod] = useState("")

  // Atom values
  const timeValue = useAtomValue(timerAtom)
  const isPomoBreak = useAtomValue(isPomodoroBreakAtom)
  const [isFocusMode, setIsFocusMode] = useAtom(showAbsoluteFocusAtom)

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatDuration = useCallback((ms: number): string => {
    return formatTimeMain(ms)
  }, [])

  const clearTimeInterval = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const updateCurrentTime = useCallback((): void => {
    const timeObj = formatCurrentTime()
    setCurrentTime(timeObj.time)
    setCurrentPeriod(timeObj.period)
  }, [])

  const toggleFocusMode = () => setIsFocusMode((prev) => !prev)

  // Time update effect
  useEffect(() => {
    // If timer is active, clear any existing interval
    if (timeValue) {
      clearTimeInterval()
      return
    }

    // Update time immediately
    updateCurrentTime()

    // Set up interval for regular updates
    intervalRef.current = setInterval(updateCurrentTime, CLOCK_UPDATE_INTERVAL)

    return clearTimeInterval
  }, [timeValue, clearTimeInterval, updateCurrentTime])

  useEffect(() => {
    return clearTimeInterval
  }, [clearTimeInterval])

  // Memoized display values
  const displayValues: TimeDisplay = {
    time: timeValue ? formatDuration(timeValue) : currentTime,
    period: timeValue ? null : currentPeriod,
  }

  // Early return if in break mode
  const shouldShowFocusMode = isFocusMode && !isPomoBreak

  useEffect(() => {
    if (!shouldShowFocusMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFocusMode(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [shouldShowFocusMode, setIsFocusMode])

  return (
    <>
      <AnimatePresence mode="wait">
        {shouldShowFocusMode && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{
              opacity: 1,
              backdropFilter: "blur(20px)",
            }}
            exit={{
              opacity: 0,
              backdropFilter: "blur(0px)",
            }}
            transition={{
              duration: 0.5,
              ease: EASING,
            }}
            className="bg-background/60 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={toggleFocusMode}
            role="dialog"
            aria-modal="true"
            aria-label="Focus mode display"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{
                duration: 0.4,
                delay: 0.1,
                ease: EASING,
              }}
              className="text-center"
            >
              <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
                <div className="flex items-baseline justify-center gap-2 sm:gap-4">
                  {/* Main Time Display with Simple Tailwind Outline */}
                  <h1 className="font-mono text-[clamp(7rem,20vw,25rem)] leading-none font-bold tracking-tight text-[var(--accent)] [text-shadow:1px_1px_0_var(--primary),-1px_-1px_0_var(--primary),1px_-1px_0_var(--primary),-1px_1px_0_var(--primary)]">
                    {displayValues.time}
                  </h1>

                  {/* Period Display with Simple Tailwind Outline */}
                  {displayValues.period && (
                    <span className="font-mono text-[9vw] font-medium text-[var(--accent)] opacity-80 [text-shadow:1px_1px_0_var(--primary),-1px_-1px_0_var(--primary),1px_-1px_0_var(--primary),-1px_1px_0_var(--primary)] sm:text-[8vw] md:text-[7vw] lg:text-[6vw] xl:text-[5vw] 2xl:text-[4vw]">
                      {displayValues.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Exit Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-muted-foreground/40 mt-4 text-sm italic sm:text-base"
              >
                Tap anywhere to exit focus mode
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function MobileNavbar() {
  const isAbsFocusMode = useAtomValue(showAbsoluteFocusAtom)
  const setOpenAmbientDrawer = useSetAtom(openAmbientDrawerAtom)

  const [open, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    if (isAbsFocusMode && open) setIsOpen(false)
  }, [isAbsFocusMode])

  return (
    <div className="flex lg:hidden">
      <Drawer open={!isAbsFocusMode && open} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <MenuIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="mb-4 grid grid-cols-2 gap-4 px-4">
            <AbsoluteFocusButton
              className="flex h-24 w-full flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)]"
              label="Absolute Focus"
            />
            <Button
              variant="outline"
              size="icon"
              className="flex h-24 w-full flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)]"
              onClick={() => setOpenAmbientDrawer((prev) => !prev)}
            >
              <AudioLines className="h-4 w-4" />
              <p className="text-muted-foreground">Ambient Sounds</p>
            </Button>

            <UserSettingNavButton
              className="flex h-24 w-full flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)]"
              label="Settings"
            />
            <ThemeDropdown
              className="flex h-24 w-full flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)]"
              label="Themes"
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
