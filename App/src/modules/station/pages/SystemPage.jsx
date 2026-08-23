/**
 * CropVision Station — Tactical System Manager
 *
 * Direction 3: Tactical Agronomy Command & Mission Control
 * Security, Personnel Access Control & Specimen Data Vault.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, Alert, RefreshControl, TextInput,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { TACTICAL_THEME } from '../constants/tacticalTheme';

function crossPlatformConfirm(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

function UserRow({ user, actionKey, onToggleRole, onDelete }) {
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

function SampleRow({ sample, actionKey, onDelete }) {
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

const rowStyle = {
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

export default function StationSystem() {
  const token = useAuthStore((s) => s.token);
  const { users, samples, isLoading, isRefreshing, actionKey, error, loadAdminData, toggleUserRole, deleteUser, deleteSample } = useAdminStore();
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAdminData(token);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSamples = samples.filter((s) =>
    s.sample_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleRole = async (user) => {
    try { await toggleUserRole(token, user); } catch {}
  };
  const handleDeleteUser = async (userId) => {
    try { await deleteUser(token, userId); } catch {}
  };
  const handleDeleteSample = async (sampleId) => {
    try { await deleteSample(token, sampleId); } catch {}
  };

  return (
    <View testID="station-system" style={{ flex: 1, backgroundColor: TACTICAL_THEME.bgBase }}>
      {/* Tactical Tab Bar */}
      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: TACTICAL_THEME.border,
        backgroundColor: TACTICAL_THEME.bgPanelSolid,
      }}>
        <Pressable
          testID="tab-users"
          style={{
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'users' ? TACTICAL_THEME.radar : 'transparent',
            backgroundColor: activeTab === 'users' ? 'rgba(0, 245, 160, 0.04)' : 'transparent',
          }}
          onPress={() => setActiveTab('users')}
        >
          <Text style={{
            color: activeTab === 'users' ? TACTICAL_THEME.radar : TACTICAL_THEME.textSecondary,
            fontSize: 12,
            fontWeight: '800',
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            👥 PERSONNEL ROSTER ({users.length})
          </Text>
        </Pressable>

        <Pressable
          testID="tab-samples"
          style={{
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'samples' ? TACTICAL_THEME.radar : 'transparent',
            backgroundColor: activeTab === 'samples' ? 'rgba(0, 245, 160, 0.04)' : 'transparent',
          }}
          onPress={() => setActiveTab('samples')}
        >
          <Text style={{
            color: activeTab === 'samples' ? TACTICAL_THEME.radar : TACTICAL_THEME.textSecondary,
            fontSize: 12,
            fontWeight: '800',
            fontFamily: TACTICAL_THEME.fontMono,
          }}>
            🔬 SPECIMEN DATA VAULT ({samples.length})
          </Text>
        </Pressable>
      </View>

      {/* Tactical Search Filter */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 14 }}>
        <TextInput
          testID="system-search"
          style={{
            backgroundColor: TACTICAL_THEME.bgInput,
            color: TACTICAL_THEME.textPrimary,
            borderWidth: 1,
            borderColor: TACTICAL_THEME.border,
            borderRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            fontSize: 12,
            fontFamily: TACTICAL_THEME.fontFamily,
          }}
          placeholder={`Filter ${activeTab === 'users' ? 'personnel by email or name' : 'diagnostic specimen records'}...`}
          placeholderTextColor={TACTICAL_THEME.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {error && (
        <View style={{
          marginHorizontal: 24,
          marginBottom: 14,
          padding: 12,
          backgroundColor: TACTICAL_THEME.alertMuted,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: TACTICAL_THEME.alert,
        }}>
          <Text style={{ color: TACTICAL_THEME.alert, fontSize: 12, fontFamily: TACTICAL_THEME.fontMono }}>
            ⚠️ FAULT: {error}
          </Text>
        </View>
      )}

      {isLoading && users.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
          <ActivityIndicator color={TACTICAL_THEME.radar} />
          <Text style={{ color: TACTICAL_THEME.radar, fontSize: 11, fontFamily: TACTICAL_THEME.fontMono }}>
            [SYNCHRONIZING SYSTEM LOGS...]
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadAdminData(token, true)} tintColor={TACTICAL_THEME.radar} />}
        >
          {activeTab === 'users' ? (
            filteredUsers.length === 0 ? (
              <Text style={{ color: TACTICAL_THEME.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 32, fontFamily: TACTICAL_THEME.fontMono }}>
                [NO MATCHING OPERATOR RECORDS]
              </Text>
            ) : (
              filteredUsers.map((u) => (
                <UserRow key={u.id} user={u} actionKey={actionKey} onToggleRole={handleToggleRole} onDelete={handleDeleteUser} />
              ))
            )
          ) : (
            filteredSamples.length === 0 ? (
              <Text style={{ color: TACTICAL_THEME.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 32, fontFamily: TACTICAL_THEME.fontMono }}>
                [NO MATCHING SPECIMEN RECORDS]
              </Text>
            ) : (
              filteredSamples.map((s) => (
                <SampleRow key={s.id} sample={s} actionKey={actionKey} onDelete={handleDeleteSample} />
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}
