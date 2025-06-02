"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AllVideosListAtom,
  CurrentlyPlayingMediaAtom,
  isPomodoroBreakAtom,
  timerAtom,
} from "@/context/data"
import { BREAK_ACTIVITIES, BREAK_QUOTES } from "@/data/lofi"
import {
  clearStoreByName,
  deleteVideoFromList,
  IDB_STORES,
  STORES,
  updateVideoList,
} from "@/utils/idb.util"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAtom, useAtomValue } from "jotai"
import {
  Coffee,
  ListMusicIcon,
  PauseIcon,
  PlayCircleIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { formatTimeMain } from "@/lib/utils"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function UserSettingNavButton() {
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
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
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
      className="group mb-3"
    >
      <div
        className={`flex items-center rounded-lg border p-3 transition-all duration-200 ${
          isPlaying
            ? "border-blue-200 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {/* Play button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPlay(video)}
          className={`mr-3 h-8 w-8 rounded-full p-0 ${
            isPlaying ? "text-blue-600" : "text-gray-600"
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
          <h3 className="truncate text-sm font-medium text-gray-900">
            {video.title}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <VideoIcon className="h-3 w-3" />
            <span>YouTube</span>
            {isPlaying && (
              <span className="ml-2 font-medium text-blue-600">• Playing</span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-red-500"
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
      <DialogContent className="sm:max-w-md">
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
            <ListMusicIcon className="h-4 w-4" />
            {/* {videos.length > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                {videos.length}
                            </span>
                        )} */}
          </Button>
        </SheetTrigger>

        <SheetContent className="flex h-full w-full flex-col overflow-y-auto px-0 py-0 sm:max-w-lg">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b px-6 py-4">
              <SheetHeader className="space-y-2">
                <SheetTitle className="flex items-center gap-2">
                  <VideoIcon className="h-5 w-5" />
                  Video Library
                </SheetTitle>
                <SheetDescription>
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
                    className="h-9"
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
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-6">
              <div className="py-4">
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
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <ListMusicIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-2 font-medium text-gray-900">
                          No videos yet
                        </h3>
                        <p className="text-sm text-gray-500">
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
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <XIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">
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
                            isPlaying={currentVideo === video.url}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            {videos.length > 0 && (
              <div className="border-t px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {filteredVideos.length} of {videos.length} video
                    {videos.length !== 1 ? "s" : ""}
                  </span>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="h-auto p-1 text-xs"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2Icon className="h-5 w-5" />
              Remove All Videos?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all {videos.length} video
              {videos.length !== 1 ? "s" : ""} from your library. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setRemoveAllDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAll}
              className="flex-1"
            >
              Remove All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
