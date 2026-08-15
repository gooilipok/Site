import fs from 'fs';
import path from 'path';

// Generate a high quality 16-bit PCM WAV audio file with dual-tone industrial emergency siren
function generateSirenWav(durationSeconds = 6, sampleRate = 44100) {
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;

    // Siren LFO: oscillate between 600Hz and 1000Hz (cycle of 1.2 seconds)
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.85 * t);
    const freq = 600 + 400 * lfo;

    // Primary wave + harmonics + sub-bass
    const phase = 2 * Math.PI * freq * t;
    const wave = 
      0.6 * Math.sin(phase) +
      0.25 * Math.sin(phase * 2) +
      0.15 * Math.sin(phase * 3) +
      0.3 * Math.sin(2 * Math.PI * 120 * t); // sub-bass rumble

    // Pulsing klaxon effect every 0.3s
    const pulse = 0.8 + 0.2 * Math.sin(2 * Math.PI * 3.33 * t);

    // Fade in and out
    let envelope = 1.0;
    if (t < 0.1) envelope = t / 0.1;
    if (t > durationSeconds - 0.4) envelope = (durationSeconds - t) / 0.4;

    const sample = Math.max(-1, Math.min(1, wave * pulse * envelope * 0.85));
    const intSample = Math.floor(sample * 32767);

    // Left channel
    buffer.writeInt16LE(intSample, offset);
    // Right channel (slight stereo phase offset)
    const rightSample = Math.max(-1, Math.min(1, wave * pulse * envelope * 0.85 * (0.9 + 0.1 * Math.sin(t * 5))));
    buffer.writeInt16LE(Math.floor(rightSample * 32767), offset + 2);

    offset += 4;
  }

  return buffer;
}

const wavBuffer = generateSirenWav(6.5);

// Write to root
fs.writeFileSync(path.join(process.cwd(), 'alarm.wav'), wavBuffer);
fs.writeFileSync(path.join(process.cwd(), 'alarm.mp3'), wavBuffer);

// Write to public
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'alarm.wav'), wavBuffer);
fs.writeFileSync(path.join(publicDir, 'alarm.mp3'), wavBuffer);

console.log('Successfully created alarm audio files (alarm.wav, alarm.mp3) in root and public directory.');
