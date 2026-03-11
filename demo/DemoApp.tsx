import { useState, useEffect, useMemo } from 'react';
import { demos, getDemoSource } from './demos';
import { SourceHighlight } from './SourceHighlight';

function getHashDemo(): string {
  const hash = window.location.hash.slice(1);
  return demos.find(d => d.id === hash)?.id ?? demos[0].id;
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
      cats[cats.length - 1].items.push(d);
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

  const active = demos.find(d => d.id === activeId) ?? demos[0];
  const Component = active.component;
  const source = getDemoSource(active);

  return (
    <div className="demo-app">
      <nav className="sidebar">
        <h1>uPlot+ Demos</h1>
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
