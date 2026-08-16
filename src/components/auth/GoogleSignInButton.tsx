import { useEffect, useRef, useState } from "react";

/**
 * Google Identity Services global exposed by https://accounts.google.com/gsi/client
 */
interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || "";

interface GoogleSignInButtonProps {
  /** Receives the Google ID credential to exchange on the backend. */
  onCredential: (credential: string) => void;
  /** Disables interaction while an auth request is in flight. */
  disabled?: boolean;
}

/**
 * "Continue with Google" button backed by Google Identity Services (GIS).
 *
 * Hidden entirely when `VITE_GOOGLE_CLIENT_ID` is not configured. The GIS
 * script is injected lazily on first mount and the button is rendered into a
 * container the library controls. If the script cannot load (ad-blocker,
 * network) a fallback error is shown instead of a silently dead button.
 */
export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const win = window as unknown as { google?: GoogleIdentity };
    let cancelled = false;

    const render = () => {
      if (cancelled || !win.google || !containerRef.current) return;
      win.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredentialRef.current(response.credential),
      });
      win.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        shape: "pill",
        text: "continue_with",
        locale: "en",
      });
    };

    if (win.google) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => {
        if (!cancelled) setError(true);
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  if (error) {
    return (
      <p className="text-center text-xs font-medium text-error-600 dark:text-error-400">
        Google sign-in is unavailable right now. Please try again later.
      </p>
    );
  }

  return (
    <div ref={containerRef} className={disabled ? "pointer-events-none opacity-60" : undefined} />
  );
}
