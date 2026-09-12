// client/components/ConfirmationModal.tsx

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NADA_IKON } from "@/lib/statusStyles";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = 'warning',
  icon
}: ConfirmationModalProps) {

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return { icon: NADA_IKON.merah, confirmButton: 'bg-red-600 hover:bg-red-700 text-white' };
      case 'info':
        return { icon: NADA_IKON.biru, confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white' };
      case 'warning':
      default:
        return { icon: NADA_IKON.kuning, confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white' };
    }
  };

  const styles = getVariantStyles();
  const defaultIcon = <AlertTriangle className="w-6 h-6" />;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* showCloseButton={false}: sudah ada tombol batal di bawah. */}
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          {/* Icon */}
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", styles.icon)}>
            {icon || defaultIcon}
          </div>

          {/* Title */}
          <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>

          {/* Description */}
          {description ? (
            <DialogDescription className="text-muted-foreground text-center max-w-sm text-sm whitespace-pre-line">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {cancelLabel}
            </Button>

            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn("flex-1", styles.confirmButton)}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}