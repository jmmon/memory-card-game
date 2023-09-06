import { component$, useSignal } from "@builder.io/qwik";

export default component$(() => {
  const dialogRef = useSignal<HTMLDialogElement>();
  return (
    <div>
      <dialog ref={dialogRef}>
<p>testing 123</p>
<p>testing 456</p>
<form method="dialog">
<button>Close</button>
</form>
</dialog>
<button onClick$={() => {(dialogRef.value as HTMLDialogElement).show()}}>Show Modal</button>
<button onClick$={() => {(dialogRef.value as HTMLDialogElement).close()}}>Hide Modal</button>
    </div>
  );
});
