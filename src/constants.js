export const ROLE_LABELS = { tank: '돌격', damage: '공격', support: '지원' };

export const SUBROLE_LABELS = {
  flanker: '측면 공격가',
  recon: '수색가',
  sharpshooter: '명사수',
  specialist: '전문가',
  stalwart: '강건한 자',
  initiator: '개시자',
  bruiser: '투사',
  medic: '의무관',
  survivor: '생존왕',
  tactician: '전술가',
};

export const TIER_LABELS = {
  Bronze: '브론즈',
  Silver: '실버',
  Gold: '골드',
  Platinum: '플래티넘',
  Diamond: '다이아몬드',
  Master: '마스터',
  Grandmaster: '그랜드마스터',
};

export const TIER_MARKS = {
  all: { label: '전체', mark: 'ALL', tone: '#f5f7ff' },
  Bronze: { label: '브론즈', image: '/images/bronze.webp', tone: '#b77952' },
  Silver: { label: '실버', image: '/images/silver.webp', tone: '#c2cad8' },
  Gold: { label: '골드', image: '/images/gold.webp', tone: '#f0bf56' },
  Platinum: { label: '플래티넘', image: '/images/platinum.webp', tone: '#72d2d5' },
  Diamond: { label: '다이아몬드', image: '/images/diamond.webp', tone: '#8fc8ff' },
  Master: { label: '마스터', image: '/images/master.webp', tone: '#d79aff' },
  Grandmaster: { label: '그랜드마스터', image: '/images/grandmaster.webp', tone: '#ff7b65' },
};

export const MAP_LABELS = {
  'all-maps': '모든 맵',
  'antarctic-peninsula': '남극 반도',
  nepal: '네팔',
  'lijiang-tower': '리장 타워',
  busan: '부산',
  samoa: '사모아',
  oasis: '오아시스',
  ilios: '일리오스',
  'route-66': '66번 국도',
  'watchpoint-gibraltar': '감시 기지: 지브롤터',
  dorado: '도라도',
  rialto: '리알토',
  'shambali-monastery': '샴발리 수도원',
  'circuit-royal': '서킷 로얄',
  junkertown: '쓰레기촌',
  havana: '하바나',
  'new-junk-city': '뉴 정크 시티',
  suravasa: '수라바사',
  aatlis: '아틀리스',
  numbani: '눔바니',
  midtown: '미드타운',
  'blizzard-world': '블리자드 월드',
  eichenwalde: '아이헨발데',
  'kings-row': '왕의 길',
  paraiso: '파라이수',
  hollywood: '할리우드',
  'new-queen-street': '뉴 퀸 스트리트',
  runasapi: '루나사피',
  esperanca: '이스페란사',
  colosseo: '콜로세오',
  'neon-junction': '네온 정션',
};

export const MAP_MODE_GROUPS = [
  {
    key: 'CONTROL',
    label: '쟁탈',
    maps: ['antarctic-peninsula', 'nepal', 'lijiang-tower', 'busan', 'samoa', 'oasis', 'ilios'],
  },
  {
    key: 'ESCORT',
    label: '호위',
    maps: ['route-66', 'watchpoint-gibraltar', 'dorado', 'rialto', 'shambali-monastery', 'circuit-royal', 'junkertown', 'havana'],
  },
  {
    key: 'HYBRID',
    label: '혼합',
    maps: ['numbani', 'midtown', 'blizzard-world', 'eichenwalde', 'kings-row', 'paraiso', 'hollywood', 'neon-junction'],
  },
  {
    key: 'PUSH',
    label: '밀기',
    maps: ['new-queen-street', 'runasapi', 'esperanca', 'colosseo'],
  },
  {
    key: 'FLASHPOINT',
    label: '플래시포인트',
    maps: ['new-junk-city', 'suravasa', 'aatlis'],
  },
];

export const METRICS = [
  { key: 'pickrate', label: '픽률', color: '#38d6da', max: 60 },
  { key: 'winrate', label: '승률', color: '#5b8cff', max: 60 },
  { key: 'banrate', label: '밴률', color: '#ff7849', max: 50 },
];
