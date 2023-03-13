import { eventBusTriggers } from '../eventBus';

export const initImportantStuff = (): void => {
	// setInterval(() => {
	// 	console.log(
	// 		'listeners',
	// 		Object.entries(CORE_EVENTS).reduce<string[]>((prev, [key]) => {
	// 			prev.push(`${key} - ${EVENT_EMITTER.listenerCount(key)}`);
	// 			return prev;
	// 		}, [])
	// 	);
	// }, 1000);

	const updateSize = (): void => {
		eventBusTriggers.triggerOnResize({
			width: window.innerWidth,
			height: window.innerHeight,
		});
	};

	window.addEventListener('resize', updateSize);

	let then = 0;
	const tick = (now: number): void => {
		now *= 0.001;
		const delta = now - then;
		then = now;

		eventBusTriggers.triggerOnTick({ time: performance.now() / 1000, delta });

		window.requestAnimationFrame(tick);
	};
	window.requestAnimationFrame(tick);
};
