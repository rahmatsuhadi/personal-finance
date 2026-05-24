import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      style={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast bg-brutal-white text-brutal-black border-2 border-brutal-black shadow-brutal-md rounded-none text-sm font-bold p-4 flex items-center gap-3 w-[calc(100vw-32px)] max-w-[356px] mx-auto",
          title: "font-black uppercase tracking-wide text-sm",
          description: "font-medium text-xs",
          actionButton:
            "font-black uppercase border-2 text-[12px] h-8 px-3 bg-brutal-lime text-brutal-black border-brutal-black rounded-none shrink-0 shadow-brutal-sm brutal-press",
          cancelButton:
            "font-black uppercase border-2 text-[12px] h-8 px-3 bg-brutal-white text-brutal-black border-brutal-black rounded-none shrink-0 shadow-brutal-sm brutal-press",
          success: "group-[.success]:bg-brutal-emerald group-[.success]:text-brutal-black",
          error: "group-[.error]:bg-brutal-rose group-[.error]:text-brutal-black",
          info: "group-[.info]:bg-brutal-cyan group-[.info]:text-brutal-black",
          warning: "group-[.warning]:bg-brutal-yellow group-[.warning]:text-brutal-black",
          loading:
            "[&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

