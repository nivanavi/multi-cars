import { Howl } from 'howler';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shotgun1Sound from './shotgun/shotgun-1.m4a';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shotgun2Sound from './shotgun/shotgun-2.m4a';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shotgun3Sound from './shotgun/shotgun-3.m4a';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import carHit1Sound from './car/car-hit-1.mp3';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import carHit2Sound from './car/car-hit-2.mp3';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import carHit3Sound from './car/car-hit-3.mp3';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import carHit4Sound from './car/car-hit-4.mp3';
import { eventBusSubscriptions, eventBusUnsubscribe } from '../eventBus/eventBus';
import { TriggerOnPlaySound } from '../eventBus/types';

export type soundTypes = 'shotgun' | 'ball' | 'carHit';

type sounds = {
	name: soundTypes;
	sounds: string[];
	minDelta: number;
	velocityMin: number;
	velocityMultiplier: number;
	volumeMin: number;
	volumeMax: number;
	rateMin: number;
	rateMax: number;
	lastTime: number;
};

const sounds: sounds[] = [
	{
		name: 'shotgun',
		sounds: [shotgun1Sound, shotgun2Sound],
		minDelta: 150,
		velocityMin: 1,
		velocityMultiplier: 0.75,
		volumeMin: 2,
		volumeMax: 3,
		rateMin: 1,
		rateMax: 1,
		lastTime: 0,
	},
	{
		name: 'ball',
		sounds: [shotgun1Sound],
		minDelta: 0,
		velocityMin: 1,
		velocityMultiplier: 0.5,
		volumeMin: 0.35,
		volumeMax: 0.6,
		rateMin: 0.1,
		rateMax: 0.2,
		lastTime: 0,
	},

	{
		name: 'carHit',
		sounds: [carHit1Sound, carHit2Sound, carHit3Sound, carHit4Sound],
		minDelta: 100,
		velocityMin: 2,
		velocityMultiplier: 1,
		volumeMin: 0.3,
		volumeMax: 0.5,
		rateMin: 0.9,
		rateMax: 1,
		lastTime: 0,
	},
];

export const setupSounds = (): {
	destroy: () => void;
} => {
	const soundsWithHowl = sounds.map(sound => ({
		...sound,
		sounds: sound.sounds.map(src => new Howl({ src: [src] })),
	}));

	const playSoundHandler = ({ sound, velocity }: TriggerOnPlaySound): void => {
		const soundItem = soundsWithHowl.find(soundName => soundName.name === sound);
		const currentTime = performance.now();

		if (!soundItem || currentTime < soundItem.lastTime + soundItem.minDelta || velocity < soundItem.velocityMin) return;

		// Find random sound
		const randomSound = soundItem.sounds[Math.floor(Math.random() * soundItem.sounds.length)];

		// Update volume
		let volume = Math.min(
			Math.max((velocity - soundItem.velocityMin) * soundItem.velocityMultiplier, soundItem.volumeMin),
			soundItem.volumeMax
		);
		volume **= 2;
		randomSound.volume(volume);

		// Update rate
		const rateAmplitude = soundItem.rateMax - soundItem.rateMin;
		randomSound.rate(soundItem.rateMin + Math.random() * rateAmplitude);

		// Play
		randomSound.play();

		// Save last play time
		soundItem.lastTime = currentTime;
	};

	eventBusSubscriptions.subscribeOnPlaySound(playSoundHandler);

	return {
		destroy: (): void => {
			eventBusUnsubscribe.unsubscribeOnPlaySound(playSoundHandler);
		},
	};
};
