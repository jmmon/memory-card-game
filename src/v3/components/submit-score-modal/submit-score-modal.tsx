import { component$, useSignal, useStyles$ } from "@builder.io/qwik";

export default component$(() => {
  const dialogRef = useSignal<HTMLDialogElement>();
  useStyles$(`
#modal::backdrop {
  background: rgba(255,0,0,0.2);
}
#modal {
max-width: 50ch;
box-shadow: 0 0 4px 4px rgba(0,0,0,0.2);
}
`);
  return (
    <div>
      <dialog
        onSubmit$={(e) => {
          console.log("dialog submit", e);
        }}
        id="modal"
        ref={dialogRef}
        onClick$={(e, t: HTMLDialogElement) => {
          if (t.nodeName === "DIALOG") t.close();
        }}
        onClose$={(e) => {
          console.log("close:", e, (e.target as HTMLDialogElement).returnValue);
        }}
        onShow$={(e) => {
          console.log("show:", e);
        }}
class="block opacity-0 [&:not([open])]:pointer-events-none translate-y-20 transition-[opacity,transform] duration-300 [&[open]]:opacity-100 [&[open]]:translate-y-0 inset-0"
      >
        <p>testing 123</p>
        <p>testing 456</p>
        <form method="dialog">
          <button formMethod="dialog" value="cancel">
            Close
          </button>
          <button value="submit">Submit</button>
        </form>
      </dialog>

      <button
        onClick$={() => {
          (dialogRef.value as HTMLDialogElement).showModal();
        }}
      >
        Show Modal
      </button>
      <button
        onClick$={() => {
          (dialogRef.value as HTMLDialogElement).close();
        }}
      >
        Hide Modal
      </button>
    </div>
  );
});
