import { useState, useEffect, useMemo } from 'react';
import { demos, getDemoSource } from './demos';
import { SourceHighlight } from './SourceHighlight';

function getHashDemo(): string {
  const hash = window.location.hash.slice(1);
  return demos.find(d => d.id === hash)?.id ?? demos[0]?.id ?? '';
}

export function DemoApp() {
  const [activeId, setActiveId] = useState(getHashDemo);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const onHash = () => setActiveId(getHashDemo());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const categories = useMemo(() => {
    const cats: { name: string; items: typeof demos }[] = [];
    const seen = new Set<string>();
    for (const d of demos) {
      if (!seen.has(d.category)) {
        seen.add(d.category);
        cats.push({ name: d.category, items: [] });
      }
      const last = cats[cats.length - 1];
      if (last != null) last.items.push(d);
    }
    return cats;
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0);
  }, [categories, search]);

  const toggleCategory = (name: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const active = demos.find(d => d.id === activeId) ?? demos[0] ?? { id: '', title: '', description: '', category: '', component: () => null, sourceFile: '' };

  const Component = active.component;
  const source = getDemoSource(active);

  return (
    <div className="demo-app">
      <nav className="sidebar">
        <h1>
          uPlot+ Demos
          <a href="https://github.com/yeonsoo-p/uPlot-Plus" target="_blank" rel="noopener noreferrer" className="github-link" title="GitHub">
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.64 7.64 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
        </h1>
        <div className="sidebar-search-wrap">
          <input
            className="sidebar-search"
            type="text"
            placeholder="Search demos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="sidebar-search-clear" onClick={() => setSearch('')}>
              &times;
            </button>
          )}
        </div>
        <div className="sidebar-controls">
          <button onClick={() => setCollapsed(new Set())}>Expand All</button>
          <button onClick={() => setCollapsed(new Set(categories.map(c => c.name)))}>Collapse All</button>
        </div>
        {filteredCategories.map(cat => (
          <div key={cat.name} className="sidebar-group">
            <button
              className={`sidebar-category${collapsed.has(cat.name) ? ' collapsed' : ''}`}
              onClick={() => toggleCategory(cat.name)}
            >
              <span className="sidebar-chevron" />
              {cat.name}
              <span className="sidebar-count">{cat.items.length}</span>
            </button>
            {!collapsed.has(cat.name) && cat.items.map(d => (
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
          </div>
        ))}
      </nav>
      <main className="content">
        <div className="demo-card">
          <h2>{active.title}</h2>
          <p className="demo-description">{active.description}</p>
          <div className="demo-layout">
            <div className="demo-chart">
              <Component />
            </div>
            {source && <SourceHighlight source={source} />}
          </div>
        </div>
      </main>
    </div>
  );
}
