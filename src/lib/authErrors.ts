const MESSAGES: Record<string, string> = {
  "auth/invalid-credential":
    "Incorrect email or password. — البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/invalid-email": "Enter a valid email address. — البريد الإلكتروني غير صالح.",
  "auth/user-not-found":
    "Incorrect email or password. — البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/wrong-password":
    "Incorrect email or password. — البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/user-disabled": "This account has been disabled. — تم تعطيل هذا الحساب.",
  "auth/email-already-in-use":
    "An account already exists with this email. — يوجد حساب بالفعل بهذا البريد الإلكتروني.",
  "auth/weak-password":
    "Password must be at least 8 characters. — كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.",
  "auth/too-many-requests":
    "Too many attempts. Try again later. — محاولات كثيرة، حاول مرة أخرى لاحقًا.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again. — تعذر الاتصال بالشبكة، حاول مرة أخرى.",
  "auth/requires-recent-login":
    "Please sign in again to continue. — يرجى تسجيل الدخول مرة أخرى للمتابعة.",
  "auth/expired-action-code":
    "This link has expired. Request a new one. — انتهت صلاحية الرابط، اطلب رابطًا جديدًا.",
  "auth/invalid-action-code":
    "This link is no longer valid. Request a new one. — الرابط غير صالح، اطلب رابطًا جديدًا.",
  "permission-denied":
    "You do not have permission to perform this action. — ليست لديك صلاحية لتنفيذ هذا الإجراء.",
};

export const PASSWORD_RESET_NOTICE =
  "If an account exists for this email, a reset link is on its way. — إذا كان هناك حساب مرتبط بهذا البريد، ستصلك رسالة لإعادة تعيين كلمة المرور.";

const FALLBACK = "Something went wrong. Please try again. — حدث خطأ ما، يرجى المحاولة مرة أخرى.";

export function authErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "unknown";
}

export function mapAuthError(error: unknown): string {
  return MESSAGES[authErrorCode(error)] ?? FALLBACK;
}
