import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({
  ...props
}: React.ComponentProps<typeof Sonner>) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      richColors
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          // Sleek, borderless, translucent toasts tinted by action.
          "--normal-bg": "rgba(255,255,255,0.82)",
          "--normal-text": "#171717",
          "--normal-border": "transparent",
          "--success-bg": "rgba(34,197,94,0.16)",
          "--success-text": "#047857",
          "--success-border": "transparent",
          "--error-bg": "rgba(239,68,68,0.16)",
          "--error-text": "#b91c1c",
          "--error-border": "transparent",
          "--warning-bg": "rgba(245,158,11,0.18)",
          "--warning-text": "#92400e",
          "--warning-border": "transparent",
          "--info-bg": "rgba(37,99,235,0.14)",
          "--info-text": "#1d4ed8",
          "--info-border": "transparent",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "backdrop-blur-md shadow-lg font-medium",
          title: "font-semibold",
          description: "opacity-80",
        },
      }}
      {...props} />
  );
}

export { Toaster }
