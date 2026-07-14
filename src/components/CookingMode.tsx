import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, ChevronRight, ChevronLeft, Check, Timer } from "lucide-react";
import { Recipe } from "../types";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onComplete?: (recipe: Recipe) => void;
}

export default function CookingMode({ recipe, onClose, onComplete }: CookingModeProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Timer States
  const [timerDuration, setTimerDuration] = useState<number | null>(null); // in seconds
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerIntervalRef = useRef<any>(null);

  const stepText = recipe.steps[currentStepIdx];

  // Stop speech when step changes
  useEffect(() => {
    stopSpeech();
    detectAndSetTimer();
    return () => stopSpeech();
  }, [currentStepIdx]);

  // Audio tone generation for timer completed (to avoid missing assets)
  const playTimerBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Triple beep
      const playBeep = (delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.35);
      };

      playBeep(0);
      playBeep(0.4);
      playBeep(0.8);
    } catch (e) {
      console.error("Timer beep failed:", e);
    }
  };

  // Auto-detect and set cooking timer from step instructions
  const detectAndSetTimer = () => {
    // Look for numbers followed by minutes (e.g., "5 minutes", "10-12 mins", "3 min")
    const match = stepText.match(/(\d+)\s*(?:-|to)\s*\d+\s*(?:minute|min)/i) || stepText.match(/(\d+)\s*(?:minute|min)/i);
    
    // Clear existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setTimerActive(false);

    if (match && match[1]) {
      const minutes = parseInt(match[1], 10);
      setTimerDuration(minutes * 60);
      setTimerRemaining(minutes * 60);
    } else {
      setTimerDuration(null);
      setTimerRemaining(0);
    }
  };

  // Timer tick effect
  useEffect(() => {
    if (timerActive && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            clearInterval(timerIntervalRef.current);
            playTimerBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive, timerRemaining]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    if (timerDuration !== null) {
      setTimerRemaining(timerDuration);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // TTS speech functions
  const speakStep = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // cancel any active speech

      if (isMuted) return;

      // Filter text to speak step cleanly
      const prefix = `Step ${currentStepIdx + 1}. `;
      const utterance = new SpeechSynthesisUtterance(prefix + stepText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      // Immediately speak the step upon unmuting
      setTimeout(() => {
        speakStep();
      }, 50);
    } else {
      setIsMuted(true);
      stopSpeech();
    }
  };

  const handleNext = () => {
    if (currentStepIdx < recipe.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  // Speak step on mounting or when starting first step
  useEffect(() => {
    speakStep();
    return () => stopSpeech();
  }, [currentStepIdx, isMuted]);

  return (
    <div id="cooking-mode" className="fixed inset-0 bg-[#0A0A0A] text-white z-50 flex flex-col justify-between p-6 md:p-12 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="p-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-2xl border border-white/5 transition-all cursor-pointer"
            title="Leave cooking mode"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-lime-400 font-mono">Step-by-Step Companion</span>
            <h2 className="text-base md:text-lg font-bold truncate max-w-md mt-0.5">{recipe.name}</h2>
          </div>
        </div>

        {/* Read-Aloud controls */}
        <button
          onClick={toggleMute}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
            isMuted
              ? "bg-rose-950/40 border-rose-800/40 text-rose-300"
              : "bg-zinc-900 border-white/10 text-lime-400"
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />}
          <span className="hidden sm:inline">{isMuted ? "Voice: Off" : isSpeaking ? "Speaking..." : "Read Aloud: On"}</span>
        </button>
      </div>

      {/* Main Focus Zone */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full my-8 space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold tracking-wider font-mono">
            <span>COOKING PROGRESS</span>
            <span>STEP {currentStepIdx + 1} OF {recipe.steps.length}</span>
          </div>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-lime-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIdx + 1) / recipe.steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Instruction Display */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 md:p-12 relative flex flex-col justify-between gap-8 shadow-2xl min-h-[300px]">
          {/* Big display Step text */}
          <div className="space-y-4">
            <span className="text-lime-400 font-extrabold text-lg md:text-xl tracking-tight font-mono">Step {currentStepIdx + 1}</span>
            <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-relaxed text-white font-sans">
              {stepText}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/5">
            {/* Repeat step button */}
            <button
              onClick={speakStep}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-lime-400 transition-colors font-bold cursor-pointer"
              title="Speak instruction again"
            >
              <Volume2 className="w-4 h-4 text-lime-400" />
              <span>Repeat Voice Prompt</span>
            </button>

            {/* Step helper details */}
            <span className="text-xs text-zinc-600 font-medium tracking-wide">
              *Read-aloud plays automatically on step changes
            </span>
          </div>
        </div>

        {/* Dynamic Timer Area (Sauté timer, baking timer etc.) */}
        {timerDuration !== null && (
          <div className="bg-[#0D0D0D] border border-lime-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md mx-auto w-full shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${timerActive ? "bg-lime-950/40 text-lime-400 animate-pulse" : "bg-zinc-900 text-zinc-500"}`}>
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Step Timer</h4>
                <p className="text-xs text-zinc-500 font-medium">Automatic countdown detected</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Countdown */}
              <span className="font-mono text-2xl font-bold tracking-tight text-lime-400">
                {formatTime(timerRemaining)}
              </span>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTimer}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    timerActive
                      ? "bg-amber-400 hover:bg-amber-300 text-black"
                      : "bg-lime-400 hover:bg-lime-300 text-black"
                  }`}
                  title={timerActive ? "Pause Timer" : "Start Timer"}
                >
                  {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-between border-t border-white/5 pt-6 max-w-4xl mx-auto w-full">
        {/* Back */}
        <button
          onClick={handleBack}
          disabled={currentStepIdx === 0}
          className="flex items-center gap-2 py-3 px-5 bg-zinc-900 hover:bg-zinc-850 disabled:bg-[#0A0A0A] disabled:text-zinc-700 disabled:cursor-not-allowed font-extrabold rounded-2xl border border-white/5 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        {/* Complete/Next */}
        {currentStepIdx === recipe.steps.length - 1 ? (
          <button
            onClick={() => {
              stopSpeech();
              if (onComplete) {
                onComplete(recipe);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-2 py-3 px-6 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-2xl shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Finish Cooking</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 py-3 px-6 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-2xl shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Next Step</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
