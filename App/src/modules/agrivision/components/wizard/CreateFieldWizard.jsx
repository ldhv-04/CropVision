import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import useFieldStore from '../../store/useFieldStore';
import { styles } from './CreateFieldWizardStyles';

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