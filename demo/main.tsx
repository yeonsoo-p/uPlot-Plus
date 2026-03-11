import React from 'react';
import { createRoot } from 'react-dom/client';
import { DemoApp } from './DemoApp';
import './styles.css';

const el = document.getElementById('root');
if (el != null) {
  const root = createRoot(el);
  root.render(<DemoApp />);
}
