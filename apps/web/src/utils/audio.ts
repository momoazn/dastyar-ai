// Utility to convert a recorded media file (e.g., webm/opus) to WAV (mono, 16 kHz)
// and return as a File suitable for server-side transcription.

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

const floatTo16BitPCM = (input: Float32Array): Int16Array => {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = clamp(input[i], -1, 1);
    // Use numeric separators for readability
    out[i] = s < 0 ? s * 0x80_00 : s * 0x7f_ff;
  }
  return out;
};

const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

const encodeWAV = (
  samples: Int16Array,
  sampleRate: number,
  numChannels: number
): ArrayBuffer => {
  const bytesPerSample = 2; // PCM 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  // file length - 8
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, "WAVE");
  // format chunk identifier
  writeString(view, 12, "fmt ");
  // format chunk length
  view.setUint32(16, 16, true); // PCM
  // sample format (raw)
  view.setUint16(20, 1, true); // 1 = PCM
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bytesPerSample * 8, true);
  // data chunk identifier
  writeString(view, 36, "data");
  // data chunk length
  view.setUint32(40, dataSize, true);

  // write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  return buffer;
};

export const fileToWav16kMono = async (file: File): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtxCtor =
    (window as unknown as { AudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtxCtor) {
    throw new Error("AudioContext is not supported in this browser");
  }
  const audioCtx = new AudioCtxCtor();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

  const targetSampleRate = 16_000;
  const numChannels = 1;
  const length = Math.ceil(
    (decoded.length * targetSampleRate) / decoded.sampleRate
  );

  const offlineCtx = new OfflineAudioContext({
    numberOfChannels: numChannels,
    length,
    sampleRate: targetSampleRate,
  });

  const source = offlineCtx.createBufferSource();
  // Mixdown to mono if needed
  let monoBuffer: AudioBuffer;
  if (decoded.numberOfChannels > 1) {
    monoBuffer = offlineCtx.createBuffer(1, decoded.length, decoded.sampleRate);
    const ch0 = monoBuffer.getChannelData(0);
    const chA = decoded.getChannelData(0);
    const chB = decoded.getChannelData(1);
    for (let i = 0; i < decoded.length; i++) {
      ch0[i] = (chA[i] + chB[i]) / 2;
    }
  } else {
    monoBuffer = decoded;
  }

  source.buffer = monoBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const rendered = await offlineCtx.startRendering();

  const samples = rendered.getChannelData(0);
  const pcm16 = floatTo16BitPCM(samples);
  const wavBuffer = encodeWAV(pcm16, targetSampleRate, 1);

  const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
  const wavFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
    type: "audio/wav",
  });

  return wavFile;
};
