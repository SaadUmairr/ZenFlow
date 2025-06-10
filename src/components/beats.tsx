"use client"

import { AudioLinesIcon } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Button } from "./ui/button"

export function BeatsContainer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <AudioLinesIcon absoluteStrokeWidth />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="min-h-1/2">
        <DrawerHeader>
          <DrawerTitle>Beats</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="grid grid-cols-2 lg:grid-cols-8"></div>
      </DrawerContent>
    </Drawer>
  )
}
