import React, { useState, useEffect, useRef } from "react";
import { Upload, Camera, FileImage, Sparkles, CheckCircle } from "lucide-react";

interface FridgeUploaderProps {
  onAnalyze: (payload: { image?: string; sampleKey?: string }) => void;
  isAnalyzing: boolean;
}

const LOADING_MESSAGES = [
  "Opening the refrigerator door...",
  "Scanning the shelves...",
  "Peering into the crisper drawer...",
  "Counting the eggs...",
  "Reading condiment jar labels...",
  "Cataloging fresh produce...",
  "Checking the cheese compartment...",
  "Whipping up creative culinary combinations...",
  "Perfecting difficulty ratings and calories..."
];

export default function FridgeUploader({ onAnalyze, isAnalyzing }: FridgeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading messages when analyzing
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onAnalyze({ image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSampleSelect = (key: "vegetables" | "protein") => {
    onAnalyze({ sampleKey: key });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="fridge-uploader" className="w-full bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-lime-400" />
          <span>Scan Your Fridge</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Take a photo of your open fridge, upload an image, or try one of our delicious sample setups below.
        </p>
      </div>

      {isAnalyzing ? (
        <div className="border border-white/5 rounded-2xl bg-lime-400/5 py-12 px-6 flex flex-col items-center justify-center text-center gap-5 min-h-[280px]">
          <div className="relative flex items-center justify-center">
            {/* Spinning outward rings */}
            <div className="absolute w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute w-20 h-20 border-4 border-white/10 border-b-transparent rounded-full animate-spin [animation-duration:3s]"></div>
            <Upload className="w-7 h-7 text-lime-400 animate-bounce" />
          </div>
          
          <div className="space-y-1 mt-2">
            <h4 className="font-bold text-lime-200 text-base">Gemini is Analyzing...</h4>
            <p className="text-sm text-lime-400 font-medium italic transition-all duration-300">
              "{LOADING_MESSAGES[loadingMsgIdx]}"
            </p>
          </div>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            Please keep this window open while the culinary intelligence scans your ingredients and designs customized recipes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Upload Box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border border-dashed rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] ${
              dragActive
                ? "border-lime-400 bg-lime-400/5 scale-[1.01]"
                : "border-white/10 bg-white/2 hover:bg-white/5 hover:border-white/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            
            <div className="p-4 bg-lime-400/10 text-lime-400 rounded-full mb-4">
              <Upload className="w-7 h-7" />
            </div>

            <p className="font-bold text-zinc-300 text-sm">
              Drag and drop your fridge photo here, or <span className="text-lime-400 hover:text-lime-300 underline decoration-2 underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Supports JPEG, PNG, HEIC up to 10MB
            </p>
          </div>

          {/* Preset Samples */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Or try with a sample fridge</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sample 1: Veggies */}
              <button
                onClick={() => handleSampleSelect("vegetables")}
                className="group relative flex items-center gap-4 p-3 bg-white/2 border border-white/5 hover:border-lime-400/30 hover:bg-lime-400/5 text-left rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <div className="w-16 h-16 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform" style={{ backgroundImage: "url('/src/assets/images/fridge_vegetables_1784068930018.jpg')" }}></div>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-lime-400 transition-colors">Sample 1: Garden Fresh</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Vibrant fresh vegetables, eggs, greens & condiments</p>
                </div>
              </button>

              {/* Sample 2: Protein */}
              <button
                onClick={() => handleSampleSelect("protein")}
                className="group relative flex items-center gap-4 p-3 bg-white/2 border border-white/5 hover:border-lime-400/30 hover:bg-lime-400/5 text-left rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <div className="w-16 h-16 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform" style={{ backgroundImage: "url('/src/assets/images/fridge_protein_1784068941426.jpg')" }}></div>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-lime-400 transition-colors">Sample 2: High Protein</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Cheese, yogurt, chicken, eggs & berries</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
