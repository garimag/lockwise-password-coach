import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const COMMON_PASSWORDS = [
  "password",
  "password123",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "welcome123",
  "iloveyou",
  "abc123",
  "111111",
  "000000",
  "password1",
];

const SYMBOLS = "!@#$%^&*?";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const ALL_CHARS = LOWERCASE + UPPERCASE + NUMBERS + SYMBOLS;

function getRandomChar(chars) {
  return chars[Math.floor(Math.random() * chars.length)];
}

function shuffleString(value) {
  return value
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function hasSequentialChars(value) {
  const lower = value.toLowerCase();

  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  return sequences.some((seq) => {
    for (let i = 0; i <= seq.length - 4; i++) {
      const chunk = seq.slice(i, i + 4);
      const reversed = chunk.split("").reverse().join("");

      if (lower.includes(chunk) || lower.includes(reversed)) {
        return true;
      }
    }

    return false;
  });
}

function hasRepeatedRun(value) {
  return /(.)\1{3,}/.test(value);
}

function isMostlyRepeated(value) {
  if (!value) return false;

  const uniqueChars = new Set(value.toLowerCase()).size;
  const uniqueRatio = uniqueChars / value.length;

  return value.length >= 8 && uniqueRatio < 0.35;
}

function getCharTypes(password) {
  return {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}

function estimateEntropy(password) {
  if (!password) return 0;

  const { hasLower, hasUpper, hasNumber, hasSymbol } = getCharTypes(password);

  let pool = 0;

  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasNumber) pool += 10;
  if (hasSymbol) pool += 32;

  let entropy = password.length * Math.log2(Math.max(pool, 1));
  const lower = password.toLowerCase();

  if (COMMON_PASSWORDS.includes(lower)) entropy -= 70;
  if (password.length < 8) entropy -= 55;
  else if (password.length < 12) entropy -= 25;

  if (/^[0-9]+$/.test(password)) entropy -= 45;
  if (/^[a-zA-Z]+$/.test(password)) entropy -= 25;

  if (hasSequentialChars(password)) entropy -= password.length >= 16 ? 8 : 25;
  if (hasRepeatedRun(password)) entropy -= password.length >= 16 ? 6 : 25;
  if (isMostlyRepeated(password)) entropy -= 45;

  return Math.max(0, Math.round(entropy));
}

function crackDifficultyLabel(password, score, entropy) {
  if (!password) return "Not tested";
  if (score >= 8 && entropy >= 70) return "Hard to crack";
  if (score >= 5 && entropy >= 40) return "Medium to crack";
  return "Easy to crack";
}

function analyzePassword(password) {
  const entropy = estimateEntropy(password);
  const lower = password.toLowerCase();

  const { hasLower, hasUpper, hasNumber, hasSymbol } = getCharTypes(password);

  const isCommon = COMMON_PASSWORDS.includes(lower);
  const isNumbersOnly = /^[0-9]+$/.test(password);
  const isLettersOnly = /^[a-zA-Z]+$/.test(password);
  const isVeryShort = password.length > 0 && password.length < 8;
  const isShort = password.length > 0 && password.length < 12;
  const hasSequence = hasSequentialChars(password);
  const hasRepeats = hasRepeatedRun(password);
  const mostlyRepeated = isMostlyRepeated(password);

  const typeCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(
    Boolean
  ).length;

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 2;
  if (password.length >= 16) score += 1;
  if (password.length >= 24) score += 1;
  if (password.length >= 40) score += 1;

  if (hasLower) score += 1;
  if (hasUpper) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 2;

  if (typeCount >= 3) score += 1;
  if (typeCount === 4) score += 1;

  if (entropy >= 45) score += 1;
  if (entropy >= 70) score += 1;
  if (entropy >= 100) score += 1;

  if (isCommon) score = Math.min(score, 1);
  if (isVeryShort) score = Math.min(score, 1);

  if (isNumbersOnly) {
    score = Math.min(score, password.length >= 16 ? 4 : 1);
  }

  if (isLettersOnly) {
    score = Math.min(score, password.length >= 20 ? 5 : 3);
  }

  if (mostlyRepeated) {
    score = Math.min(score, password.length >= 16 ? 4 : 2);
  }

  if (hasSequence && password.length < 14) {
    score = Math.min(score, 3);
  }

  if (hasRepeats && password.length < 12) {
    score = Math.min(score, 2);
  }

  if (isShort && (hasSequence || hasRepeats || isNumbersOnly || isCommon)) {
    score = Math.min(score, 2);
  }

  score = Math.max(0, Math.min(10, score));

  let label = "Very Weak";

  if (score >= 8) label = "Strong";
  else if (score >= 6) label = "Good";
  else if (score >= 4) label = "Medium";
  else if (score >= 2) label = "Weak";

  const checks = [
    {
      label: "At least 12 characters",
      passed: password.length >= 12,
    },
    {
      label: "Uses uppercase letters",
      passed: hasUpper,
    },
    {
      label: "Uses lowercase letters",
      passed: hasLower,
    },
    {
      label: "Uses numbers",
      passed: hasNumber,
    },
    {
      label: "Uses symbols",
      passed: hasSymbol,
    },
    {
      label: "Avoids common passwords",
      passed: !isCommon && password.length > 0,
    },
    {
      label: "Avoids simple sequences",
      passed: password.length > 16 || (!hasSequence && password.length > 0),
    },
    {
      label: "Avoids mostly repeated characters",
      passed: !mostlyRepeated && password.length > 0,
    },
  ];

  const suggestions = [];

  if (!password) {
    suggestions.push("Type a password to get instant coaching.");
  }

  if (password && password.length < 8) {
    suggestions.push("This is much too short. Use at least 12 characters.");
  } else if (password && password.length < 12) {
    suggestions.push("Make it at least 12 characters long.");
  }

  if (isCommon) {
    suggestions.push("Avoid common passwords that attackers try first.");
  }

  if (isNumbersOnly) {
    suggestions.push(
      "Do not use only numbers. Add letters, uppercase characters, and symbols."
    );
  }

  if (isLettersOnly) {
    suggestions.push("Do not use only letters. Add numbers and symbols.");
  }

  if (!hasUpper) {
    suggestions.push("Add at least one uppercase letter.");
  }

  if (!hasLower) {
    suggestions.push("Add at least one lowercase letter.");
  }

  if (!hasNumber) {
    suggestions.push("Add at least one number.");
  }

  if (!hasSymbol) {
    suggestions.push("Add a symbol like !, @, #, or ?.");
  }

  if (hasSequence && password.length < 16) {
    suggestions.push("Avoid obvious sequences like 1234, abcd, or qwerty.");
  }

  if (mostlyRepeated) {
    suggestions.push("Avoid passwords made mostly from repeated characters.");
  }

  if (hasRepeats && !mostlyRepeated && password.length < 16) {
    suggestions.push("Avoid repeated character runs like aaaa or 1111.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Nice! This password has a strong structure.");
  }

  return {
    entropy,
    score,
    label,
    checks,
    suggestions,
    crackDifficulty: crackDifficultyLabel(password, score, entropy),
  };
}

function generatePassword() {
  let password = "";

  password += getRandomChar(UPPERCASE);
  password += getRandomChar(LOWERCASE);
  password += getRandomChar(NUMBERS);
  password += getRandomChar(SYMBOLS);

  while (password.length < 18) {
    password += getRandomChar(ALL_CHARS);
  }

  return shuffleString(password);
}

function improvePassword(password) {
  const cleaned = password.replace(/[^A-Za-z0-9]/g, "").slice(0, 8);

  const base =
    cleaned.length >= 4
      ? cleaned[0].toUpperCase() + cleaned.slice(1).toLowerCase()
      : "Secure";

  const helperWords = [
    "Guard",
    "Vault",
    "Shield",
    "Key",
    "Lock",
    "Safe",
    "Cyber",
    "Trust",
  ];

  const word = helperWords[Math.floor(Math.random() * helperWords.length)];
  const number = Math.floor(100 + Math.random() * 900);
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  return `${base}-${word}${symbol}${number}`;
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a18.45 18.45 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function App() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => analyzePassword(password), [password]);
  const scorePercent = analysis.score * 10;

  const copyPassword = async () => {
    if (!password) return;

    await navigator.clipboard.writeText(password);
    setCopied(true);

    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10">
        <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <div className="flex items-center gap-4 md:gap-5">
  <img
    src="/LockWise1.png"
    alt="LockWise logo"
    className="h-24 w-24 shrink-0 rounded-2xl object-contain md:h-28 md:w-28"
  />

  <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 md:text-4xl">
    LockWise:
    <br />
    <span className="text-cyan-600">Strong Password Coach</span>
  </h2>
</div>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Type a password and get instant feedback, crack difficulty,
              safety checks, and smart suggestions. All analysis runs in your
              browser. Nothing is uploaded for security and privacy reasons.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Current rating
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {password.length === 0 ? "Not tested" : analysis.label}
                </h2>
              </div>

              <div>
                {password.length === 0 ? null : analysis.score >= 8 ? (
                  <span className="text-4xl">✅</span>
                ) : analysis.score >= 4 ? (
                  <span className="text-4xl">⚠️</span>
                ) : (
                  <span className="text-3xl">❌</span>
                )}
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{ width: `${scorePercent}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-slate-500">Score</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analysis.score}/10
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-slate-500">Crack difficulty</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analysis.crackDifficulty}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-slate-950">
                Test your password
              </h3>
            </div>

            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter a password..."
                className="w-full rounded-2xl border-2 border-slate-300 bg-cyan-50/40 px-4 py-4 pr-24 text-lg text-slate-950 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-14 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>

              <button
                type="button"
                onClick={copyPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Copy password"
                title="Copy password"
              >
                <CopyIcon />
              </button>
            </div>

            {copied && (
              <p className="mt-2 text-sm text-cyan-700">
                Copied to clipboard.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setPassword(generatePassword())}
                className="rounded-2xl bg-cyan-500/90 px-5 py-3 font-medium text-white hover:bg-cyan-500"
              >
                Generate strong password
              </button>

              <button
                onClick={() => setPassword(improvePassword(password))}
                className="rounded-2xl bg-slate-800 px-5 py-3 font-medium text-white hover:bg-slate-900"
              >
                Fix my password
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3">
                  {analysis.checks.map((check) => (
                    <div
                      key={check.label}
                      className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <span className="text-sm text-slate-700">
                        {check.label}
                      </span>

                      <span>{check.passed ? "✅" : "❌"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <h2 className="text-2xl font-semibold text-slate-950">
              Smart suggestions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quick tips to make the password safer and easier to explain in
              your demo.
            </p>

            <div className="mt-5 space-y-3">
              {analysis.suggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
                  <p>{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
          <h3 className="font-semibold text-cyan-800">Privacy-first</h3>
          <p className="mt-1 text-sm text-slate-600">
            Password analysis happens locally in the browser.
          </p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
