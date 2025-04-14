import { component$ } from "@builder.io/qwik";
import Backdrop from "../backdrop/backdrop";

type Props = {
  blur?: boolean;
  isShowing?: boolean;
};
const Loading = component$<Props>(({ isShowing = true }) => (
  <Backdrop
    isShowing={isShowing}
    bgClasses="text-4xl text-slate-200"
    bgHiddenClasses="opacity-0"
  >
    Loading...
  </Backdrop>
));
export default Loading;
