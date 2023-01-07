import styled from 'styled-components';

export const StyledNotificationsWrapper = styled.div<{ animationTimeout: number }>`
	position: fixed;
	right: 5rem;
	bottom: 5rem;
	max-width: 70%;

	& > * {
		margin-bottom: 1rem;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.notify-enter {
		opacity: 0.1;
		transform: translateX(25rem);
		transition: ${(props): string => `all ${props.animationTimeout}s ease-in-out`};
	}

	.notify-enter-active {
		transform: translateX(0);
		opacity: 1;
	}

	.notify-exit-active {
		transform: translateX(25rem);
		opacity: 0.1;
		transition: ${(props): string => `all ${props.animationTimeout}s ease-in-out`};
	}

	@media (max-width: 1024px) {
		right: 2rem;
		bottom: 2rem;
	}
`;

export const StyledNotification = styled.div`
	display: flex;
	align-items: center;
	padding: 10px;
	font-size: 20px;
	font-weight: 500;
	line-height: 20px;
	font-family: JetBrains Mono, sans-serif;
	color: white;
	background: rgba(173, 173, 173, 0.5);

	@media (max-width: 1024px) {
		font-size: 14px;
		line-height: 14px;
		padding: 5px;
	}
`;
