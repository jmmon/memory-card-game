import type { ClassList, QRL } from "@builder.io/qwik";
import { Slot, component$ } from "@builder.io/qwik";

type Props = {
  isShowing: boolean;
  bgClasses?: ClassList;
  bgHiddenClasses?: ClassList;
  onClick?: QRL<(e: MouseEvent, t: HTMLElement) => void>;
};
const Backdrop = component$<Props>(
  ({ isShowing, bgClasses, bgHiddenClasses, onClick }) => (
    <div
      data-name="backdrop"
      onClick$={onClick}
      class={`overflow-hidden top-0 left-0 absolute w-full full-height bg-black flex justify-center items-center transition-all duration-[300ms]
      ${
        isShowing
          ? `pointer-events-auto z-[32] bg-opacity-20 backdrop-blur-[2px] sm:backdrop-blur-[3px] ${bgClasses}`
          : `pointer-events-none z-[-1] bg-opacity-0 ${bgHiddenClasses}`
      }`}
    >
      <Slot />
    </div>
  ),
);
export default Backdrop;
