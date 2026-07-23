/**
 * Skill icon mapping.
 *
 * Purpose: Map a skill name to a colored brand icon (react-icons). Used by the
 *          Skills section and project tech chips.
 *
 * Example: <SkillIcon name="Python" />
 */
import type { IconType } from "react-icons";
import {
  SiC,
  SiCplusplus,
  SiExpress,
  SiMongodb,
  SiMysql,
  SiNodedotjs,
  SiPython,
  SiReact,
  SiSqlite,
  SiStreamlit,
  SiTypescript,
} from "react-icons/si";
import { FaJava, FaBrain, FaDatabase, FaCode } from "react-icons/fa6";

interface IconMeta {
  Icon: IconType;
  color: string;
}

/** Lookup table: skill name -> icon + brand color. */
const ICONS: Record<string, IconMeta> = {
  Python: { Icon: SiPython, color: "#3776AB" },
  Java: { Icon: FaJava, color: "#f89820" },
  "C++": { Icon: SiCplusplus, color: "#00599C" },
  C: { Icon: SiC, color: "#A8B9CC" },
  React: { Icon: SiReact, color: "#61DAFB" },
  "React Native": { Icon: SiReact, color: "#61DAFB" },
  TypeScript: { Icon: SiTypescript, color: "#3178C6" },
  FastAPI: { Icon: SiPython, color: "#009688" },
  "Node.js": { Icon: SiNodedotjs, color: "#5FA04E" },
  // currentColor → inherits the chip's text color so it stays visible in both
  // dark (light text) and light (dark text) themes.
  "Express.js": { Icon: SiExpress, color: "currentColor" },
  Streamlit: { Icon: SiStreamlit, color: "#FF4B4B" },
  MongoDB: { Icon: SiMongodb, color: "#47A248" },
  MySQL: { Icon: SiMysql, color: "#4479A1" },
  SQLite: { Icon: SiSqlite, color: "#003B57" },
  "Machine Learning": { Icon: FaBrain, color: "#38bdf8" },
  DSA: { Icon: FaCode, color: "#38bdf8" },
  DBMS: { Icon: FaDatabase, color: "#38bdf8" },
};

/** Fallback icon for unmapped skills. */
const DEFAULT: IconMeta = { Icon: FaCode, color: "#7dd3fc" };

interface SkillIconProps {
  name: string;
  className?: string;
}

/**
 * Purpose: Render the brand icon for a given skill name.
 * Inputs:  name (string), optional className.
 * Output:  JSX icon element colored with the brand color.
 */
export function SkillIcon({ name, className }: SkillIconProps) {
  const { Icon, color } = ICONS[name] ?? DEFAULT;
  return <Icon className={className} style={{ color }} aria-hidden />;
}
