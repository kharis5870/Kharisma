import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  autoCloseDelay?: number; 
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  actionLabel = "Tutup",
  onAction,
  autoCloseDelay = 3000
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        if (onAction) {
          onAction();
        } else {
          onClose();
        }
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onAction, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-20 h-20 border-4 border-green-300 rounded-full animate-ping opacity-75"></div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-center max-w-sm">{description}</p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Tutup
            </Button>
            
            {onAction && (
              <Button
                onClick={onAction}
                className="flex-1 bg-bps-green-600 hover:bg-bps-green-700"
              >
                {actionLabel}
              </Button>
            )}
          </div>

          {/* Auto-close indicator */}
          {autoCloseDelay > 0 && (
            <div className="text-xs text-gray-500 mt-4">
              Akan {onAction ? 'redirect' : 'tertutup'} otomatis dalam {autoCloseDelay / 1000} detik
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
