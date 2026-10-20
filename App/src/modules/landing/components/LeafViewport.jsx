import React from 'react';

/**
 * LeafViewport Component
 * Renders the interactive optical viewport displaying leaf graphic,
 * scanning beam animation, disease spot markers, and AI reticle.
 */
export function LeafViewport({ selectedCase }) {
  return (
    <div style={{
      position: 'relative',
      background: selectedCase.leafBg,
      borderRight: '1px solid #1B2537',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      minHeight: '360px',
    }}>
      {/* Grid Overlay lines */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(0, 245, 160, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 160, 0.06) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }} />

      {/* Scanning Beam Animation */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #00F5A0, #00D2FF, transparent)',
        boxShadow: '0 0 12px #00F5A0',
        top: '20%',
        animation: 'scanBeam 4s ease-in-out infinite alternate',
        zIndex: 10,
      }} />

      {/* Leaf Graphic Silhouette */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-15deg)',
        width: '240px',
        height: '320px',
        borderRadius: '50% 0 50% 0 / 60% 0 60% 0',
        backgroundColor: 'rgba(34, 75, 48, 0.65)',
        border: '2px solid rgba(0, 245, 160, 0.25)',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.5) inset',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '2px',
          height: '90%',
          backgroundColor: 'rgba(0, 245, 160, 0.3)',
          transform: 'rotate(15deg)',
        }} />
      </div>

      {/* Disease Spot Visuals on Leaf */}
      {selectedCase.spots.map((spot, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            top: spot.top,
            left: spot.left,
            width: spot.w,
            height: spot.h,
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
            backgroundColor: 'rgba(180, 83, 9, 0.75)',
            border: '1px solid rgba(245, 158, 11, 0.8)',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
            zIndex: 5,
          }}
        />
      ))}

      {/* AI Bounding Box Reticle */}
      <div style={{
        position: 'absolute',
        top: selectedCase.spotY,
        left: selectedCase.spotX,
        transform: 'translate(-50%, -50%)',
        width: selectedCase.spotWidth,
        height: selectedCase.spotHeight,
        border: '2px dashed #00F5A0',
        backgroundColor: 'rgba(0, 245, 160, 0.08)',
        boxShadow: '0 0 16px rgba(0, 245, 160, 0.4)',
        zIndex: 12,
        transition: 'all 0.4s ease',
      }}>
        <div style={{ position: 'absolute', top: -3, left: -3, width: 8, height: 8, borderTop: '3px solid #00F5A0', borderLeft: '3px solid #00F5A0' }} />
        <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderTop: '3px solid #00F5A0', borderRight: '3px solid #00F5A0' }} />
        <div style={{ position: 'absolute', bottom: -3, left: -3, width: 8, height: 8, borderBottom: '3px solid #00F5A0', borderLeft: '3px solid #00F5A0' }} />
        <div style={{ position: 'absolute', bottom: -3, right: -3, width: 8, height: 8, borderBottom: '3px solid #00F5A0', borderRight: '3px solid #00F5A0' }} />

        <div style={{
          position: 'absolute',
          top: -22,
          left: 0,
          backgroundColor: '#00F5A0',
          color: '#06090E',
          fontSize: '10px',
          fontWeight: 900,
          padding: '2px 6px',
          borderRadius: '2px',
          fontFamily: '"JetBrains Mono", monospace',
          whiteSpace: 'nowrap',
        }}>
          {selectedCase.diseaseName.split('(')[0]} · {selectedCase.confidence}%
        </div>
      </div>

      {/* Viewport Meta Details */}
      <div style={{ position: 'relative', zIndex: 15, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          color: '#00F5A0',
          backgroundColor: 'rgba(6, 9, 14, 0.8)',
          padding: '3px 8px',
          borderRadius: 4,
          border: '1px solid rgba(0, 245, 160, 0.3)',
        }}>
          CAM: MACRO OPTICAL // 1080P
        </span>
        <span style={{
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          color: '#94A3B8',
          backgroundColor: 'rgba(6, 9, 14, 0.8)',
          padding: '3px 8px',
          borderRadius: 4,
        }}>
          VÙNG: {selectedCase.region}
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 15 }}>
        <div style={{
          fontSize: 11,
          color: '#F8FAFC',
          backgroundColor: 'rgba(6, 9, 14, 0.85)',
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #1B2537',
          lineHeight: 1.4,
        }}>
          <strong style={{ color: '#00F5A0' }}>Triệu chứng thực địa:</strong> {selectedCase.symptomDesc}
        </div>
      </div>
    </div>
  );
}
