/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import HandleComponent from "@/components/HandleComponent"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatPrice } from "@/lib/utils"
import {
  COLORS,
  FINISHES,
  MATERIALS,
  MODELS,
  TEXT_COLORS,
} from "@/validators/option-validator"
import { RadioGroup } from "@headlessui/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import NextImage from "next/image"
import { useState, useEffect, useRef } from "react"
import { Rnd } from "react-rnd"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, ChevronsUpDown, Radio } from "lucide-react"
import { BASE_PRICE } from "@/config/product"
import { date } from "zod"
import { resolve } from "path"
import { useUploadThing } from "@/lib/uploadthing"
import { useToast } from "@/components/ui/use-toast"
import { useMutation } from "@tanstack/react-query"
import { saveConfig as _saveConfig, SaveConfigArgs } from "./actions"
import { useRouter } from "next/navigation"

// Define available fonts
const FONTS = [
  "Arial",
  "Verdana",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Trebuchet MS",
  "Comic Sans MS",
  "Impact",
  "Lucida Console",
]

interface DesignConfiguratorProps {
  configId: string
  imageUrl: string
  imageDimensions: { width: number; height: number }
}

const DesignConfigurator = ({
  configId,
  imageUrl,
  imageDimensions,
}: DesignConfiguratorProps) => {
  const { toast } = useToast()
  const router = useRouter()

  // Inside DesignConfigurator component

  const { mutate: saveConfig, isPending } = useMutation({
    mutationKey: ["save-config"],
    mutationFn: async (args: SaveConfigArgs) => {
      await Promise.all([saveConfiguration(imageUrl), _saveConfig(args)])
    },
    onError: () => {
      toast({
        title: "Terjadi Kesalahan",
        description: "Terjadi kesalahan di back-end kami. Silahkan coba lagi.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      router.push(`/configure/preview?id=${configId}`)
    },
  })
  // sticker

  const [images, setImages] = useState<string[]>([])
  const handleImageUpload = (imageUrl: string) => {
    setImages([...images, imageUrl])
  }

  const [options, setOptions] = useState<{
    color: (typeof COLORS)[number]
    model: (typeof MODELS.options)[number]
    material: (typeof MATERIALS.options)[number]
    finish: (typeof FINISHES.options)[number]

    text: string
    font: (typeof FONTS)[number] // Updated to use FONTS
    fontSize: number
    textColor: string // Updated to use TEXT_COLORS
  }>({
    color: COLORS[0],
    model: MODELS.options[0],
    material: MATERIALS.options[0],
    finish: FINISHES.options[0],

    text: "",
    font: FONTS[0],
    fontSize: 16, // default font size
    textColor: "#000000", // default text color
  })

  const [renderedDimension, setRenderedDimension] = useState({
    width: imageDimensions.width / 4,
    height: imageDimensions.height / 4,
  })

  const [renderedPosition, setRenderedPosition] = useState({
    x: 150,
    y: 205,
  })

  const phoneCaseRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { startUpload } = useUploadThing("imageUploader")

  const [stickers, setStickers] = useState<
    { image: string; x: number; y: number; width: number; height: number }[]
  >([])

  const handleAddSticker = (imageUrl: string, stickerImageUrl: string) => {
    setStickers((prev) => [
      ...prev,
      { image: stickerImageUrl, x: 100, y: 100, width: 100, height: 100 }, // Initial position and size
    ])
    saveConfiguration(imageUrl)
  }

  const [selectedStickerIndex, setSelectedStickerIndex] = useState<
    number | null
  >(null)

  const handleDeleteSticker = () => {
    if (selectedStickerIndex !== null) {
      setStickers((prev) =>
        prev.filter((_, idx) => idx !== selectedStickerIndex)
      )
      setSelectedStickerIndex(null) // Clear selection after deletion
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace") {
        if (selectedTextIndex !== null) {
          handleDeleteText()
        } else if (selectedStickerIndex !== null) {
          handleDeleteSticker()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleDeleteSticker, selectedStickerIndex])

  async function saveConfiguration(imageUrl: string) {
    try {
      const {
        left: caseLeft,
        top: caseTop,
        width,
        height,
      } = phoneCaseRef.current!.getBoundingClientRect()

      const { left: containerLeft, top: containerTop } =
        containerRef.current!.getBoundingClientRect()

      const leftOffset = caseLeft - containerLeft
      const topOffset = caseTop - containerTop

      const actualX = renderedPosition.x - leftOffset
      const actualY = renderedPosition.y - topOffset

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")

      const userImage = new Image()
      userImage.crossOrigin = "anonymous"
      userImage.src = imageUrl
      await new Promise((resolve) => (userImage.onload = resolve))

      // Draw the image on the canvas
      ctx?.drawImage(
        userImage,
        actualX,
        actualY,
        renderedDimension.width,
        renderedDimension.height
      )

      // Draw the custom texts
      texts.forEach((item) => {
        ctx!.font = `${item.fontSize}px ${item.font}`
        ctx!.fillStyle = item.textColor
        ctx!.fillText(item.text, item.x - leftOffset, item.y - topOffset)
      })

      // Draw stickers on top of the main image
      for (const sticker of stickers) {
        const stickerImage = new Image()
        stickerImage.src = sticker.image
        await new Promise((resolve) => (stickerImage.onload = resolve))

        ctx!.drawImage(
          stickerImage,
          sticker.x - leftOffset,
          sticker.y - topOffset,
          sticker.width,
          sticker.height
        )
      }

      // Draw texts on top of stickers (if applicable)
      texts.forEach((item) => {
        ctx!.font = `${item.fontSize}px ${item.font}`
        ctx!.fillStyle = item.textColor
        ctx!.fillText(item.text, item.x - leftOffset, item.y - topOffset)
      })

      const base64 = canvas.toDataURL()
      const base64Data = base64.split(",")[1]

      const blob = base64ToBlob(base64Data, "image/png")
      const file = new File([blob], "filename.png", { type: "image/png" })
      const imageURL = URL.createObjectURL(file)

      await startUpload([file], { configId })
    } catch (err) {
      toast({
        title: "Something went wrong",
        description:
          "There was a problem saving your config, please try again.",
        variant: "destructive",
      })
    }
  }

  function base64ToBlob(base64: string, mimeType: string) {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // State to hold added texts
  const [texts, setTexts] = useState<
    {
      text: string
      font: string
      fontSize: number
      x: number
      y: number
      textColor: string
    }[]
  >([])
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(
    null
  )

  // Track selected text index
  const handleAddText = (event: React.MouseEvent<HTMLButtonElement>) => {
    const imageUrl = event.currentTarget.getAttribute("data-image-url") || ""
    const text = event.currentTarget.getAttribute("data-text") || ""

    if (options.text) {
      // Add new text with initial position
      setTexts((prev) => [
        ...prev,
        {
          text: options.text,
          font: options.font,
          fontSize: options.fontSize,
          x: 350, // Initial x position
          y: 250, // Initial y position
          textColor: options.textColor, // Use the selected text color
        },
      ])
      // Clear the input field after adding text
      setOptions((prev) => ({ ...prev, text: "" }))
    }
    saveConfiguration(imageUrl)
  }

  // Function to handle deletion of selected text
  const handleDeleteText = () => {
    if (selectedTextIndex !== null) {
      setTexts((prev) => prev.filter((_, idx) => idx !== selectedTextIndex))
      setSelectedTextIndex(null) // Clear selection after deletion
    }
  }

  useEffect(() => {
    // Listen for keydown events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace") {
        handleDeleteText()
      }
    }

    // Add event listener
    window.addEventListener("keydown", handleKeyDown)

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleDeleteText, selectedTextIndex]) // Add selectedTextIndex to dependency array

  return (
    <div className="relative mt-20 grid grid-cols-1 lg:grid-cols-3 mb-20 pb-20">
      <div
        ref={containerRef}
        className="relative h-[37.5rem] overflow-hidden col-span-2 w-full max-w-4xl flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <div className="relative w-60 bg-opacity-50 pointer-events-none aspect-[896/1831]">
          <AspectRatio
            ref={phoneCaseRef}
            ratio={896 / 1831}
            className="pointer-events-none relative z-50 aspect-[896/1831] w-full">
            <NextImage
              fill
              alt={`${options.model?.value || "iphone13"} image`}
              src={`/${options.model?.value || "iphone13"}.png`}
              className="pointer-events-none z-50 select-none"
            />
          </AspectRatio>
          <div className="absolute z-40 inset-0 left-[3px] top-px right-[3px] bottom-px rounded-[32px] shadow-[0_0_0_99999px_rgba(229,231,235,0.6)]" />
          <div
            className={cn(
              "absolute inset-0 left-[3px] top-px right-[3px] bottom-px rounded-[32px]",
              `bg-${options.color.tw}`
            )}
          />
        </div>

        {/* Render the image with resizing and movement enabled */}
        <Rnd
          default={{
            x: 0,
            y: 0,
            width: imageDimensions.width / 4,
            height: imageDimensions.height / 4,
          }}
          onResizeStop={(_, __, ref, ___, { x, y }) => {
            setRenderedDimension({
              height: parseInt(ref.style.height.slice(0, -2)),
              width: parseInt(ref.style.width.slice(0, -2)),
            })

            setRenderedPosition({ x, y })
          }}
          onDragStop={(_, data) => {
            const { x, y } = data
            setRenderedPosition({ x, y })
          }}
          className="absolute z-20 border-[3px] border-primary"
          lockAspectRatio
          resizeHandleComponent={{
            bottomRight: <HandleComponent />,
            bottomLeft: <HandleComponent />,
            topRight: <HandleComponent />,
            topLeft: <HandleComponent />,
          }}>
          <NextImage
            src={imageUrl}
            fill
            alt="gambar mu"
            className="pointer-events-none"
            unoptimized
          />
        </Rnd>

        {/* Render texts independently */}
        {texts.map((item, index) => (
          <Rnd
            key={index}
            default={{
              x: item.x,
              y: item.y,
              width: "auto", // let the width adjust based on content
              height: "auto", // let the height adjust based on content
            }}
            onDragStop={(e, d) => {
              // Update position on drag stop
              setTexts((prev) =>
                prev.map((text, idx) =>
                  idx === index ? { ...text, x: d.x, y: d.y } : text
                )
              )
            }}
            className="absolute z-20"
            disableResizing={true} // Disable resizing
            onClick={() => setSelectedTextIndex(index)} // Set the selected text index
          >
            <div
              style={{
                fontFamily: item.font,
                fontSize: `${item.fontSize}px`,
                color: item.textColor,
                whiteSpace: "nowrap", // Prevent line breaks
              }}
              ref={(ref) => {
                if (ref) {
                  // Automatically adjust the size based on text content
                  ref.style.width = `${ref.scrollWidth}px`
                  ref.style.height = `${ref.scrollHeight}px`
                }
              }}>
              {item.text}
            </div>
          </Rnd>
        ))}
      </div>

      {/* Render stickers */}
      {stickers.map((item, index) => (
        <Rnd
          key={index}
          default={{
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          }}
          onDragStop={(e, d) => {
            setStickers((prev) =>
              prev.map((sticker, idx) =>
                idx === index ? { ...sticker, x: d.x, y: d.y } : sticker
              )
            )
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setStickers((prev) =>
              prev.map((sticker, idx) =>
                idx === index
                  ? {
                      ...sticker,
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      ...position,
                    }
                  : sticker
              )
            )
          }}
          onClick={() => setSelectedStickerIndex(index)} // Set selected sticker index on click
          className="absolute z-20" // Ensure the sticker has a high z-index
        >
          <img
            src={item.image}
            alt="sticker"
            style={{ width: "100%", height: "100%" }}
          />
        </Rnd>
      ))}

      <div className="h-[37.5rem] w-full  col-span-full lg:col-span-1 flex flex-col bg-white">
        <ScrollArea className="relative flex-1 overflow-auto">
          <div
            aria-hidden="true"
            className="absolute z-10 inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white pointer-events-none"
          />
          <div className="px-8 pb-12">
            <h2 className="tracking-tight font-bold text-3xl">
              Sesuaikan dengan designmu
            </h2>
            <div className="w-full h-px bg-zinc-200 my-6"></div>

            {/* Text Input for Custom Text */}
            <input
              type="text"
              placeholder="Type your text here"
              value={options.text}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  text: e.target.value,
                }))
              }
              className="border border-gray-300 rounded px-2 py-1 mb-4 w-full"
            />

            <button
              onClick={handleAddText}
              className="bg-primary text-white px-4 py-2 rounded mb-4">
              Tambah Text
            </button>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader()
                  reader.onload = () => {
                    handleAddSticker(imageUrl, reader.result as string)
                  }
                  reader.readAsDataURL(e.target.files[0])
                }
              }}
              className="border border-gray-300 rounded px-2 py-1 mb-4 w-full"
            />

            <div className="relative gap-3 h-full flex flex-col justify-between">
              {/* Text Color Selection */}
              <Label>Warna Text:</Label>
              <input
                type="color"
                value={options.textColor}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    textColor: e.target.value,
                  }))
                }
                className="border border-gray-300 rounded w-full"
              />
            </div>

            <div className="relative gap-3 mt-4 h-full flex flex-col justify-between">
              {/* Font Selection */}
              <Label>Font :</Label>
              <select
                value={options.font}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    font: e.target.value,
                  }))
                }
                className="border border-gray-300 rounded w-full">
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative gap-3 mt-4 h-full flex flex-col justify-between">
              {/* Font Size Selection */}
              <Label>Ukuran Font :</Label>
              <input
                type="number"
                value={options.fontSize}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    fontSize: parseInt(e.target.value) || 0,
                  }))
                }
                className="border border-gray-300 rounded px-2 py-1 w-full"
              />
            </div>

            <div className="relative mt-4 h-full flex flex-col justify-between">
              <div className="flex flex-col gap-6">
                <RadioGroup
                  value={options.color}
                  onChange={(val) => {
                    setOptions((prev) => ({
                      ...prev,
                      color: val,
                    }))
                  }}>
                  <Label>Background Color: {options.color.label}</Label>
                  <div className="mt-3 flex items-center space-x-3">
                    {COLORS.map((color) => (
                      <RadioGroup.Option
                        key={color.label}
                        value={color}
                        className={({ active, checked }) =>
                          cn(
                            "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 active:ring-0 focus:ring-0 active:outline-none focus:outline-none border-2 border-transparent",
                            {
                              [`border-${color.tw}`]: active || checked,
                            }
                          )
                        }>
                        <span
                          className={cn(
                            `bg-${color.tw}`,
                            "h-8 w-8 rounded-full border border-black border-opacity-10"
                          )}
                        />
                      </RadioGroup.Option>
                    ))}
                  </div>
                </RadioGroup>

                <div className="relative flex flex-col gap-3 w-full">
                  <Label>Model</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="">
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between">
                          {options.model.label}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {MODELS.options.map((model) => (
                        <DropdownMenuItem
                          key={model.label}
                          className={cn(
                            "flex text-sm gap-1 items-center p-1.5 cursor-default  hover:bg-zinc-100",
                            {
                              "bg-zinc-100":
                                model.label === options.model.label,
                            }
                          )}
                          onClick={() => {
                            setOptions((prev) => ({ ...prev, model }))
                          }}>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              model.label === options.model.label
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {model.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {[MATERIALS, FINISHES].map(
                  ({ name, options: selectableOptions }) => (
                    <RadioGroup
                      key={name}
                      value={options[name]}
                      onChange={(val) => {
                        setOptions((prev) => ({
                          ...prev,
                          [name]: val,
                        }))
                      }}>
                      <Label>
                        {name.slice(0, 1).toUpperCase() + name.slice(1)}
                      </Label>
                      <div className="mt-3 space-y-4">
                        {selectableOptions.map((option) => (
                          <RadioGroup.Option
                            key={option.value}
                            value={option}
                            className={({ active, checked }) =>
                              cn(
                                "relative block cursor-pointer rounded-lg bg-white px-6 py-4 shadow-sm border-2 border-zinc-200 focus:outline-none ring-0 focus:ring-0 outline-none sm:flex sm:justify-between",
                                {
                                  "border-primary": active || checked,
                                }
                              )
                            }>
                            <span className="flex items-center">
                              <span className="flex flex-col text-sm">
                                <RadioGroup.Label
                                  as="span"
                                  className="font-medium text-gray-900">
                                  {option.label}
                                </RadioGroup.Label>

                                {option.description ? (
                                  <RadioGroup.Description
                                    as="span"
                                    className="text-gray-500">
                                    <span className="block sm:inline">
                                      {option.description}
                                    </span>
                                  </RadioGroup.Description>
                                ) : null}
                              </span>
                            </span>

                            <RadioGroup.Description
                              as="span"
                              className="mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right">
                              <span className="font-medium text-gray-900">
                                {formatPrice(option.price / 100)}
                              </span>
                            </RadioGroup.Description>
                          </RadioGroup.Option>
                        ))}
                      </div>
                    </RadioGroup>
                  )
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="w-full px-8 h-16 bg-white">
          <div className="h-px w-full bg-zinc-200" />
          <div className="w-full h-full flex justify-end items-center">
            <div className="w-full flex gap-6 items-center">
              <p className="font-medium whitespace-nowrap">
                {formatPrice(
                  (BASE_PRICE + options.finish.price + options.material.price) /
                    100
                )}
              </p>

              <Button
                isLoading={isPending}
                disabled={isPending}
                loadingText="Saving"
                onClick={() =>
                  saveConfig({
                    configId,
                    color: options.color.value,
                    finish: options.finish.value,
                    material: options.material.value,
                    model: options.model.value,
                    imageUrl,
                  })
                }
                size="sm"
                className="w-full">
                Continue
                <ArrowRight className="h-4 w-4 ml-1.5 inline" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesignConfigurator
