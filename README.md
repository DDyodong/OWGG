# OWGG
Overwatch hero meta dashboard with win rate, pick rate, ban rate, and custom meta analysis.

## 요구사항
- Node.js
- Python 3.x

## 설치

### Node
```bash
npm install
```

### Python
```bash
pip install playwright beautifulsoup4
playwright install chromium
```

## 실행

### 1. DB 초기화 (최초 1회)
```bash
node server/server.js
```

### 2. 데이터 수집
`crawler/main.py` 상단의 `patch` 변수를 현재 패치명으로 수정
```python
patch = "S16"   # 시즌 패치
patch = "S16M"  # 미드시즌 패치
```
```bash
cd crawler
python main.py
```

### 3. 서버 실행
```bash
node server/server.js
```

## 패치 수집 주기
- 시즌 패치 / 미드시즌 패치 기준으로 수동 수집