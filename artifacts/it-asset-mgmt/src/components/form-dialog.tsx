import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "password";
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface FormDialogProps {
  title: string;
  trigger?: React.ReactNode;
  fields: FormField[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FormDialog({ title, trigger, fields, initialData = {}, onSubmit, open: controlledOpen, onOpenChange }: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const [formData, setFormData] = useState<any>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  useEffect(() => {
    if (open) setFormData(initialDataRef.current);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGrid = fields.length > 5;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={`max-w-2xl bg-card border-border shadow-xl ${isGrid ? 'sm:max-w-3xl' : ''}`}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className={`grid gap-4 ${isGrid ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label className="text-foreground/80 font-medium">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={formData[field.name]?.toString() || ""}
                    onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                    required={field.required}
                  >
                    <SelectTrigger className="w-full bg-background focus:ring-primary/20">
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type || "text"}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    required={field.required}
                    className="bg-background focus-visible:ring-primary/20 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="shadow-lg shadow-primary/25">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
