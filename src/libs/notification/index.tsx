import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { eventBusSubscriptions, NotificationMessage } from '../../eventBus';
import { StyledNotificationsWrapper, StyledNotification } from './styles';

export const Notifications: React.FC = () => {
	const [statNotifications, setNotifications] = React.useState<NotificationMessage[]>([]);

	React.useEffect(() => {
		eventBusSubscriptions.subscribeNotifications(message => {
			setNotifications(state => [...state, message]);
			setTimeout(() => {
				setNotifications(state => state.filter(notification => notification.id !== message.id));
			}, 3000);
		});
	}, []);

	return (
		<StyledNotificationsWrapper animationTimeout={0.5}>
			<TransitionGroup component={null}>
				{statNotifications.map(notification => (
					<CSSTransition key={notification.id} timeout={500} classNames='notify'>
						<StyledNotification>
							<p>{notification.text}</p>
						</StyledNotification>
					</CSSTransition>
				))}
			</TransitionGroup>
		</StyledNotificationsWrapper>
	);
};
