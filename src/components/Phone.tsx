/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

interface PhoneProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc: string
  model: string
  dark?: boolean
}

const Phone = ({
  imgSrc,
  model,
  className,
  dark = false,
  ...props
}: PhoneProps) => {
  const frameSrc = model
    ? `/${model.toLowerCase()}.png`
    : "/phone-template-white-edges.png"

  return (
    <div
      className={cn(
        "relative pointer pointer-events-none z-50 overflow-hidden", // fixed typo: overflfow -> overflow
        className
      )}
      {...props}>
      <img
        src={frameSrc}
        className="pointer-events-none z-50 select-none"
        alt="phone frame"
      />
      <div className="absolute -z-10 inset-0 ">
        <img
          className="object-cover min-w-full min-h-full"
          src={imgSrc}
          alt="overlaying phone image"
        />
      </div>
    </div>
  )
}

export default Phone
