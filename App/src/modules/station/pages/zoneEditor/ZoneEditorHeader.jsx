/**
 * ZoneEditorHeader — Top navigation and actions bar.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { S } from './styles';

export function ZoneEditorHeader({
  parentField,
  onBack,
  onValidate,
  onPublish,
  hasUnsavedChanges,
}) {
  return (
    <div style={S.header}>
      <div style={S.headerLeft}>
        <button style={S.backBtn} onClick={onBack}>← Back</button>
        <div>
          <h2 style={S.headerTitle}>{parentField?.name || 'Field Zone Management'}</h2>
          <p style={S.headerMeta}>
            {parentField?.code ? `Code: ${parentField.code} · ` : ''}
            {hasUnsavedChanges ? 'Unsaved modifications pending' : 'All changes saved'}
          </p>
        </div>
      </div>
      <div style={S.headerRight}>
        <button style={S.validateBtn} onClick={onValidate}>Validate Geometry</button>
        <button style={S.publishBtn} onClick={onPublish}>Publish Zones</button>
      </div>
    </div>
  );
}
