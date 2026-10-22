import { Toaster } from "~/components/ui/sonner";
import { useMediaQuery } from "~/hooks/use-media-query";

// Sonner's own mobile layout starts at 600px, but the tab bar and the "+ Novo" pill
// show up to md (768px). Below md, toasts sit above both instead of the corner.
export function AppToaster() {
  const hasTabBar = useMediaQuery("(max-width: 767px)");

  return (
    <Toaster
      duration={5000}
      mobileOffset={{ bottom: 152 }}
      offset={hasTabBar ? { bottom: 152, right: 16 } : undefined}
      position="bottom-right"
    />
  );
}
