import React, { useState, useEffect } from 'react';
import { demos } from './demos';

function getHashDemo(): string {
  const hash = window.location.hash.slice(1);
  return demos.find(d => d.id === hash)?.id ?? demos[0].id;
}

export function DemoApp() {
  const [activeId, setActiveId] = useState(getHashDemo);

  useEffect(() => {
    const onHash = () => setActiveId(getHashDemo());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const active = demos.find(d => d.id === activeId) ?? demos[0];
  const Component = active.component;

  return (
    <div className="demo-app">
      <nav className="sidebar">
        <h1>uPlot+ Demos</h1>
        {demos.map(d => (
          <button
            key={d.id}
            className={`sidebar-item${d.id === activeId ? ' active' : ''}`}
            onClick={() => {
              window.location.hash = d.id;
              setActiveId(d.id);
            }}
          >
            {d.title}
          </button>
        ))}
      </nav>
      <main className="content">
        <div className="demo-card">
          <h2>{active.title}</h2>
          <p className="demo-description">{active.description}</p>
          <Component />
        </div>
      </main>
    </div>
  );
}
