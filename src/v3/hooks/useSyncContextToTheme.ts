// import { useVisibleTask$ } from "@builder.io/qwik";
// import storageService from "../services/storage.service";
// import { useGameContextService } from "../services/gameContext.service/gameContext.service";
// import GAME from "../constants/game";
//
// const useSyncContextToTheme = () => {
//   const ctx = useGameContextService();
//   // eslint-disable-next-line qwik/no-use-visible-task
//   useVisibleTask$(() => {
//     const theme = storageService.getTheme();
//     GAME.DEBUG.HOOKS && console.log("useSyncContextToTheme");
//     const oldTheme = ctx.state.userSettings.interface.invertCardColors
//       ? "dark"
//       : "light";
//     if (theme && theme !== oldTheme) {
//       GAME.DEBUG.HOOKS &&
//         console.log("~~ different; updating ctx to theme:", theme);
//       ctx.state.userSettings.interface.invertCardColors = theme === "dark";
//     }
//   });
// };
//
// export default useSyncContextToTheme;
