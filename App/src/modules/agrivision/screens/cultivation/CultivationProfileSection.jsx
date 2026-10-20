/**
 * CultivationProfileSection — Crop Profile configuration form
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './CultivationStyles';
import { FieldInput } from './CultivationFormHelpers';

export function CultivationProfileSection({
  profileForm,
  setProfileForm,
  onSaveProfile,
  isSaving,
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Crop profile</Text>
      </View>
      <FieldInput
        testID="profile-crop-type-input"
        label="Crop type *"
        value={profileForm.cropType}
        onChangeText={(cropType) => setProfileForm((prev) => ({ ...prev, cropType }))}
        placeholder="e.g. ST25 Rice"
      />
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <FieldInput
            testID="profile-planting-date-input"
            label="Planting date"
            value={profileForm.plantingDate}
            onChangeText={(plantingDate) => setProfileForm((prev) => ({ ...prev, plantingDate }))}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.col}>
          <FieldInput
            testID="profile-expected-harvest-date-input"
            label="Expected harvest"
            value={profileForm.expectedHarvestDate}
            onChangeText={(expectedHarvestDate) => setProfileForm((prev) => ({ ...prev, expectedHarvestDate }))}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      <FieldInput
        testID="profile-note-input"
        label="Profile note"
        value={profileForm.note}
        onChangeText={(note) => setProfileForm((prev) => ({ ...prev, note }))}
        placeholder="Soil condition, seed source..."
        multiline
      />
      <TouchableOpacity
        testID="btn-save-crop-profile"
        style={styles.primaryButton}
        onPress={onSaveProfile}
        disabled={isSaving}
      >
        <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save crop profile'}</Text>
      </TouchableOpacity>
    </View>
  );
}
