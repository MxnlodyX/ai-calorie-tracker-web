import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </IconBase>
  );
}

export function IconCalendarStats(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <path d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 17v-3" />
      <path d="M12 17v-5" />
      <path d="M16 17v-2" />
    </IconBase>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h2l2-2h4l2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3" />
    </IconBase>
  );
}

export function IconListDetails(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </IconBase>
  );
}

export function IconPencilPlus(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      <path d="M5 5v6" />
      <path d="M2 8h6" />
    </IconBase>
  );
}

export function IconFlame(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 .2 2-1 3-2 4 0-3-2-6-5-8 .5 4-3 6-3 11 0 4 3 7 7 7Z" />
    </IconBase>
  );
}

export function IconBowl(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 11h16a8 8 0 0 1-16 0Z" />
      <path d="M8 21h8" />
      <path d="M7 6c0-1 1-2 2-2" />
      <path d="M12 6c0-1 1-2 2-2" />
    </IconBase>
  );
}

export function IconCircleCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </IconBase>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function IconDeviceFloppy(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 3h12l2 2v16H5Z" />
      <path d="M8 3v6h8" />
      <path d="M8 21v-7h8v7" />
    </IconBase>
  );
}

export function IconX(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </IconBase>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </IconBase>
  );
}

export function IconClock(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function IconTrendingUp(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 17 6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </IconBase>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.5L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

export const ArrowLeft = IconArrowLeft;
export const ArrowRight = IconArrowRight;
export const Check = IconCircleCheck;
export const Ruler = IconListDetails;
export const Scale = IconFlame;
export const UserCog = IconEdit;
export const X = IconX;
