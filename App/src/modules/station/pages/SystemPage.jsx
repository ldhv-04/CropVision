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

import { UserRow, SampleRow } from './system/SystemRows';

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
