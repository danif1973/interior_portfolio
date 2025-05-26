"use client";

import { useEffect, useState, useCallback } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { XCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import { fetchWithCSRF } from '@/lib/csrf-client';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const PASSWORD_RULES = {
  minLength: (pwd: string) => pwd.length >= 6,
  hasLowercase: (pwd: string) => /[a-z]/.test(pwd),
  hasUppercase: (pwd: string) => /[A-Z]/.test(pwd),
  hasNumber: (pwd: string) => /\d/.test(pwd),
  hasSpecial: (pwd: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
};

export default function AdminAuthPage() {
  const [isSet, setIsSet] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'login' | 'set' | 'change'>('login');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number>(0);

  // Form fields
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/admin-auth/status");
        const data = await res.json();
        setIsSet(data.isSet);
        setMode(data.isSet ? "login" : "set");
      } catch (error: unknown) {
        logger.error('[AdminLogin] Failed to check authentication status', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setError("Failed to check authentication status");
      } finally {
        setInitialLoading(false);
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const storedAttemptsTime = localStorage.getItem('loginAttemptsTime');
    const storedCooldown = localStorage.getItem('loginCooldown');
    
    const now = Date.now();
    
    // Check if attempts window has expired (1 minute)
    if (storedAttemptsTime && now - parseInt(storedAttemptsTime) > 60000) {
      // Reset attempts if window has expired
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginAttemptsTime');
      setAttempts(0);
    } else if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
    
    if (storedCooldown) {
      const cooldownTime = parseInt(storedCooldown);
      if (cooldownTime > now) {
        setCooldownEndTime(cooldownTime);
      } else {
        // Clear expired cooldown and attempts
        localStorage.removeItem('loginCooldown');
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginAttemptsTime');
      }
    }
  }, []);

  // Update remaining seconds every second when in cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownEndTime) {
      const updateRemainingTime = () => {
        const now = Date.now();
        if (now >= cooldownEndTime) {
          setCooldownEndTime(null);
          setRemainingSeconds(null);
          setAttempts(0);
          localStorage.removeItem('loginCooldown');
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('loginAttemptsTime');
        } else {
          setRemainingSeconds(Math.ceil((cooldownEndTime - now) / 1000));
        }
      };

      // Update immediately
      updateRemainingTime();
      // Then update every second
      timer = setInterval(updateRemainingTime, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownEndTime]);

  const validatePassword = (pwd: string) => 
    Object.values(PASSWORD_RULES).every(rule => rule(pwd));

  const getPasswordValidation = (pwd: string) => ({
    minLength: PASSWORD_RULES.minLength(pwd),
    hasLowercase: PASSWORD_RULES.hasLowercase(pwd),
    hasUppercase: PASSWORD_RULES.hasUppercase(pwd),
    hasNumber: PASSWORD_RULES.hasNumber(pwd),
    hasSpecial: PASSWORD_RULES.hasSpecial(pwd),
  });

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    logger.debug('[AdminLogin] Container clicked', {
      target: e.target instanceof HTMLElement ? e.target.tagName : 'unknown'
    });
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (loading) {
      return;
    }

    // Check for cooldown
    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      const seconds = Math.ceil((cooldownEndTime - Date.now()) / 1000);
      setRemainingSeconds(seconds);
      setError(`נא להמתין ${seconds} שניות לפני ניסיון נוסף`);
      return;
    }

    // Check attempts
    if (attempts >= 3) {
      const cooldownTime = Date.now() + 60000; // 1 minute cooldown
      setCooldownEndTime(cooldownTime);
      setRemainingSeconds(60);
      localStorage.setItem('loginCooldown', cooldownTime.toString());
      setError('יותר מדי ניסיונות כושלים. נא להמתין דקה לפני ניסיון נוסף');
      return;
    }
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" 
        ? "/api/admin-auth/login"
        : mode === "set"
        ? "/api/admin-auth/set"
        : "/api/admin-auth/change";

      const body = mode === "login"
        ? { password }
        : mode === "set"
        ? { password, confirmPassword }
        : { oldPassword, newPassword: password, confirmPassword };

      logger.debug('[AdminLogin] Attempting authentication', {
        mode,
        endpoint,
        hasPassword: !!password,
        hasConfirmPassword: !!confirmPassword,
        hasOldPassword: !!oldPassword
      });

      const res = await fetchWithCSRF(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: unknown = null;
      let rawText: string | null = null;
      try {
        data = await res.json();
      } catch {
        try {
          rawText = await res.text();
        } catch {}
      }

      if (!res.ok) {
        let errorMsg = 'שגיאה לא ידועה. נא לנסות שוב מאוחר יותר';
        
        if (res.status === 401) {
          // Increment attempts on failed login
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          localStorage.setItem('loginAttempts', newAttempts.toString());
          localStorage.setItem('loginAttemptsTime', Date.now().toString());
          
          if (newAttempts >= 3) {
            const cooldownTime = Date.now() + 60000;
            setCooldownEndTime(cooldownTime);
            setRemainingSeconds(60);
            localStorage.setItem('loginCooldown', cooldownTime.toString());
            errorMsg = 'יותר מדי ניסיונות כושלים. נא להמתין דקה לפני ניסיון נוסף';
          } else {
            errorMsg = `סיסמה שגויה. נותרו ${3 - newAttempts} ניסיונות`;
          }
        }

        if (data && typeof data === 'object' && data !== null) {
          const reason = (data as { reason?: string }).reason;
          if (reason?.includes('Too many failed attempts') || 
              reason?.includes('rate limit exceeded')) {
            const cooldownTime = Date.now() + 60000;
            setCooldownEndTime(cooldownTime);
            setRemainingSeconds(60);
            localStorage.setItem('loginCooldown', cooldownTime.toString());
            errorMsg = 'יותר מדי ניסיונות כושלים. נא להמתין דקה לפני ניסיון נוסף';
          } else {
            errorMsg = 'שגיאת אבטחה. נא לרענן את הדף ולנסות שוב';
          }
        } else {
          errorMsg = 'שגיאת אבטחה. נא לרענן את הדף ולנסות שוב';
        }

        logger.error('[AdminLogin] Authentication failed', {
          status: res.status,
          data,
          rawText,
          attempts: attempts + 1,
          mode,
          error: errorMsg
        });
        throw new Error(errorMsg);
      }

      // Reset attempts and cooldown on successful login
      if (mode === 'login') {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginAttemptsTime');
        localStorage.removeItem('loginCooldown');
        setAttempts(0);
        setCooldownEndTime(null);
      }

      logger.info('[AdminLogin] Authentication successful', {
        mode,
        action: mode === 'login' ? 'login' : mode === 'set' ? 'set_password' : 'change_password'
      });

      setSuccess(
        mode === "login"
          ? "התחברת בהצלחה!"
          : mode === "set"
          ? "הסיסמה נשמרה בהצלחה!"
          : "הסיסמה שונתה בהצלחה!"
      );

      if (mode === "login") {
        setTimeout(() => {
          router.push("/admin");
        }, 500);
      } else if (mode === "set") {
        setIsSet(true);
        setMode("login");
      } else if (mode === "change") {
        setMode("login");
      }

      setOldPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה. נא לנסות שוב מאוחר יותר';
      setError(errorMessage);
      logger.error('[AdminLogin] Authentication error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        mode
      });
    } finally {
      setLoading(false);
    }
  }, [loading, mode, password, confirmPassword, oldPassword, router, cooldownEndTime, attempts]);

  const canSubmit = (() => {
    if (mode === "login") {
      return password.length > 0;
    }
    if (mode === "set") {
      return validatePassword(password) && password === confirmPassword;
    }
    if (mode === "change") {
      return oldPassword.length > 0 && validatePassword(password) && password === confirmPassword;
    }
    return false;
  })();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50"
      onClick={handleContainerClick}
    >
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          {mode === "login"
            ? "התחברות מנהל"
            : mode === "set"
            ? "יצירת סיסמת מנהל"
            : "שינוי סיסמה"}
        </h2>
        
        {error && (
          <div className="text-red-600 text-center flex items-center justify-center gap-2">
            {cooldownEndTime && <ClockIcon className="h-5 w-5" />}
            {cooldownEndTime && remainingSeconds !== null
              ? `נא להמתין ${remainingSeconds} שניות לפני ניסיון נוסף`
              : error}
          </div>
        )}
        {success && <div className="text-green-600 text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "change" && (
            <div>
              <label className="block mb-1 text-right">סיסמה נוכחית</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  className="w-full border rounded px-3 py-2 pl-10"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowOld((v) => !v)}
                >
                  {showOld ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          {(mode === "set" || mode === "change" || mode === "login") && (
            <div>
              <label className="block mb-1 text-right">
                {mode === "login" ? "סיסמה" : "סיסמה חדשה"}
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className="w-full border rounded px-3 py-2 pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNew((v) => !v)}
                >
                  {showNew ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {(mode === "set" || mode === "change") && (
                <div className="text-xs text-gray-500 mt-1 text-right">
                  הסיסמה חייבת להיות באורך 6 תווים לפחות, לכלול אותיות גדולות, קטנות, מספר ותו מיוחד.
                </div>
              )}
            </div>
          )}

          {(mode === "set" || mode === "change") && (
            <div>
              <label className="block mb-1 text-right">אימות סיסמה</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="w-full border rounded px-3 py-2 pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          {(mode === "set" || mode === "change") && (
            <div className="mt-2 space-y-2">
              {(() => {
                const validation = getPasswordValidation(password);
                const unmetRequirements = Object.entries(validation)
                  .filter(([, isValid]) => !isValid);
                
                if (unmetRequirements.length === 0) return null;

                return (
                  <>
                    <div className="text-sm font-medium text-gray-700">דרישות סיסמה חסרות:</div>
                    <ul className="space-y-1 text-sm">
                      {unmetRequirements.map(([key]) => {
                        const labels: Record<string, string> = {
                          minLength: "לפחות 6 תווים",
                          hasLowercase: "אות קטנה",
                          hasUppercase: "אות גדולה",
                          hasNumber: "מספר",
                          hasSpecial: "תו מיוחד",
                        };
                        return (
                          <li key={key} className="flex items-center gap-2 text-right">
                            <XCircleIcon className="h-5 w-5 text-red-500" />
                            <span className="text-red-700">
                              {labels[key]}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              })()}
            </div>
          )}

          {(mode === "set" || mode === "change") && password !== confirmPassword && (
            <div className="text-sm text-red-600 text-right">
              הסיסמאות אינן תואמות
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`w-full py-2 rounded font-bold transition-colors ${
              !canSubmit 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
          >
            {loading ? (
              <span className="inline-block animate-pulse">מעבד...</span>
            ) : mode === "login" ? (
              "התחבר"
            ) : mode === "set" ? (
              "צור סיסמה"
            ) : (
              "שנה סיסמה"
            )}
          </button>

          {!canSubmit && (mode === "set" || mode === "change") && (
            <div className="text-sm text-gray-600 text-center">
              יש למלא את כל דרישות הסיסמה כדי להמשיך
            </div>
          )}
        </form>

        {isSet && mode === "login" && (
          <button
            type="button"
            onClick={() => setMode("change")}
            className="w-full text-gray-800 mt-2 hover:text-gray-700 underline transition-colors"
          >
            שכחת סיסמה? שנה סיסמה
          </button>
        )}

        {mode === "change" && (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full text-gray-600 mt-2 hover:text-gray-500 underline transition-colors"
          >
            חזור להתחברות
          </button>
        )}
      </div>
    </div>
  );
} 