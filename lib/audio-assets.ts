export type SoundscapeCategory = 'Nature' | 'Instrumental' | 'Focus' | 'Meditation';

export interface Soundscape {
    id: string;
    name: string;
    category: SoundscapeCategory;
    description: string;
}

export const SOUNDSCAPES: Soundscape[] = [
    { id: 'rain', name: 'Latter Rain', category: 'Nature', description: 'Procedural gentle rainfall for contemplation' },
    { id: 'piano', name: 'Secret Place', category: 'Instrumental', description: 'Harmonic sanctuary pad for prayer' },
    { id: 'drone', name: 'Deep Calls', category: 'Meditation', description: '528Hz soaking prayer drone' },
    { id: 'waters', name: 'Still Waters', category: 'Focus', description: 'Gentle river and ocean wave flow' }
];

export const getSoundscape = (id: string) => SOUNDSCAPES.find(s => s.id === id);
