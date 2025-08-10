import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OneSignalService, NotificationData } from '../../services/oneSignalService';

export const NotificationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const service = OneSignalService.getInstance();
    
    // Set up notification click handler
    service.onNotificationClick((data: NotificationData) => {
      handleNotificationClick(data);
    });
  }, []);

  const handleNotificationClick = (data: NotificationData) => {
    console.log('Handling notification click:', data);

    // Navigate based on notification type
    switch (data.type) {
      case 'JOIN_REQUEST':
        // Circle creator receives join request notification
        if (data.circleAddress) {
          navigate(`/markets/${data.circleAddress}?tab=members`);
        } else {
          // Fallback to dashboard if no circle address
          navigate('/dashboard');
        }
        break;
        
      case 'JOIN_APPROVED':
        // User receives approval notification
        if (data.circleAddress) {
          navigate(`/markets/${data.circleAddress}`);
        } else {
          navigate('/dashboard');
        }
        break;
        
      case 'DEPOSIT_TIME':
        // Deposit window has opened
        if (data.circleAddress) {
          navigate(`/markets/${data.circleAddress}?action=deposit`);
        } else {
          navigate('/dashboard');
        }
        break;

      case 'DEPOSIT_DEADLINE':
        // Deposit deadline approaching
        if (data.circleAddress) {
          navigate(`/markets/${data.circleAddress}?action=deposit`);
        } else {
          navigate('/dashboard');
        }
        break;
        
      case 'RAFFLE_WINNER':
        // General raffle winner announcement (for all members)
        if (data.circleAddress) {
          navigate(`/markets/${data.circleAddress}?tab=history`);
        } else {
          navigate('/dashboard');
        }
        break;
        
      case 'WINNER_PAYOUT':
        // Personalized winner notification
        if (data.circleAddress) {
          navigate(`/markets/${data.circleAddress}?tab=history`);
        } else {
          navigate('/dashboard');
        }
        break;
        
      default:
        // Unknown notification type - go to dashboard
        console.warn('Unknown notification type:', data.type);
        navigate('/dashboard');
    }
  };

  // This component doesn't render anything - it just handles notification clicks
  return null;
};