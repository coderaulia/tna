import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { ImageSize } from '../types';
import { Loader2, Download, Wand2, Image as ImageIcon } from 'lucide-react';

const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>(ImageSize.Size1K);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGeneratedImage(null);
    try {
      const base64 = await generateImage(prompt, size);
      setGeneratedImage(base64);
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <Wand2 className="w-8 h-8 text-fuchsia-600" />
          Pro Image Studio
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Generate high-fidelity assets for your portfolio or presentations using 
          <span className="font-semibold text-fuchsia-600"> gemini-3-pro-image-preview</span>.
          Select your desired resolution up to 4K.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid md:grid-cols-[1fr,300px] gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Image Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate (e.g., 'A futuristic office space with holographic data displays for a Data Analyst')"
              className="w-full h-32 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all resize-none"
            />
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">Resolution</label>
             <div className="grid grid-cols-3 gap-3">
               {[ImageSize.Size1K, ImageSize.Size2K, ImageSize.Size4K].map((s) => (
                 <button
                   key={s}
                   onClick={() => setSize(s)}
                   className={`py-2 px-4 rounded-lg font-medium text-sm border transition-all ${
                     size === s
                       ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700 ring-1 ring-fuchsia-500'
                       : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                   }`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full py-3 bg-fuchsia-600 text-white rounded-xl font-semibold hover:bg-fuchsia-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Asset'}
          </button>
        </div>

        <div className="flex items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 min-h-[300px] relative overflow-hidden group">
          {generatedImage ? (
            <>
              <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <a 
                   href={generatedImage} 
                   download="generated-asset.png"
                   className="px-6 py-2 bg-white rounded-full text-slate-900 font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
                 >
                   <Download className="w-4 h-4" />
                   Download
                 </a>
              </div>
            </>
          ) : (
            <div className="text-center p-6 text-slate-400">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Creating pixel magic...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p className="font-medium">No image generated yet</p>
                  <p className="text-xs">Enter a prompt to start</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGen;
