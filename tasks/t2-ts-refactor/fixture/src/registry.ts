import { handleF01 } from "./features/f01.ts";
import { handleF02 } from "./features/f02.ts";
import { handleF03 } from "./features/f03.ts";
import { handleF04 } from "./features/f04.ts";
import { handleF05 } from "./features/f05.ts";
import { handleF06 } from "./features/f06.ts";
import { handleF07 } from "./features/f07.ts";
import { handleF08 } from "./features/f08.ts";
import { handleF09 } from "./features/f09.ts";
import { handleF10 } from "./features/f10.ts";
import { handleF11 } from "./features/f11.ts";
import { handleF12 } from "./features/f12.ts";

export const handlers: Record<string, (userId: string) => string> = {
  f01: handleF01,
  f02: handleF02,
  f03: handleF03,
  f04: handleF04,
  f05: handleF05,
  f06: handleF06,
  f07: handleF07,
  f08: handleF08,
  f09: handleF09,
  f10: handleF10,
  f11: handleF11,
  f12: handleF12,
};
