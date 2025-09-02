import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

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
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-100">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-gray-600 text-center max-w-sm text-sm">
              {description}
            </p>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full mt-4"
          >
            <X className="w-4 h-4 mr-2" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}