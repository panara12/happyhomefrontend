import React from 'react'
import { ArrowLeft, LogIn } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const colors = {
  ink: "#1E2939",
  muted: "#4B5D78",
  line: "#E7E2D6",
  accent1: "#E76900",
  accent2: "#F15400",
  accentSoft: "#FFE9D2",
  accentSoftLine: "#F7CFA0",
};

export default function NotFound({ onSignIn, onGoBack }) {
  const navigate = useNavigate();
  const handleGoBack = onGoBack || (() => window.history.back());
  const handleSignIn = () => {
    navigate('/login', {replace:true})
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-10"
      style={{
        background:
          "linear-gradient(135deg, #FFFAEA 0%, #FFF4DF 45%, #FFEDD5 100%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@700;800&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      <div
        className="relative w-full max-w-md bg-white rounded-3xl px-10 pt-11 pb-10"
        style={{
          boxShadow:
            "0 24px 60px -18px rgba(30,41,57,0.22), 0 2px 8px rgba(30,41,57,0.04)",
        }}
      >
        {/* Back link */}
        <button
          onClick={handleGoBack}
          className="font-inter inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style={{ color: colors.muted }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go back
        </button>

        {/* Icon badge */}
        <div className="flex justify-center mb-6">
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 30%, #FFF3E2, ${colors.accentSoft})`,
            }}
          >
            <span
              className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none"
              style={{ border: `1.5px solid ${colors.accentSoftLine}`, opacity: 0.5 }}
            />
            <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="doorGradient404" x1="0" y1="0" x2="64" y2="0">
                  <stop offset="0" stopColor={colors.accent1} />
                  <stop offset="1" stopColor={colors.accent2} />
                </linearGradient>
              </defs>
              <path
                d="M11 58V31L32 12L53 31V58H11Z"
                stroke="url(#doorGradient404)"
                strokeWidth="3.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <text
                x="32"
                y="47"
                textAnchor="middle"
                fontSize="24"
                fontWeight="800"
                fontFamily="Poppins, sans-serif"
                fill="url(#doorGradient404)"
              >
                ?
              </text>
            </svg>
          </div>
        </div>

        {/* Eyebrow */}
        <span
          className="font-poppins block text-center text-xs font-bold tracking-widest uppercase w-fit mx-auto mb-4 px-3.5 py-1.5 rounded-full"
          style={{ color: colors.accent1, background: colors.accentSoft }}
        >
          Error 404
        </span>

        {/* Heading */}
        <h1
          className="font-poppins text-center font-extrabold text-2xl sm:text-3xl mb-2.5"
          style={{ color: colors.ink, letterSpacing: "-0.01em" }}
        >
          Page not found
        </h1>

        {/* Description */}
        <p
          className="font-inter text-center text-sm leading-relaxed max-w-xs mx-auto mb-8"
          style={{ color: colors.muted }}
        >
          The page you're looking for isn't in{" "}
          <span className="font-semibold" style={{ color: colors.ink }}>
            Happy Home
          </span>
          . It may have been moved, renamed, or never existed. Try heading
          back, or sign in again.
        </p>

        <div className="h-px mb-7" style={{ background: colors.line }} />

        {/* Primary CTA */}
        <button
          onClick={handleSignIn}
          className="font-poppins w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-white font-bold text-base transition-all hover:brightness-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(90deg, ${colors.accent1}, ${colors.accent2})`,
            boxShadow: "0 12px 24px -10px rgba(230,80,0,0.55)",
          }}
        >
          <LogIn className="w-5 h-5" />
          Sign in to continue
        </button>

        {/* Footnote */}
        <p
          className="font-inter text-center text-sm mt-5"
          style={{ color: colors.muted }}
        >
          Still can't find it?{" "}
          <a
            href="#"
            className="font-semibold hover:underline"
            style={{ color: colors.accent2 }}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}