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
    chatDescription:
      "سؤال بپرسید، فایل پیوست کنید و از روی متن اسناد خودتان جواب بگیرید.",
    imageDescription: "یک توضیح کوتاه بنویسید و تصویرش را تحویل بگیرید.",
    translationTitle: "ترجمه متن",
    translationDescription: "متن را با لحن دلخواه بین زبان‌ها ترجمه کنید.",
    codeDescription: "کد بنویسید، توضیح بگیرید، بازبینی و اشکال‌زدایی کنید.",
    appTitle: "دستیار هوشمند فارسی",
    description:
      "گفتگو، ترجمه، خلاصه، کد، تصویر و گفتار به متن در یک جا. مدل‌ها روی سرور خودتان اجرا می‌شوند و داده‌هایتان از شبکه بیرون نمی‌رود.",
    localFirstBadge: "اجرا روی سیستم خودتان",
    toolsHeading: "ابزارها",
    toolsTitle: "هر کاری که با متن و صدا دارید",
    noTools: "هیچ ابزاری فعال نیست. از مدیر سیستم بخواهید ابزارها را فعال کند.",
    login: "ورود",
    register: "ساخت حساب",
    openApp: "ورود به برنامه",
    seeTools: "دیدن ابزارها",
    previewAlt: "صفحه گفتگو با یک مدل محلی",
    whyHeading: "چرا دستیار",
    why: [
      {
        title: "داده‌ها پیش خودتان می‌ماند",
        description:
          "متن با Ollama، گفتار با Whisper و تصویر با Stable Diffusion روی سرور خودتان پردازش می‌شود. هیچ درخواستی به سرویس بیرونی نمی‌رود.",
      },
      {
        title: "فارسی از پایه",
        description:
          "رابط راست‌به‌چپ، تاریخ شمسی و پاسخ پیش‌فرض به فارسی. پیام‌ها و خطاها هم فارسی هستند.",
      },
      {
        title: "چندکاربره با پنل مدیریت",
        description:
          "هر کاربر حساب و تاریخچه خودش را دارد. مدیر سیستم کاربران و مدل‌ها را از یک پنل مدیریت می‌کند.",
      },
    ],
    footer: "متن‌باز با مجوز MIT",
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
