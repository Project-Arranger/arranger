import React from 'react';

// Chord: 简单的三音阶平行线条
export const ChordIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M4 6H20M4 12H16M4 18H20" 
      stroke={active ? '#A0D8EF' : '#666'} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      style={{ transition: 'stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    />
  </svg>
);

// Bass: 低频波浪线
export const BassIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 12C6 5 8 19 12 12C16 5 18 19 21 12" 
      stroke={active ? '#A0D8EF' : '#666'} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ transition: 'stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    />
  </svg>
);

// Perc: 极简 2x2 方格
export const PercIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="6" height="6" rx="1.5" stroke={active ? '#A0D8EF' : '#666'} strokeWidth="2.5" style={{ transition: 'stroke 0.3s' }}/>
    <rect x="14" y="4" width="6" height="6" rx="1.5" stroke={active ? '#A0D8EF' : '#666'} strokeWidth="2.5" style={{ transition: 'stroke 0.3s' }}/>
    <rect x="4" y="14" width="6" height="6" rx="1.5" stroke={active ? '#A0D8EF' : '#666'} strokeWidth="2.5" style={{ transition: 'stroke 0.3s' }}/>
    <rect x="14" y="14" width="6" height="6" rx="1.5" stroke={active ? '#A0D8EF' : '#666'} strokeWidth="2.5" style={{ transition: 'stroke 0.3s' }}/>
  </svg>
);

// Lead: 钢琴键宽条
export const LeadIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M5 4V20M12 4V14M19 4V20" 
      stroke={active ? '#A0D8EF' : '#666'} 
      strokeWidth="3.5" 
      strokeLinecap="round"
      style={{ transition: 'stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    />
  </svg>
);
