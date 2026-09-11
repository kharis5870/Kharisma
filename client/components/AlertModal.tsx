import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NADA_IKON } from "@/lib/statusStyles";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  description,
}: AlertModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* showCloseButton={false}: sudah ada tombol "Tutup" di bawah. */}
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", NADA_IKON.merah)}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-muted-foreground text-center max-w-sm text-sm">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
          <Button variant="outline" onClick={onClose} className="w-full mt-4">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}