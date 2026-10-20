/**
 * CreateAlertModal.jsx — Modal with map picker for creating new alerts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable,
  TextInput, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { FONT_SIZE } from '../../@core/constants/theme';
import { SEVERITY_OPTIONS, crossPlatformAlert } from './AlertsAdminStyles';

// ─── Leaflet Map Picker (Web only) ───────────────────────────────────
function LeafletMapPicker({ onLocationSelected, initialLat, initialLng, initialRadius, borderColor }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const loadMap = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const center = [initialLat || 10.8, initialLng || 106.7];
      const zoom = initialLat ? 10 : 6;
      const map = L.map(mapRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri', maxZoom: 17.8,
      }).addTo(map);

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' });
      L.control.layers({
        '🛰️ Vệ tinh': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 17.8 }),
        '🗺️ Bản đồ': streetLayer,
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) map.removeLayer(markerRef.current);
        if (circleRef.current) map.removeLayer(circleRef.current);

        markerRef.current = L.marker([lat, lng]).addTo(map)
          .bindPopup(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();

        const radius = initialRadius || 30;
        circleRef.current = L.circle([lat, lng], {
          radius: radius * 1000, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2,
        }).addTo(map);

        onLocationSelected(lat, lng, radius);
      });
    };

    loadMap();
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', border: `1px solid ${borderColor}` }} />;
}

export function CreateAlertModal({ visible, onClose, onSubmit, isLoading, C, styles }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [targetRegion, setTargetRegion] = useState('');
  const [targetCrop, setTargetCrop] = useState('');
  const [geoLat, setGeoLat] = useState(null);
  const [geoLng, setGeoLng] = useState(null);
  const [geoRadius, setGeoRadius] = useState('30');
  const [useGeo, setUseGeo] = useState(false);

  const handleLocationSelected = (lat, lng, radius) => {
    setGeoLat(lat); setGeoLng(lng); setGeoRadius(String(radius));
  };

  const handleSubmit = () => {
    if (!title.trim()) return crossPlatformAlert('Lỗi', 'Vui lòng nhập tiêu đề.');
    if (!message.trim()) return crossPlatformAlert('Lỗi', 'Vui lòng nhập nội dung.');
    onSubmit({
      title: title.trim(), message: message.trim(), severity,
      target_region: targetRegion.trim() || null, target_crop: targetCrop.trim() || null,
      target_lat: useGeo ? geoLat : null, target_lng: useGeo ? geoLng : null,
      target_radius_km: useGeo ? parseFloat(geoRadius) : null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tạo cảnh báo mới</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.formLabel}>Tiêu đề *</Text>
          <TextInput style={styles.input} placeholder="VD: Cảnh báo đạo ôn tại Đồng Tháp" placeholderTextColor={C.placeholder} value={title} onChangeText={setTitle} />

          <Text style={styles.formLabel}>Nội dung *</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Mô tả chi tiết, khuyến nghị hành động..." placeholderTextColor={C.placeholder} value={message} onChangeText={setMessage} multiline numberOfLines={4} />

          <Text style={styles.formLabel}>Mức độ</Text>
          <View style={styles.severityRow}>
            {SEVERITY_OPTIONS.map((opt) => (
              <Pressable key={opt.value} style={[styles.severityChip, severity === opt.value && { borderColor: opt.color, backgroundColor: `${opt.color}20` }]} onPress={() => setSeverity(opt.value)}>
                <Text style={styles.severityChipIcon}>{opt.icon}</Text>
                <Text style={[styles.severityChipText, severity === opt.value && { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.formLabel}>Khu vực mục tiêu</Text>
          <TextInput style={styles.input} placeholder="VD: Đồng Tháp, Long An (để trống = tất cả)" placeholderTextColor={C.placeholder} value={targetRegion} onChangeText={setTargetRegion} />

          <Text style={styles.formLabel}>Cây trồng</Text>
          <TextInput style={styles.input} placeholder="VD: Lúa, Cà chua (để trống = tất cả)" placeholderTextColor={C.placeholder} value={targetCrop} onChangeText={setTargetCrop} />

          <Pressable style={styles.geoToggle} onPress={() => setUseGeo(!useGeo)}>
            <Text style={styles.geoToggleText}>{useGeo ? '✅' : '⬜'} Giới hạn theo khu vực trên bản đồ</Text>
          </Pressable>

          {useGeo && (
            <View style={styles.geoSection}>
              <Text style={styles.formLabel}>Chọn vị trí trên bản đồ (nhấp để đặt)</Text>
              {Platform.OS === 'web' ? (
                <LeafletMapPicker onLocationSelected={handleLocationSelected} initialLat={geoLat} initialLng={geoLng} initialRadius={parseFloat(geoRadius) || 30} borderColor={C.border} />
              ) : (
                <View style={styles.mapPlaceholder}><Text style={{ color: C.textMuted, fontSize: FONT_SIZE.sm }}>Chức năng chọn trên bản đồ chỉ khả dụng trên web.</Text></View>
              )}
              <View style={styles.geoInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Vĩ độ</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={geoLat ? String(geoLat) : ''} onChangeText={(v) => setGeoLat(parseFloat(v) || null)} placeholder="10.7769" placeholderTextColor={C.placeholder} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Kinh độ</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={geoLng ? String(geoLng) : ''} onChangeText={(v) => setGeoLng(parseFloat(v) || null)} placeholder="106.7009" placeholderTextColor={C.placeholder} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Bán kính (km)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" value={geoRadius} onChangeText={setGeoRadius} placeholder="30" placeholderTextColor={C.placeholder} />
                </View>
              </View>
            </View>
          )}

          <Pressable style={[styles.submitBtn, isLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>📢 Gửi cảnh báo</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
