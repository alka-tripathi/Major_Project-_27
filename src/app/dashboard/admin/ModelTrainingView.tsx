"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, ServerCrash, Cpu, FileText, Image as ImageIcon } from "lucide-react";

export default function ModelTrainingView() {
  const [modelType, setModelType] = useState("segmentation");
  const [isTraining, setIsTraining] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [wsError, setWsError] = useState("");
  
  const ws = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const startTraining = () => {
    if (ws.current) {
      ws.current.close();
    }
    
    setLogs([]);
    setMetrics({});
    setLatestImage(null);
    setWsError("");
    setIsTraining(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const wsUrl = backendUrl.replace(/^http/, 'ws') + `/ws/train/${modelType}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setLogs(prev => [...prev, `[SYSTEM] Connected to training server for ${modelType} model.`]);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.log) {
          setLogs(prev => [...prev, data.log]);
        } else if (data.epoch) {
          setMetrics(data.metrics || {});
          if (data.image_base64) {
            setLatestImage(`data:image/png;base64,${data.image_base64}`);
          }
          setLogs(prev => [...prev, `[EPOCH ${data.epoch}] Metrics updated.`]);
        } else if (data.done) {
          setLogs(prev => [...prev, `[SYSTEM] Training completed successfully.`]);
          setIsTraining(false);
        } else if (data.error) {
          setWsError(data.error);
          setIsTraining(false);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.current.onerror = (error) => {
      setWsError("WebSocket connection failed. Ensure the FastAPI backend is running.");
      setIsTraining(false);
    };

    ws.current.onclose = () => {
      setLogs(prev => [...prev, `[SYSTEM] Connection closed.`]);
      setIsTraining(false);
    };
  };

  const stopTraining = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsTraining(false);
    setLogs(prev => [...prev, `[SYSTEM] Training forcefully stopped by user.`]);
  };

  useEffect(() => {
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-3xl p-8 shadow-xl mt-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Cpu className="w-6 h-6 text-blue-400" />
          Model Training & Fine-Tuning
        </h2>
        
        <div className="flex gap-4">
          <select 
            className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            disabled={isTraining}
          >
            <option value="segmentation">Segmentation (Attention U-Net)</option>
            <option value="classification">Classification (EfficientNetB3)</option>
          </select>
          
          {!isTraining ? (
            <button 
              onClick={startTraining}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-medium transition-colors"
            >
              <Play className="w-4 h-4" /> Start Training
            </button>
          ) : (
            <button 
              onClick={stopTraining}
              className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 px-5 py-2 rounded-xl font-medium transition-colors"
            >
              <Square className="w-4 h-4 fill-current" /> Stop
            </button>
          )}
        </div>
      </div>

      {wsError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
          <ServerCrash className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{wsError}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Logs and Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Metrics Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(metrics).length > 0 ? (
              Object.entries(metrics).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{key}</p>
                  <p className="text-xl font-mono text-zinc-200">{Number(value).toFixed(4)}</p>
                </div>
              ))
            ) : (
              <div className="col-span-4 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-center text-zinc-500 text-sm">
                Waiting for first epoch metrics...
              </div>
            )}
          </div>

          {/* Console Output */}
          <div className="bg-black border border-zinc-800 rounded-xl flex-1 min-h-[300px] max-h-[500px] flex flex-col overflow-hidden relative">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-mono text-zinc-400">training_output.log</span>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-zinc-300 flex-1 space-y-1">
              {logs.length === 0 ? (
                <span className="text-zinc-600">No output yet. Click 'Start Training'.</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={log.includes("[SYSTEM]") ? "text-blue-400" : log.includes("EPOCH") ? "text-emerald-400" : ""}>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Col: Live Image Preview */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Live Validation Output</span>
          </div>
          
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden min-h-[250px] relative group">
            {latestImage ? (
              <img src={latestImage} alt="Live Output" className="w-full h-full object-contain" />
            ) : (
              <div className="text-zinc-600 text-sm text-center px-4">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                Images will appear here at the end of each epoch.
              </div>
            )}
            
            {latestImage && isTraining && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">LIVE</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-zinc-500 text-center mt-4">
            {modelType === "segmentation" ? "Overlay: Prediction (Red)" : "Overlay: Grad-CAM Heatmap"}
          </p>
        </div>
      </div>
    </div>
  );
}
