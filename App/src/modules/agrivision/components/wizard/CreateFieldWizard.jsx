import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import useFieldStore from '../../stores/fieldStore';

const STEPS = ['Method', 'Boundary', 'Sub-Zones', 'Details', 'Review'];

/**
 * CreateFieldWizard — Multi-step field creation overlay.
 *
 * Steps: Method Selection → Boundary Drawing → Sub-Zones → Field Info → Review
 */
export default function CreateFieldWizard({ onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [method, setMethod] = useState(null); // 'gps' | 'draw' | 'import'
  const [fieldData, setFieldData] = useState({
    name: '',
    crop_type: '',
    area: '',
    latitude: 10.7769,
    longitude: 106.7009,
    boundary: null,
    growth_stage: 'germination',
  });

  const { createField, loading } = useFieldStore();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const result = await createField(fieldData);
    if (result) {
      Alert.alert('Success', 'Field created successfully!');
      onComplete?.(result);
      onClose?.();
    } else {
      Alert.alert('Error', 'Failed to create field. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= currentStep && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, i <= currentStep && styles.stepDotTextActive]}>
              {i < currentStep ? '✓' : i + 1}
            </Text>
          </View>
          <Text style={[styles.stepLabel, i === currentStep && styles.stepLabelActive]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderMethodStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose creation method</Text>
      {[
        { key: 'gps', icon: '🚶', label: 'GPS Walk', desc: 'Walk around your field perimeter' },
        { key: 'draw', icon: '✏️', label: 'Draw on Map', desc: 'Draw boundaries on the map' },
        { key: 'import', icon: '📁', label: 'Import GeoJSON', desc: 'Upload a GeoJSON file' },
      ].map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.methodCard, method === opt.key && styles.methodCardActive]}
          onPress={() => setMethod(opt.key)}
        >
          <Text style={styles.methodIcon}>{opt.icon}</Text>
          <View style={styles.methodInfo}>
            <Text style={styles.methodLabel}>{opt.label}</Text>
            <Text style={styles.methodDesc}>{opt.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBoundaryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {method === 'gps' ? 'Walk around your field' : method === 'draw' ? 'Draw field boundary' : 'Import GeoJSON'}
      </Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🗺️</Text>
        <Text style={styles.placeholderText}>
          {method === 'gps'
            ? 'Start walking around your field. GPS points will be collected automatically.'
            : method === 'draw'
            ? 'Tap on the map to draw your field boundary polygon.'
            : 'Select a GeoJSON file from your device.'}
        </Text>
      </View>
    </View>
  );

  const renderSubZoneStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Add sub-zones (optional)</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🔲</Text>
        <Text style={styles.placeholderText}>
          Divide your field into management zones. Each zone can have its own crop type and monitoring.
        </Text>
      </View>
      <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
        <Text style={styles.skipText}>Skip — I'll add zones later</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Field Details</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Field Name *</Text>
        <TextInput
          style={styles.input}
          value={fieldData.name}
          onChangeText={(text) => setFieldData({ ...fieldData, name: text })}
          placeholder="e.g., North Corn Field"
          placeholderTextColor="#64748b"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Crop Type *</Text>
        <TextInput
          style={styles.input}
          value={fieldData.crop_type}
          onChangeText={(text) => setFieldData({ ...fieldData, crop_type: text })}
          placeholder="e.g., Corn, Rice, Tomato"
          placeholderTextColor="#64748b"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Growth Stage</Text>
        <View style={styles.chipRow}>
          {['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'].map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[styles.stageChip, fieldData.growth_stage === stage && styles.stageChipActive]}
              onPress={() => setFieldData({ ...fieldData, growth_stage: stage })}
            >
              <Text style={[styles.stageChipText, fieldData.growth_stage === stage && styles.stageChipTextActive]}>
                {stage}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <View style={styles.reviewCard}>
        <ReviewRow label="Name" value={fieldData.name || '—'} />
        <ReviewRow label="Crop" value={fieldData.crop_type || '—'} />
        <ReviewRow label="Method" value={method || '—'} />
        <ReviewRow label="Growth Stage" value={fieldData.growth_stage} />
        <ReviewRow label="Location" value={`${fieldData.latitude.toFixed(4)}, ${fieldData.longitude.toFixed(4)}`} />
      </View>
    </View>
  );

  function ReviewRow({ label, value }) {
    return (
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderMethodStep();
      case 1: return renderBoundaryStep();
      case 2: return renderSubZoneStep();
      case 3: return renderDetailsStep();
      case 4: return renderReviewStep();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Field</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, (currentStep === 0 && !method) && styles.nextBtnDisabled]}
          onPress={currentStep === STEPS.length - 1 ? handleSubmit : handleNext}
          disabled={currentStep === 0 && !method}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === STEPS.length - 1 ? (loading ? 'Creating...' : '✓ Create Field') : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.15)',
  },
  closeText: { color: '#94a3b8', fontSize: 18 },
  headerTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  stepIndicator: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16,
    paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.1)',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(148,163,184,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepDotText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  stepDotTextActive: { color: '#ffffff' },
  stepLabel: { color: '#64748b', fontSize: 9 },
  stepLabelActive: { color: '#818cf8' },
  body: { flex: 1, paddingHorizontal: 16 },
  stepContent: { paddingVertical: 16 },
  stepTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12,
    backgroundColor: 'rgba(30,41,59,0.8)', marginBottom: 10, gap: 14,
    borderWidth: 1, borderColor: 'transparent',
  },
  methodCardActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)' },
  methodIcon: { fontSize: 28 },
  methodInfo: { flex: 1 },
  methodLabel: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  methodDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  placeholder: {
    alignItems: 'center', justifyContent: 'center', padding: 40, borderRadius: 12,
    backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.15)',
    borderStyle: 'dashed',
  },
  placeholderIcon: { fontSize: 40, marginBottom: 12 },
  placeholderText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  skipBtn: { marginTop: 16, alignItems: 'center' },
  skipText: { color: '#818cf8', fontSize: 13 },
  formGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, color: '#e2e8f0', fontSize: 14, borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stageChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.1)', borderWidth: 1, borderColor: 'transparent',
  },
  stageChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)' },
  stageChipText: { color: '#94a3b8', fontSize: 12 },
  stageChipTextActive: { color: '#818cf8' },
  reviewCard: {
    backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.15)',
  },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)',
  },
  reviewLabel: { color: '#64748b', fontSize: 13 },
  reviewValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  footer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.15)',
  },
  backBtn: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.1)',
  },
  backBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});