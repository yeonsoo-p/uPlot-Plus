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
    <div className="flex min-h-screen">
      <nav className="no-scrollbar w-60 bg-[#1a1a2e] text-border-lighter text-demo py-4 shrink-0 fixed top-0 left-0 bottom-0 overflow-y-auto">
        <h1 className="text-lg font-bold px-4 pb-4 border-b border-[#333] mb-2 flex items-center justify-between">
          uPlot+ Demos
          <a href="https://github.com/yeonsoo-p/uPlot-Plus" target="_blank" rel="noopener noreferrer" className="text-muted-lighter leading-none transition-colors hover:text-white" title="GitHub">
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.64 7.64 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
        </h1>
        <div className="relative px-4 pb-2">
          <input
            className="w-full bg-white/8 border border-white/10 text-border-lighter py-1.5 pl-2.5 pr-7 rounded text-[12px] outline-none transition-colors focus:border-[#4fc3f7] placeholder:text-[#667]"
            type="text"
            placeholder="Search demos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-5 top-1/2 -translate-y-[calc(50%+4px)] bg-transparent border-none text-[#889] text-base cursor-pointer px-1 leading-none hover:text-[#ccc]"
              onClick={() => setSearch('')}
            >
              &times;
            </button>
          )}
        </div>
        <div className="flex gap-2 px-4 pb-3">
          <button
            className="flex-1 bg-white/6 border border-white/10 text-[#8899aa] py-1 rounded cursor-pointer text-[11px] transition-colors hover:bg-white/12 hover:text-[#ccc]"
            onClick={() => setCollapsed(new Set())}
          >
            Expand All
          </button>
          <button
            className="flex-1 bg-white/6 border border-white/10 text-[#8899aa] py-1 rounded cursor-pointer text-[11px] transition-colors hover:bg-white/12 hover:text-[#ccc]"
            onClick={() => setCollapsed(new Set(categories.map(c => c.name)))}
          >
            Collapse All
          </button>
        </div>
        {filteredCategories.map(cat => {
          const isCollapsed = collapsed.has(cat.name);
          return (
            <div key={cat.name} className="mb-0.5">
              <button
                className="flex items-center w-full text-left bg-white/4 border-none text-[#8899aa] py-2 px-4 cursor-pointer text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-white/8 hover:text-[#aabbcc]"
                onClick={() => toggleCategory(cat.name)}
              >
                <span className={`inline-block w-0 h-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent border-t-current mr-2 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                {cat.name}
                <span className="ml-auto text-[10px] text-[#556677] font-normal">{cat.items.length}</span>
              </button>
              {!isCollapsed && cat.items.map(d => (
                <button
                  key={d.id}
                  className={`block w-full text-left bg-transparent border-none text-[#ccc] py-2 pr-4 pl-7 cursor-pointer text-[13px] transition-colors hover:bg-white/8 hover:text-white ${d.id === activeId ? 'bg-white/15 text-white! border-l-[3px] border-l-[#4fc3f7] pl-6.25!' : ''}`}
                  onClick={() => {
                    window.location.hash = d.id;
                    setActiveId(d.id);
                  }}
                >
                  {d.title}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <main className="ml-60 flex-1 py-6 px-8 min-w-0 overflow-hidden">
        <div className="bg-white rounded-lg p-6 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold mb-1">{active.title}</h2>
          <p className="text-muted text-sm mb-4">{active.description}</p>
          <div className="flex gap-4 items-stretch min-h-125 max-[1200px]:flex-col">
            <div className="flex-[0_1_auto] min-w-0 overflow-hidden">
              <Component />
            </div>
            {source && <SourceHighlight source={source} />}
          </div>
        </div>
      </main>
    </div>
  );
}
