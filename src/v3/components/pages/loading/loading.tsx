import type { FunctionComponent } from "@builder.io/qwik/jsx-runtime";

type LoadingProps = {
  blur?: boolean;
  isShowing?: boolean;
};
const Loading: FunctionComponent<LoadingProps> = ({
  blur = true,
  isShowing = true,
}) => (
  <>
    <div
      class={`${blur ? "backdrop-blur-[2px]" : ""} ${
        isShowing ? "opacity-100 z-50" : "opacity-0 pointer-events-none z-[-1]"
      } opacity-100 z-50 pointer-events-auto bg-black bg-opacity-20 
      text-slate-200 text-4xl transition-all absolute top-0 left-0 
      flex flex-grow justify-center items-center w-full h-full `}
    >
      Loading...
    </div>
  </>
);
export default Loading;
