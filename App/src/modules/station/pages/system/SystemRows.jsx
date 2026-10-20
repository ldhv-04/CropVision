/**
 * SystemRows.jsx — Row components for Station System Management
 */

import React from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { TACTICAL_THEME } from '../../constants/tacticalTheme';

export function crossPlatformConfirm(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export const rowStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 6,
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderWidth: 1,
  borderColor: TACTICAL_THEME.borderSubtle,
  marginBottom: 8,
  gap: 12,
};

export function UserRow({ user, actionKey, onToggleRole, onDelete }) {
  const isAdmin = user.role === 'admin';
  const isActing = actionKey === `role-${user.id}` || actionKey === `delete-user-${user.id}`;

  const confirmDelete = () => crossPlatformConfirm(
    'REVOKE ACCESS', `Permanently purge operator profile "${user.email}"?`, () => onDelete(user.id)
  );

  const confirmToggle = () => crossPlatformConfirm(
    'UPDATE CLEARANCE', `Elevate/reassign role for "${user.email}"?`, () => onToggleRole(user)
  );

  return (
    <View style={rowStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          backgroundColor: isAdmin ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 210, 255, 0.15)',
          borderWidth: 1,
          borderColor: isAdmin ? TACTICAL_THEME.telemetry : TACTICAL_THEME.satellite,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 14 }}>{isAdmin ? '👑' : '👤'}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: TACTICAL_THEME.textPrimary, fontSize: 13, fontWeight: '700' }}>
            {user.full_name || 'Anonymous Agronomist'}
          </Text>
          <Text style={{ color: TACTICAL_THEME.textSecondary, fontSize: 11, fontFamily: TACTICAL_THEME.fontMono }}>
            {user.email}
          </Text>
          <Text style={{ color: TACTICAL_THEME.textMuted, fontSize: 9.5, fontFamily: TACTICAL_THEME.fontMono, marginTop: 1 }}>
            COMMISSIONED: {new Date(user.created_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: isAdmin ? TACTICAL_THEME.telemetry : TACTICAL_THEME.satellite,
          fontFamily: TACTICAL_THEME.fontMono,
          backgroundColor: isAdmin ? 'rgba(255, 179, 0, 0.12)' : 'rgba(0, 210, 255, 0.12)',
          padding: '2px 6px',
          borderRadius: 4,
          border: `1px solid ${isAdmin ? TACTICAL_THEME.telemetry : TACTICAL_THEME.satellite}40`,
        }}>
          {isAdmin ? 'SYS_ADMIN' : 'FIELD_OP'}
        </span>

        {isActing ? (
          <ActivityIndicator size="small" color={TACTICAL_THEME.radar} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: TACTICAL_THEME.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={confirmToggle}
            >
              <Text style={{ fontSize: 12, color: TACTICAL_THEME.textSecondary }}>⇄</Text>
            </Pressable>
            <Pressable
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 46, 84, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255, 46, 84, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={confirmDelete}
            >
              <Text style={{ fontSize: 12, color: TACTICAL_THEME.alert }}>✕</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export function SampleRow({ sample, actionKey, onDelete }) {
  const topDisease = sample.detections?.[0];
  const conf = topDisease ? Math.round(topDisease.confidence * 100) : null;
  const confColor = conf >= 70 ? TACTICAL_THEME.alert : conf >= 40 ? TACTICAL_THEME.telemetry : TACTICAL_THEME.radar;
  const isActing = actionKey === `delete-sample-${sample.id}`;

  const confirmDelete = () => crossPlatformConfirm(
    'PURGE SPECIMEN', `Delete telemetry specimen record "${sample.sample_name}"?`, () => onDelete(sample.id)
  );

  return (
    <View style={rowStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          backgroundColor: 'rgba(0, 245, 160, 0.1)',
          borderWidth: 1,
          borderColor: TACTICAL_THEME.radar,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 16 }}>🔬</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: TACTICAL_THEME.textPrimary, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
            {sample.sample_name}
          </Text>
          <Text style={{ color: TACTICAL_THEME.textSecondary, fontSize: 11, textTransform: 'capitalize' }}>
            {topDisease?.disease_class?.replace(/_/g, ' ') || 'Nominal Specimen'}
          </Text>
          <Text style={{ color: TACTICAL_THEME.textMuted, fontSize: 9.5, fontFamily: TACTICAL_THEME.fontMono, marginTop: 1 }}>
            OP: {sample.owner_email} · {new Date(sample.created_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {conf !== null && (
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: confColor,
            fontFamily: TACTICAL_THEME.fontMono,
            backgroundColor: `${confColor}15`,
            padding: '2px 6px',
            borderRadius: 4,
            border: `1px solid ${confColor}40`,
          }}>
            {conf}% ACC
          </span>
        )}
        {isActing ? (
          <ActivityIndicator size="small" color={TACTICAL_THEME.alert} />
        ) : (
          <Pressable
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 46, 84, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(255, 46, 84, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={confirmDelete}
          >
            <Text style={{ fontSize: 12, color: TACTICAL_THEME.alert }}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
