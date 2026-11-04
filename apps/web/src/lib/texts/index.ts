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
    chatTitle: "گفتگو با دستیار",
    chatDescription:
      "سؤال بپرسید، فایل پیوست کنید و از روی متن اسناد خودتان جواب بگیرید.",
    imageTitle: "تولید تصویر",
    imageDescription: "یک توضیح کوتاه بنویسید و تصویرش را تحویل بگیرید.",
    translationTitle: "ترجمه متن",
    translationDescription: "متن را با لحن دلخواه بین زبان‌ها ترجمه کنید.",
    codeTitle: "دستیار کد",
    codeDescription: "کد بنویسید، توضیح بگیرید، بازبینی و اشکال‌زدایی کنید.",
    appTitle: "دستیار هوشمند فارسی",
    description:
      "گفتگو، ترجمه، خلاصه، کد، تصویر و گفتار به متن در یک جا. مدل‌ها روی سرور خودتان اجرا می‌شوند و داده‌هایتان از شبکه بیرون نمی‌رود.",
    localFirstBadge: "اجرا روی سیستم خودتان",
    toolsHeading: "ابزارها",
    startChat: "شروع گفتگو",
    noTools: "هیچ ابزاری فعال نیست. از مدیر سیستم بخواهید ابزارها را فعال کند.",
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
