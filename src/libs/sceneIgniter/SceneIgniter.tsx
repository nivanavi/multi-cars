import React, { useContext } from 'react';

export type SceneIgniterContextType = {
	canvas: HTMLCanvasElement | null;
};

export type SceneIgniterProps = {
	children?: React.ReactNode;
};

const SceneIgniterContext = React.createContext<SceneIgniterContextType>({} as SceneIgniterContextType);
export const useSceneIgniterContext = (): SceneIgniterContextType => useContext(SceneIgniterContext);

export const SceneIgniterContextProvider: React.FC<SceneIgniterProps> = React.memo(props => {
	const { children } = props;
	const refCanvas = React.useRef<HTMLCanvasElement | null>(null);
	const [stateCanvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

	React.useEffect(() => {
		if (!refCanvas.current) return;
		setCanvas(refCanvas.current);
	}, []);

	const contextValue: SceneIgniterContextType = React.useMemo(
		() => ({
			canvas: stateCanvas,
		}),
		[stateCanvas]
	);

	return (
		<SceneIgniterContext.Provider value={contextValue}>
			<canvas ref={refCanvas} />
			{stateCanvas ? children : null}
		</SceneIgniterContext.Provider>
	);
});
