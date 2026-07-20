/**
 * Route: /(agrivision)/field-detail/[fieldId]
 * Mobile Field Manager - detail view with polygon-only zone map.
 * Hidden route - navigated to programmatically from field cards.
 */
import MobileFieldDetailScreen from '../../../src/modules/agrivision/screens/MobileFieldDetailScreen';

export default function MobileFieldDetailRoute() {
  return <MobileFieldDetailScreen />;
}
