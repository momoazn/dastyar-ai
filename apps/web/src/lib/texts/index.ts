import { admin } from "./admin";
import { auth } from "./auth";
import { chat, imageChat } from "./chat";
import {
  documentHints,
  general,
  invalidThreadId,
  languages,
  modelSelection,
  tones,
  transcribeLanguages,
  ui,
  userProfile,
} from "./common";
import { errors } from "./errors";
import { codeAssistant } from "./features/code";
import { documents } from "./features/documents";
import { imageGeneration } from "./features/image";
import { summarize } from "./features/summary";
import { transcribe } from "./features/transcribe";
import { translation } from "./features/translation";
import { navigation } from "./navigation";
import { settings } from "./settings";
import { sidebar } from "./sidebar";

export const fa = {
  index: {
    chatTitle: "چت با دستیار هوشمند",
    chatDescription:
      "با استفاده از هوش مصنوعی به راحتی چت کنید و پاسخ‌های هوشمند دریافت کنید",
    imageTitle: "تولید تصویر",
    imageDescription: "با استفاده از توضیحات متنی، تصاویر دلخواه خود را بسازید",
    translationTitle: "ترجمه متن",
    translationDescription: "متن‌های خود را به راحتی ترجمه کنید",
    codeTitle: "دستیار کد",
    codeDescription: "تولید، توضیح، بررسی و اشکال‌زدایی کد با هوش مصنوعی",
    start: "شروع کنید",
    appTitle: "دستیار هوشمند فارسی",
    description: "با استفاده از هوش مصنوعی، تجربه‌ای متفاوت را تجربه کنید",
    htmlTitle: "دستیار هوش مصنوعی فارسی",
    smartToolsTitle: "ابزارهای هوشمند",
    smartToolsSubtitle: "انتخاب کنید و شروع کنید",
    readyToStartTitle: "آماده شروع هستید؟",
    readyToStartDescription:
      "با دستیار هوشمند فارسی، تجربه‌ای جدید از هوش مصنوعی را کشف کنید",
    startChat: "شروع گفتگو",
  },
  general,
  auth,
  navigation,
  settings,
  chat,
  translation,
  modelSelection,
  languages,
  tones,
  transcribeLanguages,
  ui,
  userProfile,
  transcribe,
  summarize,
  imageGeneration,
  imageChat,
  codeAssistant,
  documents: { ...documents, ...documentHints },
  admin,
  sidebar,
  errors,
  invalidThreadId,
} as const;
