import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView, Platform, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import styles from './styles';

import { COLORS } from '../../constants/theme';
import SampleList from '../SampleList';
import AdminPanel from '../../components/AdminPanel';
import { buildApiUrl } from '../../config/api';

const DISEASE_COLOR_PALETTE = ['#facc15', '#f97316', '#fb7185', '#38bdf8', '#a3e635', '#c084fc'];

export default function MainDashboard({ onLogout, currentUser, authToken }) {
  const { width } = useWindowDimensions();
  const [imageUri, setImageUri] = useState(null);
  const [inferenceResults, setInferenceResults] = useState(null);
  const [resultImageBase64, setResultImageBase64] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('Ket qua YOLO');
  const [activeMenu, setActiveMenu] = useState('inference');
  const [hoveredDetectionIndex, setHoveredDetectionIndex] = useState(null);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState(null);
  const [activeDiseaseFilter, setActiveDiseaseFilter] = useState('all');
  const [focusMode, setFocusMode] = useState('all');
  const [previewFrame, setPreviewFrame] = useState({ width: 0, height: 0 });
  const [imageMetadata, setImageMetadata] = useState({ width: 0, height: 0 });
  const detailScrollRef = useRef(null);
  const detectionItemLayouts = useRef({});

  const isAdmin = currentUser?.role === 'admin';
  const currentUserLabel = currentUser?.fullName || currentUser?.email || 'Nguoi dung';
  const isCompactLayout = width < 1180;
  const isPhoneLayout = width < 768;
  const allowsHover = Platform.OS === 'web';

  useEffect(() => {
    if (!isAdmin && activeMenu === 'admin') {
      setActiveMenu('inference');
    }
  }, [isAdmin, activeMenu]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setInferenceResults(null);
      setResultImageBase64(null);
      setHoveredDetectionIndex(null);
      setSelectedDetectionIndex(null);
      setActiveDiseaseFilter('all');
      setFocusMode('all');
      detectionItemLayouts.current = {};
    }
  };

  const handleRunInference = async () => {
    if (!imageUri) {
      alert('Vui long tai mot buc anh len truoc!');
      return;
    }

    setIsAnalyzing(true);
    try {
      const uriParts = imageUri.split('/');
      const realFileName = uriParts[uriParts.length - 1];

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob, realFileName);

      const apiResponse = await fetch(buildApiUrl('/api/analyze'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await apiResponse.json();

      if (data.success) {
        setInferenceResults(data.data.boxes);
        setResultImageBase64(data.data.image_base64);
        setImageMetadata({
          width: data.data.image_width || 0,
          height: data.data.image_height || 0,
        });
        setHoveredDetectionIndex(null);
        setSelectedDetectionIndex(null);
        setActiveDiseaseFilter('all');
        setFocusMode('all');
        detectionItemLayouts.current = {};
      } else {
        alert(`Loi tu may chu: ${data.message}`);
      }
    } catch (error) {
      console.error('Loi gui anh:', error);
      alert('Khong the ket noi den may chu. Hay chac chan backend va AI Core dang chay, hoac dat EXPO_PUBLIC_API_HOST theo IP may dev.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const overlayBoxes = useMemo(() => {
    if (!inferenceResults?.length || !previewFrame.width || !previewFrame.height || !imageMetadata.width || !imageMetadata.height) {
      return [];
    }

    const scale = Math.min(previewFrame.width / imageMetadata.width, previewFrame.height / imageMetadata.height);
    const renderedWidth = imageMetadata.width * scale;
    const renderedHeight = imageMetadata.height * scale;
    const offsetX = (previewFrame.width - renderedWidth) / 2;
    const offsetY = (previewFrame.height - renderedHeight) / 2;

    return inferenceResults.map((box, index) => ({
      index,
      left: offsetX + (box.x1 * scale),
      top: offsetY + (box.y1 * scale),
      width: Math.max((box.x2 - box.x1) * scale, 18),
      height: Math.max((box.y2 - box.y1) * scale, 18),
    }));
  }, [imageMetadata.height, imageMetadata.width, inferenceResults, previewFrame.height, previewFrame.width]);

  const diseaseColorMap = useMemo(() => {
    const uniqueDiseaseNames = [...new Set((inferenceResults || []).map((item) => item.class_name || 'Khong ro'))];

    return uniqueDiseaseNames.reduce((accumulator, diseaseName, index) => {
      accumulator[diseaseName] = DISEASE_COLOR_PALETTE[index % DISEASE_COLOR_PALETTE.length];
      return accumulator;
    }, {});
  }, [inferenceResults]);

  const focusedDetectionIndex = selectedDetectionIndex ?? hoveredDetectionIndex;
  const selectedDetection = selectedDetectionIndex !== null ? inferenceResults?.[selectedDetectionIndex] : null;

  const diseaseSummary = useMemo(() => {
    if (!inferenceResults?.length) {
      return [];
    }

    const groupedDetections = inferenceResults.reduce((accumulator, detection) => {
      const key = detection.class_name || 'Khong ro';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(groupedDetections)
      .map(([diseaseName, count]) => ({
        diseaseName,
        count,
        color: diseaseColorMap[diseaseName] || '#facc15',
      }))
      .sort((left, right) => right.count - left.count || left.diseaseName.localeCompare(right.diseaseName));
  }, [diseaseColorMap, inferenceResults]);

  const visibleDetectionIndexes = useMemo(() => {
    if (!inferenceResults?.length) {
      return [];
    }

    return inferenceResults.reduce((accumulator, detection, index) => {
      if (activeDiseaseFilter === 'all' || detection.class_name === activeDiseaseFilter) {
        accumulator.push(index);
      }
      return accumulator;
    }, []);
  }, [activeDiseaseFilter, inferenceResults]);

  const focusPreviewTransform = useMemo(() => {
    if (!selectedDetection || !imageMetadata.width || !imageMetadata.height) {
      return null;
    }

    const previewWidth = isPhoneLayout ? 220 : 260;
    const previewHeight = isPhoneLayout ? 150 : 180;
    const boxWidth = Math.max(selectedDetection.x2 - selectedDetection.x1, 1);
    const boxHeight = Math.max(selectedDetection.y2 - selectedDetection.y1, 1);
    const boxCenterX = selectedDetection.x1 + boxWidth / 2;
    const boxCenterY = selectedDetection.y1 + boxHeight / 2;
    const baseScale = Math.max(previewWidth / boxWidth, previewHeight / boxHeight);
    const scale = Math.min(Math.max(baseScale * 0.6, 1.6), 4.5);
    const scaledWidth = previewWidth * scale;
    const scaledHeight = previewHeight * scale;
    const translateX = -(boxCenterX / imageMetadata.width) * scaledWidth + previewWidth / 2;
    const translateY = -(boxCenterY / imageMetadata.height) * scaledHeight + previewHeight / 2;

    return {
      previewWidth,
      previewHeight,
      width: scaledWidth,
      height: scaledHeight,
      translateX,
      translateY,
    };
  }, [imageMetadata.height, imageMetadata.width, isPhoneLayout, selectedDetection]);

  useEffect(() => {
    if (focusedDetectionIndex === null) {
      return;
    }

    const targetY = detectionItemLayouts.current[focusedDetectionIndex];
    if (typeof targetY === 'number' && detailScrollRef.current?.scrollTo) {
      detailScrollRef.current.scrollTo({
        y: Math.max(targetY - 16, 0),
        animated: true,
      });
    }
  }, [focusedDetectionIndex]);

  const handleDetectionHoverIn = (index) => {
    if (!allowsHover || selectedDetectionIndex !== null) {
      return;
    }
    setHoveredDetectionIndex(index);
  };

  const handleDetectionHoverOut = () => {
    if (!allowsHover || selectedDetectionIndex !== null) {
      return;
    }
    setHoveredDetectionIndex(null);
  };

  const handleDetectionPress = (index) => {
    setSelectedDetectionIndex((currentIndex) => {
      const nextIndex = currentIndex === index ? null : index;
      setHoveredDetectionIndex(nextIndex);
      const selectedDiseaseName = nextIndex !== null ? inferenceResults?.[nextIndex]?.class_name : null;
      if (selectedDiseaseName && activeDiseaseFilter !== 'all' && activeDiseaseFilter !== selectedDiseaseName) {
        setActiveDiseaseFilter(selectedDiseaseName);
      }
      return nextIndex;
    });
  };

  const renderOverlayLayer = () => {
    if (!resultImageBase64) {
      return null;
    }

    return (
      <>
        <Image
          key={`res-${resultImageBase64.substring(0, 20)}`}
          source={{ uri: `data:image/jpeg;base64,${resultImageBase64}` }}
          style={styles.previewImage}
        />

        {overlayBoxes.map((box) => {
          const diseaseName = inferenceResults?.[box.index]?.class_name || 'Khong ro';
          const diseaseColor = diseaseColorMap[diseaseName] || '#facc15';
          const isVisible = focusMode === 'selected'
            ? focusedDetectionIndex === box.index
            : activeDiseaseFilter === 'all' || diseaseName === activeDiseaseFilter;
          const isActive = focusedDetectionIndex === box.index;

          return (
            <Pressable
              key={`overlay-${box.index}`}
              style={[
                styles.overlayHotspot,
                {
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  borderColor: isActive ? '#ffffff' : diseaseColor,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : `${diseaseColor}18`,
                  opacity: isVisible ? 1 : 0.14,
                },
                isActive && styles.overlayHotspotActive,
              ]}
              onPress={() => handleDetectionPress(box.index)}
              {...(allowsHover ? {
                onHoverIn: () => handleDetectionHoverIn(box.index),
                onHoverOut: handleDetectionHoverOut,
              } : {})}
            />
          );
        })}

        {diseaseSummary.length > 0 && (
          <View style={styles.imageLegend}>
            {diseaseSummary.map((item) => (
              <View key={`legend-${item.diseaseName}`} style={styles.imageLegendRow}>
                <View style={[styles.imageLegendDot, { backgroundColor: item.color }]} />
                <Text style={styles.imageLegendText}>{item.diseaseName}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  const renderDetailPanel = () => (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>Panel chi tiet</Text>
        {selectedDetection ? (
          <Pressable
            onPress={() => {
              setSelectedDetectionIndex(null);
              setHoveredDetectionIndex(null);
            }}
            style={styles.detailClearBtn}
          >
            <Text style={styles.detailClearText}>Bo khoa chon</Text>
          </Pressable>
        ) : (
          <View style={styles.detailStatePill}>
            <Text style={styles.detailStateText}>{focusedDetectionIndex !== null ? 'Dang preview' : 'Tong quan anh'}</Text>
          </View>
        )}
      </View>

      <View style={styles.summaryHero}>
        <Text style={styles.summaryHeroLabel}>So benh da phat hien duoc</Text>
        <Text style={styles.summaryHeroValue}>{inferenceResults?.length || 0}</Text>
      </View>

      <View style={[styles.focusModeRow, isPhoneLayout && { flexDirection: 'column' }]}>
        <Pressable
          onPress={() => setFocusMode('all')}
          style={[
            styles.focusModeBtn,
            focusMode === 'all' && styles.focusModeBtnActive,
            isPhoneLayout && styles.mobileBlockButton,
          ]}
        >
          <Text style={styles.focusModeText}>Hien theo bo loc</Text>
        </Pressable>
        <Pressable
          onPress={() => setFocusMode('selected')}
          style={[
            styles.focusModeBtn,
            focusMode === 'selected' && styles.focusModeBtnActive,
            selectedDetectionIndex === null && styles.focusModeBtnDisabled,
            isPhoneLayout && styles.mobileBlockButton,
          ]}
          disabled={selectedDetectionIndex === null}
        >
          <Text style={styles.focusModeText}>Chi dom dang chon</Text>
        </Pressable>
      </View>

      {diseaseSummary.length > 0 && (
        <View style={styles.filterBar}>
          <Pressable
            onPress={() => setActiveDiseaseFilter('all')}
            style={[
              styles.filterChip,
              activeDiseaseFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <Text style={styles.filterChipText}>Tat ca</Text>
          </Pressable>
          {diseaseSummary.map((item) => (
            <Pressable
              key={`filter-${item.diseaseName}`}
              onPress={() => setActiveDiseaseFilter(item.diseaseName)}
              style={[
                styles.filterChip,
                { borderColor: item.color },
                activeDiseaseFilter === item.diseaseName && { backgroundColor: `${item.color}22` },
              ]}
            >
              <View style={[styles.filterSwatch, { backgroundColor: item.color }]} />
              <Text style={styles.filterChipText}>{item.diseaseName}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {diseaseSummary.length > 0 ? (
        <View style={styles.summaryChipRow}>
          {diseaseSummary.map((item) => (
            <View key={item.diseaseName} style={[styles.summaryChip, { borderColor: item.color }]}>
              <View style={[styles.summaryChipDot, { backgroundColor: item.color }]} />
              <Text style={styles.summaryChipText}>{item.diseaseName}: {item.count}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.detailHintText}>Chua co dom benh nao de thong ke.</Text>
      )}

      {selectedDetection ? (
        <View style={styles.selectedDetailBlock}>
          <Text style={styles.selectedDetailTitle}>Dom benh dang chon #{selectedDetectionIndex + 1}</Text>
          <Text style={styles.detailDisease}>{selectedDetection.class_name}</Text>
          <Text style={styles.detailText}>Do tin cay: {(selectedDetection.confidence * 100).toFixed(1)}%</Text>
          <Text style={styles.detailText}>Dom benh dang duoc lam sang tren anh de ban nhan biet vi tri truc quan.</Text>
        </View>
      ) : (
        <View style={styles.detailPanelMuted}>
          <Text style={styles.detailHintTitle}>Thong tin theo tung dom benh</Text>
          <Text style={styles.detailHintText}>Cham vao mot dong trong bang Ket qua YOLO hoac mot vung benh tren anh de lam sang dung vi tri cua dom benh do.</Text>
        </View>
      )}
    </View>
  );

  const renderDetectionList = () => (
    <>
      <Text style={styles.sectionTitle}>{activeTab}</Text>

      {!inferenceResults && !isAnalyzing && (
        <Text style={styles.detailHintText}>Chua co du lieu phan tich.</Text>
      )}

      {visibleDetectionIndexes.length === 0 && !!inferenceResults?.length && (
        <Text style={styles.emptyFilterText}>Khong co dom benh nao khop voi bo loc hien tai.</Text>
      )}

      {visibleDetectionIndexes.map((index) => {
        const box = inferenceResults[index];
        const diseaseColor = diseaseColorMap[box.class_name] || '#facc15';

        return (
          <Pressable
            key={index}
            onLayout={(event) => {
              detectionItemLayouts.current[index] = event.nativeEvent.layout.y;
            }}
            style={[
              styles.boxItem,
              { borderLeftColor: diseaseColor, borderLeftWidth: 4 },
              focusedDetectionIndex === index && styles.boxItemActive,
            ]}
            onPress={() => handleDetectionPress(index)}
          >
            <Text style={styles.diseaseName}>{box.class_name}</Text>
            <Text style={styles.boxText}>
              Lien ket dom benh: #{index + 1}
              {selectedDetectionIndex === index ? ' | Dang khoa chon' : focusedDetectionIndex === index ? ' | Dang duoc nhan' : ''}
            </Text>
            <Text style={styles.boxText}>Do tin cay: {(box.confidence * 100).toFixed(1)}%</Text>
          </Pressable>
        );
      })}
    </>
  );

  const renderInferenceView = () => {
    const viewer = (
      <View style={[styles.mainViewer, isCompactLayout && styles.mainViewerCompact]}>
        <View style={[styles.header, isPhoneLayout && styles.headerCompact]}>
          <Text style={styles.sampleName}>{isAdmin ? 'Khong gian phan tich cho admin' : 'Mau phan tich hien tai'}</Text>
          <Pressable style={[styles.actionBtn, isPhoneLayout && styles.actionBtnWide]} onPress={handlePickImage}>
            <Text style={styles.actionText}>Tai anh moi</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.imageContainer,
            isCompactLayout && styles.imageContainerCompact,
            isPhoneLayout && styles.imageContainerPhone,
          ]}
          onLayout={(event) => {
            const { width: frameWidth, height: frameHeight } = event.nativeEvent.layout;
            setPreviewFrame({ width: frameWidth, height: frameHeight });
          }}
        >
          {resultImageBase64 ? renderOverlayLayer() : imageUri ? (
            <Image
              key={`src-${imageUri}`}
              source={{ uri: imageUri }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>Chua co anh. Nhan "Tai anh moi" de bat dau.</Text>
            </View>
          )}
        </View>

        {focusPreviewTransform && resultImageBase64 && (
          <View style={[styles.focusPreviewCard, isPhoneLayout && styles.focusPreviewCardPhone]}>
            <Text style={styles.focusPreviewTitle}>Phong to dom dang chon</Text>
            <View
              style={[
                styles.focusPreviewViewport,
                {
                  width: focusPreviewTransform.previewWidth,
                  height: focusPreviewTransform.previewHeight,
                },
              ]}
            >
              <Image
                source={{ uri: `data:image/jpeg;base64,${resultImageBase64}` }}
                style={[
                  styles.focusPreviewImage,
                  {
                    width: focusPreviewTransform.width,
                    height: focusPreviewTransform.height,
                    transform: [
                      { translateX: focusPreviewTransform.translateX },
                      { translateY: focusPreviewTransform.translateY },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );

    const panel = (
      <View style={[styles.aiPanel, isCompactLayout && styles.aiPanelCompact]}>
        <View style={[styles.tabContainer, isPhoneLayout && styles.tabContainerCompact]}>
          <Pressable onPress={() => setActiveTab('Ket qua YOLO')} style={styles.tab}>
            <Text style={styles.tabText}>{activeTab}</Text>
          </Pressable>
          <Pressable
            style={[styles.btnAction, (!imageUri || isAnalyzing) && { opacity: 0.5 }, isPhoneLayout && styles.actionBtnWide]}
            onPress={handleRunInference}
            disabled={!imageUri || isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Chay Inference</Text>
            )}
          </Pressable>
        </View>

        {renderDetailPanel()}

        {isCompactLayout ? (
          <View style={styles.panelContentCompact}>
            {renderDetectionList()}
          </View>
        ) : (
          <ScrollView ref={detailScrollRef} style={styles.panelContent}>
            {renderDetectionList()}
          </ScrollView>
        )}
      </View>
    );

    if (isCompactLayout) {
      return (
        <ScrollView ref={detailScrollRef} style={styles.mobileScrollContainer} contentContainerStyle={styles.mobileScrollContent}>
          {viewer}
          {panel}
        </ScrollView>
      );
    }

    return (
      <>
        {viewer}
        {panel}
      </>
    );
  };

  const renderContent = () => {
    if (activeMenu === 'history') {
      return <SampleList authToken={authToken} currentUser={currentUser} />;
    }

    if (activeMenu === 'admin' && isAdmin) {
      return (
        <View style={styles.adminViewer}>
          <AdminPanel authToken={authToken} currentUser={currentUser} />
        </View>
      );
    }

    return renderInferenceView();
  };

  const renderMenuButtons = (compact = false) => (
    <>
      <Pressable style={[styles.menuItem, compact && styles.mobileMenuItem]} onPress={() => setActiveMenu('inference')}>
        <Text style={[styles.menuText, activeMenu === 'inference' && styles.activeMenuText]}>
          Phan tich anh
        </Text>
      </Pressable>

      <Pressable style={[styles.menuItem, compact && styles.mobileMenuItem]} onPress={() => setActiveMenu('history')}>
        <Text style={[styles.menuText, activeMenu === 'history' && styles.activeMenuText]}>
          Lich su mau vat
        </Text>
      </Pressable>

      {isAdmin && (
        <Pressable style={[styles.menuItem, compact && styles.mobileMenuItem]} onPress={() => setActiveMenu('admin')}>
          <Text style={[styles.menuText, activeMenu === 'admin' && styles.activeMenuText]}>
            Quan tri he thong
          </Text>
        </Pressable>
      )}
    </>
  );

  if (isCompactLayout) {
    return (
      <View style={styles.containerCompact}>
        <View style={styles.mobileTopbar}>
          <Text style={[styles.title, styles.mobileTitle]}>CropVision AI</Text>
          <Text style={[styles.menuText, styles.mobileRoleLabel]}>
            {isAdmin ? `Admin: ${currentUserLabel}` : `Nguoi dung: ${currentUserLabel}`}
          </Text>
          <View style={styles.mobileMenuList}>
            {renderMenuButtons(true)}
          </View>
          <Pressable style={styles.mobileLogoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Dang xuat</Text>
          </Pressable>
        </View>
        <View style={styles.compactContent}>
          {renderContent()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View>
          <Text style={styles.title}>CropVision AI</Text>
          <Text style={[styles.menuText, { color: isAdmin ? COLORS.primary : COLORS.textSecondary, marginBottom: 18 }]}>
            {isAdmin ? `Quyen truy cap: Admin (${currentUserLabel})` : `Nguoi dung: ${currentUserLabel}`}
          </Text>

          <View style={styles.menuList}>
            {renderMenuButtons()}
          </View>
        </View>

        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Dang xuat</Text>
        </Pressable>
      </View>

      {renderContent()}
    </View>
  );
}
