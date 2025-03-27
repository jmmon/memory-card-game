import { useVisibleTask$ } from "@builder.io/qwik";
import storageService from "../services/storage.service";
import { useGameContextService } from "../services/gameContext.service/gameContext.service";

const useSyncContextToTheme = () => {
  const ctx = useGameContextService();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const theme = storageService.getTheme();
    if (theme) {
      ctx.state.userSettings.interface.invertCardColors = theme === "dark";
    }
  });
};

export default useSyncContextToTheme;
