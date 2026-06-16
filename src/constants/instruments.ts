export type InstrumentConfig = {
  icon: string;
  color: string;
};

export const INSTRUMENT_CONFIG: Record<string, InstrumentConfig> = {
  Guitarra:    { icon: '🎸', color: '#f97316' },
  Bajo:        { icon: '🎸', color: '#a855f7' },
  Batería:     { icon: '🥁', color: '#ef4444' },
  Cajón:       { icon: '🥁', color: '#dc2626' },
  Percusión:   { icon: '🪘', color: '#b45309' },
  Teclado:     { icon: '🎹', color: '#3b82f6' },
  Piano:       { icon: '🎹', color: '#60a5fa' },
  Voz:         { icon: '🎤', color: '#ec4899' },
  Violín:      { icon: '🎻', color: '#f59e0b' },
  Contrabajo:  { icon: '🎻', color: '#8b5cf6' },
  Saxofón:     { icon: '🎷', color: '#eab308' },
  Trompeta:    { icon: '🎺', color: '#f97316' },
};

export const DEFAULT_INSTRUMENT: InstrumentConfig = { icon: '🎵', color: '#6b7280' };

export function getInstrumentConfig(instrument: string): InstrumentConfig {
  return INSTRUMENT_CONFIG[instrument] ?? DEFAULT_INSTRUMENT;
}
