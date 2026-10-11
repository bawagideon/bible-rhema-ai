
export type SoundscapeCategory = 'Nature' | 'Instrumental' | 'Focus' | 'Meditation';

export interface Soundscape {
    id: string;
    name: string;
    category: SoundscapeCategory;
    url: string;
    description?: string;
}

export const SOUNDSCAPES: Soundscape[] = [
    { id: 'rain', name: 'Latter Rain', category: 'Nature', description: 'Gentle rainfall for contemplation', url: 'https://cdn.pixabay.com/download/audio/2022/07/04/audio_3d6860ba52.mp3' },
    { id: 'piano', name: 'Secret Place', category: 'Instrumental', description: 'Peaceful piano chords for devotion', url: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_c8c8a73467.mp3' },
    { id: 'drone', name: 'Deep Calls', category: 'Meditation', description: 'Deep ambient resonance for soaking prayer', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_6595d286a0.mp3' },
    { id: 'lofi', name: 'Work & Worship', category: 'Focus', description: 'Calm rhythms for focused study', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbfcb6.mp3' }
];

export const getSoundscape = (id: string) => SOUNDSCAPES.find(s => s.id === id);
