import { useState, useRef, useEffect, useCallback } from 'react';

function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // process in chunks to avoid max call stack
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

function base64ToPcm(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  const view = new DataView(buffer);
  const pcm = new Float32Array(buffer.byteLength / 2);
  for (let i = 0; i < pcm.length; i++) {
    pcm[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return pcm;
}

export function useLiveApi() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [transcription, setTranscription] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeNodes = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const synthesisBufferRef = useRef<string>('');

  const connect = useCallback(async () => {
    if (status !== 'disconnected') return;
    setStatus('connecting');

    try {
      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setStatus('connected');
        
        // Start Audio Context - Must be 16kHz for Gemini input
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        nextStartTimeRef.current = audioCtx.currentTime;

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
        } catch (err) {
          console.error("Microphone access denied:", err);
          disconnect();
          return;
        }

        const source = audioCtx.createMediaStreamSource(streamRef.current);
        sourceRef.current = source;
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio && audioCtxRef.current) {
          const pcm = base64ToPcm(msg.audio);
          
          const audioBuffer = audioCtxRef.current.createBuffer(1, pcm.length, 16000);
          audioBuffer.getChannelData(0).set(pcm);

          const sourceNode = audioCtxRef.current.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(audioCtxRef.current.destination);

          activeNodes.current.add(sourceNode);
          sourceNode.onended = () => {
            activeNodes.current.delete(sourceNode);
          };

          const startTime = Math.max(audioCtxRef.current.currentTime, nextStartTimeRef.current);
          sourceNode.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        }
        if (msg.text) {
          if (msg.text.includes('[SYNTHESE_START]')) {
            synthesisBufferRef.current = '';
          } else if (msg.text.includes('[SYNTHESE_END]')) {
            setTranscription(synthesisBufferRef.current);
          } else if (synthesisBufferRef.current !== null) {
            synthesisBufferRef.current += msg.text;
          }
        }
        if (msg.interrupted) {
          activeNodes.current.forEach(node => {
            try { node.stop(); } catch(e) {}
          });
          activeNodes.current.clear();
          
          if (audioCtxRef.current) {
            nextStartTimeRef.current = audioCtxRef.current.currentTime;
          }
        }
      };

      ws.onclose = () => {
        disconnect();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        disconnect();
      };
    } catch (e) {
      console.error(e);
      disconnect();
    }
  }, [status]);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return { status, transcription, connect, disconnect };
}
