import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface State extends ConfirmOptions {
  open: boolean;
  resolve?: (v: boolean) => void;
}

/**
 * Hook for showing AlertDialog-based confirmation. Returns:
 * - `confirm(opts)` → Promise<boolean>, resolves to true if user confirms
 * - `dialog` → JSX node to render somewhere in the consuming component tree
 *
 * Replacement for `window.confirm()`.
 */
export function useConfirm() {
  const [state, setState] = useState<State>({ open: false });
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, ...opts });
    });
  }, []);

  const handle = (v: boolean) => () => {
    resolveRef.current?.(v);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  };

  const dialog = (
    <AlertDialog open={state.open} onOpenChange={(open) => !open && handle(false)()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title ?? "Konfirmasi"}</AlertDialogTitle>
          {state.description ? (
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handle(false)}>
            {state.cancelLabel ?? "Batal"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handle(true)}
            className={cn(
              state.destructive && buttonVariants({ variant: "destructive" }),
            )}
          >
            {state.confirmLabel ?? "Lanjut"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
