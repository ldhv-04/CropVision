/**
 * Fields Screen — Unified "Quản lý cánh đồng"
 *
 * M2 Module Consolidation: Uses the new map-first FieldMapScreen as the default view.
 * The old 1778-line fields.js is preserved at fieldsLegacy.js for reference.
 * Users can toggle between map view and list view via the TopBar toggle.
 *
 * Features:
 * - Map-first view (default) with 5-layer color coding
 * - List view toggle (legacy functionality)
 * - Field CRUD, GPS walk, sub-zone management
 * - Bottom drawer with zone details
 */

import FieldMapScreen from '../../src/modules/agrivision/screens/FieldMapScreen';

export default FieldMapScreen;