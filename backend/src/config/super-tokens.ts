// import { Passwordless } from 'supertokens-node/recipe/passwordless';
// import { SyncUserService } from 'src/services/sync-user.service';
// import { TelegramService } from 'src/common/telegram-gateway.service';
// import SuperTokens from'supertokens-node';

// export function initSuperTokens(
//   syncUserService: SyncUserService,
//   telegramService: TelegramService,
// ) {
//   SuperTokens.init({
//     framework: 'express',
//     supertokens: {
//       connectionURI: 'http://localhost:3567',
//     },
//     appInfo: {
//       appName: "auth-super-token",
//       apiDomain: "http://localhost:3000",
//       websiteDomain: "http://localhost:3001",
//       apiBasePath: "/auth",
//       websiteBasePath: "/auth",
//     },
//     recipeList: [
//       // ─── TELEGRAM (OTP via Phone) ───────────────────────────────
//       Passwordless
//     ]
//   });
// }