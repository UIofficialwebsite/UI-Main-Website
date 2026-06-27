import React from "react";

/**
 * Last line of defence against a blank white screen. If a lazy route chunk fails
 * to load (e.g. a stale chunk hash lingering after a deploy) or a page throws
 * during render, this shows a recovery card instead of an empty page. The SW +
 * one-shot reload normally fix chunk errors automatically; this catches the rest.
 */
interface State {
  hasError: boolean;
}

class RouteErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("RouteErrorBoundary caught:", error);
  }

  private handleReload = () => {
    // Clear caches + SW so a poisoned/stale asset cache can't keep breaking us,
    // then hard-reload.
    try {
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) =>
          regs.forEach((r) => r.unregister())
        );
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 font-['Inter',sans-serif] bg-white">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            We couldn't load the latest version of the page. Please reload to continue.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-[#1e3a8a] px-5 py-2.5 text-sm font-medium text-white"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default RouteErrorBoundary;
