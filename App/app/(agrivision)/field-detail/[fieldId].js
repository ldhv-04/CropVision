/**
 * Route: /(agrivision)/field-detail/[fieldId]
 * Mobile Field Manager - detail view with polygon-only zone map.
 * Hidden route - navigated to programmatically from field cards.
 */
import { useLocalSearchParams } from 'expo-router';
import MobileFieldDetailScreen from '../../../src/modules/agrivision/screens/MobileFieldDetailScreen';

const shouldLogMobileFieldReview = process.env.EXPO_PUBLIC_MOBILE_FIELD_REVIEW === '1';

export default function MobileFieldDetailRoute() {
  const params = useLocalSearchParams();

  if (shouldLogMobileFieldReview) {
    console.log('[MobileFieldReview] route params', params);
  }

  return <MobileFieldDetailScreen />;
}
