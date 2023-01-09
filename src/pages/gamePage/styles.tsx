import styled from 'styled-components';

export const StyledCarControlsWrapper = styled.div`
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 10px;

	button {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		border: 2px solid #5b3197;
		background: unset;
		color: white;
	}
`;
export const StyledCarSteering = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-start;

	button:first-child {
		margin-right: 10px;
	}
`;
export const StyledCarAcceleration = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	button {
		margin-top: 10px;
	}
`;

export const StyledCarAccelerationForward = styled.div`
	display: flex;
	align-items: center;
	button:first-child {
		margin-right: 10px;
	}
`;
