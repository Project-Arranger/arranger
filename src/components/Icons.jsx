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

export const KickIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <ellipse cx="9" cy="12" rx="4" ry="8" stroke="currentColor" strokeWidth="2" />
    <path d="M9 4H15C17 4 19 8 19 12C19 16 17 20 15 20H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 12L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SnareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M4 11H20V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M4 15H20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 3" />
    <path d="M6 7L12 11M18 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HihatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M4 9L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 14L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 7V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const TomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <ellipse cx="12" cy="8" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
    <path d="M4 8V16C4 17.6569 7.58172 19 12 19C16.4183 19 20 17.6569 20 16V8" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const ClapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M9 13C10.5 13 11.5 11 11.5 9.5L10 6C9.5 4.5 7.5 4.5 7 6L5.5 9V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 13C13.5 13 12.5 11 12.5 9.5L14 6C14.5 4.5 16.5 4.5 17 6L18.5 9V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
