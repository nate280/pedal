import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

const ICONS = {
  success: CheckCircle2,
  destructive: AlertCircle,
  default: Info,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const Icon = ICONS[variant] || ICONS.default;
        const tint =
          variant === "success"
            ? "text-good"
            : variant === "destructive"
              ? "text-destructive"
              : "text-brand";
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tint}`} />
              <div className="grid gap-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
