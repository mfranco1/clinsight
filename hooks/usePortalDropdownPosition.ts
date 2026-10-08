import { useEffect, useState, type RefObject } from "react";

export interface PortalDropdownPosition {
  top: number;
  left: number;
  width: number;
}

export const calculatePortalDropdownPosition = (
  rect: Pick<DOMRect, "left" | "bottom" | "width">,
  isDesktop: boolean,
  viewportWidth: number,
  scrollX: number,
  scrollY: number,
  dropdownWidth = 160,
  padding = 10,
): PortalDropdownPosition => {
  let left = rect.left + scrollX;
  if (!isDesktop) {
    if (left + dropdownWidth > viewportWidth - padding)
      left = viewportWidth - dropdownWidth - padding;
    if (left < padding) left = padding;
  }
  return { top: rect.bottom + scrollY, left, width: rect.width };
};

export const usePortalDropdownPosition = (
  isOpen: boolean,
  isDesktop: boolean,
  buttonRef: RefObject<HTMLButtonElement | null>,
): PortalDropdownPosition => {
  const [position, setPosition] = useState<PortalDropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const updatePosition = () => {
      if (!isOpen || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition(
        calculatePortalDropdownPosition(
          rect,
          isDesktop,
          window.innerWidth,
          window.scrollX,
          window.scrollY,
        ),
      );
    };

    updatePosition();
    if (isOpen) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [buttonRef, isDesktop, isOpen]);

  return position;
};
