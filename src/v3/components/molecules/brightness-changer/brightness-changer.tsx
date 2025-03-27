import { Signal, component$ } from "@builder.io/qwik";
import { iUserSettings } from "~/v3/types/types";
import InputNumberChanger from "../../atoms/input-number-changer/input-number-changer";
import InfoTooltip from "../../organisms/info-tooltip/info-tooltip";

const MIN_BRIGHTNESS = 20;
const MAX_BRIGHTNESS = 100;

type BrightnessChangerProps = { unsavedUserSettings: Signal<iUserSettings> };
export default component$<BrightnessChangerProps>(({ unsavedUserSettings }) => {
  return (
    <InputNumberChanger
      propertyPath="interface.brightness"
      htmlFor="cards-route"
      label="Card brightness"
      name="cards-brightness"
      unsavedUserSettings={unsavedUserSettings}
      min={MIN_BRIGHTNESS}
      max={MAX_BRIGHTNESS}
      step={5}
    >
      <InfoTooltip>
        Brightness of cards
        <br />
        <div class="mt-1 text-slate-300">
          (Range: <strong>{MIN_BRIGHTNESS}</strong> to{" "}
          <strong>{MAX_BRIGHTNESS}</strong>)
        </div>
      </InfoTooltip>
    </InputNumberChanger>
  );
});
