import { useEffect, useMemo, useState } from 'react';
import {
  MAP_LABELS,
  MAP_MODE_GROUPS,
  METRICS,
  ROLE_LABELS,
  SUBROLE_LABELS,
  TIER_LABELS,
  TIER_MARKS,
} from './constants';

const routes = [
  { path: '/', label: '추천' },
  { path: '/heroes', label: '영웅' },
  { path: '/maps', label: '맵' },
];

const initialSelection = {
  map: 'all-maps',
  hero: 'all',
  tier: 'all',
  patch: '',
  role: 'all',
  sort: 'winrate',
};

const roleOptions = [['all', '전체'], ['tank', '돌격'], ['damage', '공격'], ['support', '지원']];
const rate = (value) => `${Number(value || 0).toFixed(1)}%`;
const subroleLabel = (value) => SUBROLE_LABELS[value] || value;
const mapPath = (mapKey) => `/maps/${encodeURIComponent(mapKey)}`;
const isMapsPath = (value) => value === '/maps' || value.startsWith('/maps/');
const mapKeyFromPath = (value) => (value.startsWith('/maps/') ? decodeURIComponent(value.slice('/maps/'.length)) : '');

function useRoute() {
  const normalize = () => {
    if (window.location.pathname === '/trends') return '/heroes';
    if (isMapsPath(window.location.pathname)) return window.location.pathname;
    return routes.some((route) => route.path === window.location.pathname) ? window.location.pathname : '/';
  };
  const [path, setPath] = useState(normalize);

  useEffect(() => {
    const onPopState = () => setPath(normalize());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextPath, options = {}) => {
    if (nextPath === path) return;
    if (options.replace) window.history.replaceState({}, '', nextPath);
    else window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { path, navigate };
}

function useDashboardData() {
  const [filters, setFilters] = useState(null);
  const [selection, setSelection] = useState(initialSelection);
  const [heroes, setHeroes] = useState([]);
  const [roleRecommendations, setRoleRecommendations] = useState([]);
  const [mapMedia, setMapMedia] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/stats/filters', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('필터를 불러오지 못했습니다.');
        return response.json();
      })
      .then((data) => {
        setFilters(data);
        setSelection((current) => ({ ...current, patch: data.patches[0]?.value || '' }));
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/maps/media', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setMapMedia(Array.isArray(data) ? data : []))
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setMapMedia([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selection.patch) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams(selection);
    setLoading(true);
    setError('');
    fetch(`/api/stats?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('통계를 불러오지 못했습니다.');
        return response.json();
      })
      .then((payload) => {
        setHeroes(payload.data || []);
        setRoleRecommendations(payload.roleRecommendations || []);
        setMeta(payload.meta || null);
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selection]);

  const updateSelection = (key, value) => setSelection((current) => ({ ...current, [key]: value }));
  const setRecommendationTier = (tier) => setSelection((current) => ({ ...current, tier, map: 'all-maps', hero: 'all', role: 'all' }));
  const setHeroStatsFilter = (key, value) => setSelection((current) => ({ ...current, [key]: value, map: 'all-maps', hero: 'all' }));

  return {
    filters,
    selection,
    updateSelection,
    setRecommendationTier,
    setHeroStatsFilter,
    heroes,
    roleRecommendations,
    mapMedia,
    meta,
    loading,
    error,
  };
}

function Header({ path, navigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => navigate('/')} aria-label="OWGG 홈">
        <span className="brand-mark">OW</span><span>GG</span>
      </button>
      <nav aria-label="주 메뉴">
        {routes.map((route) => (
          <button type="button" className={path === route.path || (route.path === '/maps' && isMapsPath(path)) ? 'active' : ''} onClick={() => navigate(route.path)} key={route.path}>
            {route.label}
          </button>
        ))}
      </nav>
      <div className="live-badge"><span /> LIVE DATA</div>
    </header>
  );
}

function PageIntro({ eyebrow, title, accent, description }) {
  return (
    <section className="page-intro compact-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}<br /><em>{accent}</em></h1>
      </div>
      <p className="intro">{description}</p>
    </section>
  );
}

function TierFilter({ filters, selection, onChange }) {
  const tiers = ['all', ...filters.tiers.map(({ value }) => value).filter((value) => TIER_MARKS[value])];
  return (
    <div className="tier-filter" aria-label="티어 필터">
      {tiers.map((tier) => {
        const tierMeta = TIER_MARKS[tier] || { label: TIER_LABELS[tier] || tier, mark: tier.slice(0, 2).toUpperCase(), tone: '#f5f7ff' };
        return (
          <button
            type="button"
            className={`tier-button ${selection.tier === tier ? 'active' : ''}`}
            style={{ '--tier-tone': tierMeta.tone }}
            onClick={() => onChange(tier)}
            aria-label={`${tierMeta.label} 티어 보기`}
            title={tierMeta.label}
            key={tier}
          >
            {tierMeta.image ? <img src={tierMeta.image} alt="" /> : <span>{tierMeta.mark}</span>}
          </button>
        );
      })}
    </div>
  );
}

function RoleButtons({ value, onChange }) {
  return (
    <div className="role-filter">
      {roleOptions.map(([role, label]) => (
        <button type="button" className={`role-button ${value === role ? 'active' : ''}`} onClick={() => onChange(role)} key={role}>
          {label}
        </button>
      ))}
    </div>
  );
}

function SubroleButtons({ values, value, onChange }) {
  return (
    <div className="subrole-filter" aria-label="세부 역할 필터">
      {values.map((subrole) => (
        <button type="button" className={`subrole-button ${value === subrole ? 'active' : ''}`} onClick={() => onChange(subrole)} key={subrole}>
          {subrole === 'all' ? '전체' : subroleLabel(subrole)}
        </button>
      ))}
    </div>
  );
}

function MetricChips({ hero, compact = false }) {
  return (
    <div className={compact ? 'mini-metrics' : 'recommendation-metrics'}>
      <b className="metric-chip has-tooltip" tabIndex="0" data-tooltip="밴률은 최대 35%까지만 완만하게 반영하고, 과도한 밴률은 추천 점수에서 일부 감점합니다.">
        보정 픽률 {rate(hero.recommendation.adjustedPickrate)}
      </b>
      <b className="metric-chip">밴률 {rate(hero.banrate)}</b>
      <b className="metric-chip">승률 {rate(hero.winrate)}</b>
      <b className={`metric-chip ${hero.recommendation.trend >= 0 ? 'positive' : 'negative'}`}>
        상승세 {hero.recommendation.trend >= 0 ? '+' : ''}{rate(hero.recommendation.trend)}
      </b>
    </div>
  );
}

function RoleRecommendationGroup({ group }) {
  const [leader, ...runnerUps] = group.heroes || [];
  if (!leader) return null;
  return (
    <article className={`role-recommendation role-${group.role}`}>
      <div className="role-heading">
        <p className="eyebrow">{ROLE_LABELS[group.role] || group.role}</p>
        <h2>{ROLE_LABELS[group.role] || group.role} 추천</h2>
      </div>
      <div className="recommendation-card featured" data-rank="1">
        <div className="recommendation-copy">
          <p className="rank-label">역할 내 1위</p>
          <h2>{leader.name}</h2>
          <span>{ROLE_LABELS[leader.role] || leader.role} · {subroleLabel(leader.subrole)}</span>
          <div className="recommendation-score">
            <strong>{leader.recommendation.score}</strong>
            <small>종합 추천 점수</small>
          </div>
          <MetricChips hero={leader} />
        </div>
        {leader.standing && <img className="recommendation-art" src={leader.standing} alt={`${leader.name} 일러스트`} loading="lazy" />}
      </div>
      <div className="runner-up-list">
        {runnerUps.map((hero, index) => (
          <div className="runner-up-card" key={hero.hero_id}>
            <span className="runner-rank">#{index + 2}</span>
            <img src={hero.portrait} alt="" loading="lazy" />
            <div>
              <strong>{hero.name}</strong>
              <small>{hero.recommendation.score}점</small>
              <MetricChips hero={hero} compact />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HomePage({ filters, selection, setRecommendationTier, roleRecommendations, meta, loading, error }) {
  const patchText = meta?.recommendationPatches?.length ? `${meta.recommendationPatches.at(-1)} - ${meta.recommendationPatches[0]}` : '최근 3일';
  return (
    <>
      <PageIntro
        eyebrow="TODAY'S PICKS"
        title="오늘 바로 고를"
        accent="추천 캐릭터"
        description="최신 수집일 기준 최근 3일, 모든 맵 데이터를 바탕으로 역할별 추천 캐릭터를 계산합니다."
      />
      {filters ? (
        <section className="filter-panel recommendation-filter" aria-label="추천 티어 필터">
          <TierFilter filters={filters} selection={selection} onChange={setRecommendationTier} />
        </section>
      ) : <div className="filter-panel loading">필터를 불러오고 있습니다.</div>}
      <div className="recommendation-note">추천 기준: {patchText} · 모든 맵</div>
      {loading && <div className="role-recommendation-grid"><div className="loading">추천 영웅을 계산하고 있습니다.</div></div>}
      {!loading && error && <div className="empty-state">{error}</div>}
      {!loading && !error && (
        <section className="role-recommendation-grid" aria-label="역할별 추천 캐릭터">
          {roleRecommendations.map((group) => <RoleRecommendationGroup group={group} key={group.role} />)}
        </section>
      )}
    </>
  );
}

function heroPower(hero) {
  return (Number(hero.winrate) * 0.55) + (Number(hero.pickrate) * 0.35) - (Number(hero.banrate) * 0.05);
}

function HeroCompare({ heroes }) {
  const qualified = heroes.filter((hero) => Number(hero.pickrate) >= 1);
  const best = [...qualified].sort((a, b) => heroPower(b) - heroPower(a))[0];
  const weakest = [...qualified].sort((a, b) => heroPower(a) - heroPower(b))[0];
  const mostPicked = [...qualified].sort((a, b) => b.pickrate - a.pickrate)[0];
  const cards = [
    { title: '오늘 가장 강한 영웅', hero: best, metric: best && `${rate(best.winrate)} 승률 · ${rate(best.pickrate)} 픽률` },
    { title: '오늘 가장 떨어진 영웅', hero: weakest, metric: weakest && `${rate(weakest.winrate)} 승률 · ${rate(weakest.banrate)} 밴률` },
    { title: '가장 많이 선택된 영웅', hero: mostPicked, metric: mostPicked && `${rate(mostPicked.pickrate)} 픽률` },
  ];
  return (
    <section className="compare-grid" aria-label="영웅 강세 약세 비교">
      {cards.map(({ title, hero, metric }) => (
        <article className="compare-card" key={title}>
          <p className="eyebrow">{title}</p>
          {hero ? (
            <>
              <img src={hero.portrait} alt="" />
              <div>
                <h2>{hero.name}</h2>
                <span>{ROLE_LABELS[hero.role] || hero.role} · {subroleLabel(hero.subrole)}</span>
                <strong>{metric}</strong>
              </div>
            </>
          ) : <div className="empty-mini">데이터 없음</div>}
        </article>
      ))}
    </section>
  );
}

function MetricBar({ value, metric }) {
  const width = Math.min((Number(value || 0) / metric.max) * 100, 100);
  const tone = metric.key === 'winrate' && Number(value) >= 52 ? 'good' : metric.key === 'winrate' && Number(value) < 49 ? 'bad' : '';
  return (
    <div className={`table-meter ${metric.key} ${tone}`}>
      <div style={{ width: `${width}%` }} />
      <span>{rate(value)}</span>
    </div>
  );
}

function HeroStatsTable({ heroes, sort, onSort }) {
  return (
    <div className="stats-table-wrap">
      <table className="stats-table">
        <thead>
          <tr>
            <th><button type="button" onClick={() => onSort('name')}>영웅</button></th>
            {METRICS.map((metric) => (
              <th key={metric.key}><button type="button" onClick={() => onSort(metric.key)}>{metric.label}{sort === metric.key ? ' ↓' : ''}</button></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heroes.map((hero) => (
            <tr key={hero.hero_id}>
              <td>
                <div className="table-hero">
                  <img src={hero.portrait} alt="" loading="lazy" />
                  <div><strong>{hero.name}</strong><span>{ROLE_LABELS[hero.role] || hero.role} · {subroleLabel(hero.subrole)}</span></div>
                </div>
              </td>
              {METRICS.map((metric) => <td key={metric.key}><MetricBar value={hero[metric.key]} metric={metric} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeroesPage({ filters, selection, setHeroStatsFilter, heroes, loading, error }) {
  const [subrole, setSubrole] = useState('all');
  const subroles = useMemo(() => {
    const values = filters?.heroes
      ?.filter((hero) => selection.role === 'all' || hero.role === selection.role)
      .map((hero) => hero.subrole)
      .filter(Boolean) || [];
    return ['all', ...Array.from(new Set(values)).sort()];
  }, [filters, selection.role]);

  useEffect(() => {
    if (subrole !== 'all' && !subroles.includes(subrole)) setSubrole('all');
  }, [subrole, subroles]);

  const visibleHeroes = useMemo(() => heroes
    .filter((hero) => subrole === 'all' || hero.subrole === subrole)
    .sort((a, b) => {
      if (selection.sort === 'name') return a.name.localeCompare(b.name);
      return Number(b[selection.sort] || 0) - Number(a[selection.sort] || 0);
    }), [heroes, selection.sort, subrole]);

  return (
    <>
      {filters ? (
        <section className="filter-panel page-first-panel" aria-label="영웅 통계 필터">
          <TierFilter filters={filters} selection={selection} onChange={(tier) => setHeroStatsFilter('tier', tier)} />
          <RoleButtons value={selection.role} onChange={(role) => setHeroStatsFilter('role', role)} />
          <SubroleButtons values={subroles} value={subrole} onChange={setSubrole} />
        </section>
      ) : <div className="filter-panel loading page-first-panel">필터를 불러오고 있습니다.</div>}
      {!loading && !error && <HeroCompare heroes={visibleHeroes} />}
      {loading && <div className="loading">영웅 통계를 계산하고 있습니다.</div>}
      {!loading && error && <div className="empty-state">{error}</div>}
      {!loading && !error && visibleHeroes.length > 0 && <HeroStatsTable heroes={visibleHeroes} sort={selection.sort} onSort={(sort) => setHeroStatsFilter('sort', sort)} />}
      {!loading && !error && visibleHeroes.length === 0 && <div className="empty-state">조건에 맞는 영웅 데이터가 없습니다.</div>}
    </>
  );
}

function MapRecommendationList({ heroes }) {
  const recommended = [...heroes]
    .filter((hero) => Number(hero.pickrate || 0) >= 1)
    .sort((a, b) => heroPower(b) - heroPower(a))
    .slice(0, 3);

  if (!recommended.length) return null;

  return (
    <section className="map-recommendation-strip" aria-label="맵 추천 영웅">
      {recommended.map((hero, index) => (
        <article className="map-recommendation-card" key={hero.hero_id}>
          <span className="runner-rank">#{index + 1}</span>
          <img src={hero.portrait} alt="" loading="lazy" />
          <div>
            <strong>{hero.name}</strong>
            <small>{ROLE_LABELS[hero.role] || hero.role} · {subroleLabel(hero.subrole)}</small>
          </div>
          <b>{rate(hero.winrate)}</b>
        </article>
      ))}
    </section>
  );
}

function MapHeroRows({ heroes }) {
  const sortedHeroes = [...heroes].sort((a, b) => Number(b.winrate || 0) - Number(a.winrate || 0));

  return (
    <div className="stats-table-wrap compact-map-table">
      <table className="stats-table">
        <thead>
          <tr>
            <th>영웅</th>
            {METRICS.map((metric) => <th key={metric.key}>{metric.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {sortedHeroes.map((hero) => (
            <tr key={hero.hero_id}>
              <td>
                <div className="table-hero">
                  <img src={hero.portrait} alt="" loading="lazy" />
                  <div><strong>{hero.name}</strong><span>{ROLE_LABELS[hero.role] || hero.role} · {subroleLabel(hero.subrole)}</span></div>
                </div>
              </td>
              {METRICS.map((metric) => <td key={metric.key}><MetricBar value={hero[metric.key]} metric={metric} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapPage({ filters, selection, updateSelection, heroes, mapMedia, loading, error, navigate, routeMapKey }) {
  const [subrole, setSubrole] = useState('all');
  const availableMaps = useMemo(() => new Set((filters?.maps || []).map(({ value }) => value)), [filters]);
  const mediaByKey = useMemo(() => new Map(mapMedia.map((map) => [map.key, map])), [mapMedia]);
  const isDetailPage = Boolean(routeMapKey);
  const selectedMap = isDetailPage && selection.map !== 'all-maps' ? selection.map : '';
  const selectedMedia = selectedMap ? mediaByKey.get(selectedMap) : null;
  const selectedLabel = selectedMap ? MAP_LABELS[selectedMap] || selectedMedia?.name || selectedMap : '맵을 선택하세요';
  const selectedScreenshot = selectedMedia?.screenshot || '';
  const subroles = useMemo(() => {
    const values = filters?.heroes
      ?.filter((hero) => selection.role === 'all' || hero.role === selection.role)
      .map((hero) => hero.subrole)
      .filter(Boolean) || [];
    return ['all', ...Array.from(new Set(values)).sort()];
  }, [filters, selection.role]);
  const visibleHeroes = useMemo(() => heroes
    .filter((hero) => subrole === 'all' || hero.subrole === subrole), [heroes, subrole]);

  useEffect(() => {
    const firstMap = filters?.maps?.find(({ value }) => value !== 'all-maps')?.value;
    if (!firstMap) return;

    if (routeMapKey && availableMaps.has(routeMapKey)) {
      if (selection.map !== routeMapKey) updateSelection('map', routeMapKey);
      return;
    }

    if (routeMapKey && !availableMaps.has(routeMapKey)) {
      updateSelection('map', firstMap);
      navigate(mapPath(firstMap), { replace: true });
      return;
    }

    if (selection.map !== 'all-maps') updateSelection('map', 'all-maps');
  }, [availableMaps, filters, navigate, routeMapKey, selection.map, updateSelection]);

  useEffect(() => {
    if (subrole !== 'all' && !subroles.includes(subrole)) setSubrole('all');
  }, [subrole, subroles]);

  const selectMap = (mapKey) => {
    updateSelection('map', mapKey);
    navigate(mapPath(mapKey));
  };

  return (
    <>
      <section
        className={`map-spotlight page-first-panel ${selectedScreenshot ? 'has-image' : ''}`}
        style={selectedScreenshot ? { backgroundImage: `url(${selectedScreenshot})` } : undefined}
      >
        <div className="map-spotlight-copy">
          <p className="eyebrow">MAP STATS</p>
          <h1>{selectedLabel}</h1>
          <span>{selectedMedia?.location || '게임 모드별로 맵을 선택해 통계를 확인합니다.'}</span>
          {isDetailPage && (
            <button type="button" className="map-back-button" onClick={() => navigate('/maps')}>
              맵 목록
            </button>
          )}
        </div>
      </section>

      {!isDetailPage && filters ? (
        <section className="map-mode-board" aria-label="게임 모드별 맵 선택">
          {MAP_MODE_GROUPS.map((group) => {
            const maps = group.maps.filter((mapKey) => availableMaps.has(mapKey));
            if (!maps.length) return null;
            return (
              <div className="map-mode-section" key={group.key}>
                <div className="map-mode-heading">
                  <p className="eyebrow">{group.key}</p>
                  <h2>{group.label}</h2>
                </div>
                <div className="map-button-grid">
                  {maps.map((mapKey) => {
                    const media = mediaByKey.get(mapKey);
                    const isActive = selection.map === mapKey;
                    return (
                      <button
                        type="button"
                        className={`map-button ${isActive ? 'active' : ''}`}
                        style={media?.screenshot ? { backgroundImage: `url(${media.screenshot})` } : undefined}
                        onClick={() => selectMap(mapKey)}
                        key={mapKey}
                      >
                        <span>{MAP_LABELS[mapKey] || media?.name || mapKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      ) : !isDetailPage && <div className="loading page-first-panel">맵 목록을 불러오고 있습니다.</div>}

      {isDetailPage && filters && (
        <section className="filter-panel map-detail-filter" aria-label="맵 상세 필터">
          <TierFilter filters={filters} selection={selection} onChange={(tier) => updateSelection('tier', tier)} />
          <RoleButtons value={selection.role} onChange={(role) => updateSelection('role', role)} />
          <SubroleButtons values={subroles} value={subrole} onChange={setSubrole} />
        </section>
      )}

      {isDetailPage && loading && <div className="loading">맵 통계를 계산하고 있습니다.</div>}
      {isDetailPage && !loading && error && <div className="empty-state">{error}</div>}
      {isDetailPage && !loading && !error && selectedMap && (
        <>
          <MapRecommendationList heroes={visibleHeroes} />
          {visibleHeroes.length > 0 ? <MapHeroRows heroes={visibleHeroes} /> : <div className="empty-state">조건에 맞는 영웅 데이터가 없습니다.</div>}
        </>
      )}
    </>
  );
}

function App() {
  const { path, navigate } = useRoute();
  const routeMapKey = mapKeyFromPath(path);
  const {
    filters,
    selection,
    updateSelection,
    setRecommendationTier,
    setHeroStatsFilter,
    heroes,
    roleRecommendations,
    mapMedia,
    meta,
    loading,
    error,
  } = useDashboardData();

  return (
    <>
      <Header path={path} navigate={navigate} />
      <main id="dashboard">
        {path === '/' && (
          <HomePage
            filters={filters}
            selection={selection}
            setRecommendationTier={setRecommendationTier}
            roleRecommendations={roleRecommendations}
            meta={meta}
            loading={loading}
            error={error}
          />
        )}
        {path === '/heroes' && (
          <HeroesPage filters={filters} selection={selection} setHeroStatsFilter={setHeroStatsFilter} heroes={heroes} loading={loading} error={error} />
        )}
        {isMapsPath(path) && (
          <MapPage
            filters={filters}
            selection={selection}
            updateSelection={updateSelection}
            heroes={heroes}
            mapMedia={mapMedia}
            loading={loading}
            error={error}
            navigate={navigate}
            routeMapKey={routeMapKey}
          />
        )}
      </main>
      <footer><span>OWGG</span><p>비공식 오버워치 통계 대시보드 · 게임 데이터와 이미지는 각 소유권자에게 귀속됩니다.</p></footer>
    </>
  );
}

export default App;
