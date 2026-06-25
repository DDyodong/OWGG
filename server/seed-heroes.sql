PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

INSERT INTO heroes (hero_id, name, role, subrole)
VALUES
    ('dva', 'D.Va', 'tank', 'initiator'),
    ('doomfist', '둠피스트', 'tank', 'initiator'),
    ('wrecking-ball', '레킹볼', 'tank', 'initiator'),
    ('winston', '윈스턴', 'tank', 'initiator'),
    ('hazard', '해저드', 'tank', 'initiator'),

    ('roadhog', '로드호그', 'tank', 'bruiser'),
    ('mauga', '마우가', 'tank', 'bruiser'),
    ('orisa', '오리사', 'tank', 'bruiser'),
    ('zarya', '자리야', 'tank', 'bruiser'),

    ('domina', '도미나', 'tank', 'stalwart'),
    ('ramattra', '라마트라', 'tank', 'stalwart'),
    ('reinhardt', '라인하르트', 'tank', 'stalwart'),
    ('sigma', '시그마', 'tank', 'stalwart'),
    ('junker-queen', '정커퀸', 'tank', 'stalwart'),

    ('mei', '메이', 'damage', 'specialist'),
    ('bastion', '바스티온', 'damage', 'specialist'),
    ('soldier-76', '솔저: 76', 'damage', 'specialist'),
    ('symmetra', '시메트라', 'damage', 'specialist'),
    ('emre', '엠레', 'damage', 'specialist'),
    ('junkrat', '정크랫', 'damage', 'specialist'),
    ('torbjorn', '토르비욘', 'damage', 'specialist'),

    ('sombra', '솜브라', 'damage', 'recon'),
    ('sierra', '시에라', 'damage', 'recon'),
    ('echo', '에코', 'damage', 'recon'),
    ('pharah', '파라', 'damage', 'recon'),
    ('freja', '프레야', 'damage', 'recon'),

    ('genji', '겐지', 'damage', 'flanker'),
    ('reaper', '리퍼', 'damage', 'flanker'),
    ('vendetta', '벤데타', 'damage', 'flanker'),
    ('venture', '벤처', 'damage', 'flanker'),
    ('shion', '시온', 'damage', 'flanker'),
    ('anran', '안란', 'damage', 'flanker'),
    ('tracer', '트레이서', 'damage', 'flanker'),

    ('sojourn', '소전', 'damage', 'sharpshooter'),
    ('ashe', '애쉬', 'damage', 'sharpshooter'),
    ('widowmaker', '위도우메이커', 'damage', 'sharpshooter'),
    ('cassidy', '캐서디', 'damage', 'sharpshooter'),
    ('hanzo', '한조', 'damage', 'sharpshooter'),

    ('lucio', '루시우', 'support', 'tactician'),
    ('baptiste', '바티스트', 'support', 'tactician'),
    ('ana', '아나', 'support', 'tactician'),
    ('zenyatta', '젠야타', 'support', 'tactician'),
    ('jetpack-cat', '제트팩 캣', 'support', 'tactician'),

    ('lifeweaver', '라이프위버', 'support', 'medic'),
    ('mercy', '메르시', 'support', 'medic'),
    ('moira', '모이라', 'support', 'medic'),
    ('kiriko', '키리코', 'support', 'medic'),

    ('mizuki', '미즈키', 'support', 'survivor'),
    ('brigitte', '브리기테', 'support', 'survivor'),
    ('illari', '일리아리', 'support', 'survivor'),
    ('wuyang', '우양', 'support', 'survivor'),
    ('juno', '주노', 'support', 'survivor')
ON CONFLICT(hero_id) DO UPDATE SET
    name = excluded.name,
    role = excluded.role,
    subrole = excluded.subrole;

COMMIT;
