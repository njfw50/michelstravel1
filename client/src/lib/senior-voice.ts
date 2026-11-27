/* Voz natural da Mia — Terminal Senior (Rodada 6, 26/nov).
 *
 * Pipeline real: só Web Speech API do navegador
 * (window.speechSynthesis + SpeechSynthesisUtterance). Não há TTS
 * de servidor: o /api/senior/chat devolve TEXTO e o navegador fala.
 * O problema: o speak antigo não escolhia voz (caía na voz padrão
 * do sistema, em geral robótica), rate fixo 0.95 sem pitch, e cada
 * frase saía de uma vez, sem respiração — soava mecânico.
 *
 * Recomendação Gemini (gemini-3.5-flash, 26/nov — única chamada que
 * respondeu; a de cor falhou 4x):
 *  - pt-BR rate 0.85 / pitch 1.0; es-ES rate 0.80 / pitch 1.0;
 *    en-US rate 0.85 / pitch 0.98 (espanhol é mais denso por
 *    segundo; inglês levemente mais grave soa acolhedor).
 *  - Voz: preferir Natural/Neural > Google > Microsoft > Luciana
 *    (iOS) > primeira do idioma; aguardar `voiceschanged` — o
 *    Chrome devolve [] na primeira chamada a getVoices().
 *  - Pausas: fim de frase (. ! ? ;) = 500ms; vírgula/dois-pontos =
 *    250ms; falar em sequência (onend + setTimeout), nunca tudo
 *    de uma vez. O fatiamento também contorna o bug do Chrome que
 *    trava utterances longas (>~15s) — cada trecho é curto.
 *  - Desvio declarado: o hífen NÃO é ponto de pausa (Gemini
 *    sugeria 250ms), para não partir palavras hifenizadas
 *    ("bem-vindo"); vírgula e dois-pontos cobrem os respiros.
 *
 * O que NÃO foi feito (pendente de decisão do dono): voz neural de
 * servidor (Google Cloud TTS / ElevenLabs / OpenAI) — seria a voz
 * mais humana de verdade, mas exige serviço pago + chave nova, e
 * nada foi contratado. Ver ata da rodada 6.
 */

export type VoiceLang = "pt-BR" | "en-US" | "es-ES";

const VOICE_PARAMS: Record<VoiceLang, { rate: number; pitch: number }> = {
  "pt-BR": { rate: 0.85, pitch: 1.0 },
  "es-ES": { rate: 0.8, pitch: 1.0 },
  "en-US": { rate: 0.85, pitch: 0.98 },
};

const VOICE_PREFERENCE = ["natural", "neural", "google", "microsoft", "luciana"];

type Chunk = { text: string; pauseAfterMs: number };

/* Divide o texto em trechos com pausas naturais. Protege números
   decimais ("2.130,40", "13.5") para o ponto/vírgula decimal não
   virar ponto de respiração. */
function chunkText(text: string): Chunk[] {
  const PROT = "\u0001"; // caractere de controle, nunca aparece em texto normal
  const shielded = text
    .replace(/(\d)\.(\d)/g, `$1${PROT}$2`)
    .replace(/(\d),(\d)/g, `$1${PROT}$2`);
  const restore = (s: string) => s.split(PROT).join("");

  const sentences = shielded.match(/[^.!?;]+[.!?;]+|[^.!?;]+$/g) ?? [shielded];
  const chunks: Chunk[] = [];
  sentences.forEach((sentence) => {
    const subs = sentence.match(/[^,:]+[,:]?/g) ?? [sentence];
    subs.forEach((sub, i) => {
      const trimmed = restore(sub.trim());
      if (!trimmed) return;
      const last = trimmed[trimmed.length - 1];
      const isLastOfSentence = i === subs.length - 1;
      const pauseAfterMs = isLastOfSentence ? (".!?;".includes(last) ? 500 : 0) : 250;
      chunks.push({ text: trimmed, pauseAfterMs });
    });
  });
  return chunks;
}

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const current = synth.getVoices();
  if (current.length > 0) return Promise.resolve(current);
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const done = () => resolve(synth.getVoices());
      synth.addEventListener("voiceschanged", done, { once: true });
      // Se o evento nunca chegar, fala com o que houver.
      window.setTimeout(done, 1500);
    });
  }
  return voicesReady;
}

// Aquece o carregamento das vozes na montagem do Terminal — o
// Chrome só popula getVoices() depois do primeiro acesso.
if (typeof window !== "undefined" && window.speechSynthesis) {
  void loadVoices();
}

export async function pickBestVoice(lang: VoiceLang): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices();
  const base = lang.slice(0, 2).toLowerCase();
  const sameLang = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(base));
  const exact = sameLang.filter((v) => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase());
  const pool = exact.length > 0 ? exact : sameLang;
  for (const pref of VOICE_PREFERENCE) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(pref));
    if (hit) return hit;
  }
  return pool[0] ?? null;
}

let speakToken = 0;
let pendingTimer: number | undefined;

export function stopNaturalSpeech(): void {
  speakToken++;
  if (typeof window !== "undefined") {
    if (pendingTimer !== undefined) {
      window.clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
}

/* Fala o texto em trechos com pausas naturais, na melhor voz do
   idioma. Um speak novo cancela o anterior (mesma semântica do
   cancel() que o Terminal já usava). onEnd só dispara se a fala
   terminar sem cancelamento. */
export function speakNaturally(
  text: string,
  lang: VoiceLang,
  opts?: { onEnd?: () => void },
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const token = ++speakToken;
  synth.cancel();
  const chunks = chunkText(text);
  const params = VOICE_PARAMS[lang] ?? VOICE_PARAMS["pt-BR"];
  let index = 0;

  const speakChunk = (voice: SpeechSynthesisVoice | null) => {
    if (token !== speakToken) return;
    if (index >= chunks.length) {
      opts?.onEnd?.();
      return;
    }
    const chunk = chunks[index++];
    const utter = new SpeechSynthesisUtterance(chunk.text);
    utter.lang = lang;
    if (voice) utter.voice = voice;
    utter.rate = params.rate;
    utter.pitch = params.pitch;
    const next = () => {
      if (token !== speakToken) return;
      pendingTimer = window.setTimeout(() => speakChunk(voice), chunk.pauseAfterMs);
    };
    utter.onend = next;
    utter.onerror = next;
    synth.speak(utter);
  };

  // A voz pode ainda estar carregando — espera o voiceschanged
  // antes de falar, para o primeiro trecho já sair na voz certa.
  void pickBestVoice(lang).then((voice) => {
    if (token !== speakToken) return;
    speakChunk(voice);
  });
}
