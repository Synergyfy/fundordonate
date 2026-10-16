import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    // Scroll to the in-page anchor (e.g. /about#faq). Lazy-loaded pages may
    // render slightly after navigation, so retry once shortly after.
    const scrollToHash = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return true;
      }
      return false;
    };

    if (!scrollToHash()) {
      const timer = setTimeout(scrollToHash, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, hash]);

  return null;
}
