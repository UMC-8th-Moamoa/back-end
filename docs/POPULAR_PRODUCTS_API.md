# 네이버 쇼핑 베스트 상품 API

네이버 쇼핑 베스트 상품 페이지를 직접 크롤링하여 실시간 인기 상품 정보를 제공하는 API입니다.

## API 엔드포인트

```
GET /api/wishlists/popular
```

## 기능

- 네이버 쇼핑 베스트 상품 페이지 실시간 크롤링
- 상품명, 가격, 이미지 URL, 순위 정보 제공
- 다중 크롤링 방식 지원 (Puppeteer → Axios → 더미 데이터)
- 크롤링 실패 시 자동 대체 데이터 제공

## 요청 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `limit` | integer | 10 | 가져올 상품 개수 (최대 20개) |

## 응답 예시

### 성공 응답

```json
{
  "resultType": "SUCCESS",
  "error": null,
  "success": {
    "products": [
      {
        "productName": "삼성 갤럭시 S24 Ultra 256GB",
        "price": 1570000,
        "productImageUrl": "https://shopping-phinf.pstatic.net/...",
        "url": "https://shopping.naver.com/product/...",
        "mallName": "네이버쇼핑",
        "rank": 1
      },
      {
        "productName": "애플 아이폰 15 Pro 128GB",
        "price": 1550000,
        "productImageUrl": "https://shopping-phinf.pstatic.net/...",
        "url": "https://shopping.naver.com/product/...",
        "mallName": "네이버쇼핑",
        "rank": 2
      }
    ],
    "total": 10,
    "source": "네이버 쇼핑 베스트 상품",
    "crawledAt": "2025-08-05T12:34:56.789Z"
  }
}
```

### 더미 데이터 응답 (크롤링 실패 시)

```json
{
  "resultType": "SUCCESS",
  "error": null,
  "success": {
    "products": [...],
    "total": 10,
    "source": "더미 데이터 (크롤링 실패)",
    "crawledAt": "2025-08-05T12:34:56.789Z",
    "warning": "실제 데이터 크롤링에 실패하여 더미 데이터를 제공합니다."
  }
}
```

## 사용 예시

### 기본 요청 (상위 10개)

```bash
curl -X GET "http://localhost:3000/api/wishlists/popular"
```

### 상위 5개 상품만 요청

```bash
curl -X GET "http://localhost:3000/api/wishlists/popular?limit=5"
```

### JavaScript/Axios

```javascript
import axios from 'axios';

async function getBestProducts(limit = 10) {
  try {
    const response = await axios.get('/api/wishlists/popular', {
      params: { limit }
    });
    
    if (response.data.resultType === 'SUCCESS') {
      return response.data.success.products;
    } else {
      throw new Error(response.data.error.reason);
    }
  } catch (error) {
    console.error('베스트 상품 조회 실패:', error);
    throw error;
  }
}

// 사용법
getBestProducts(5).then(products => {
  console.log('베스트 상품 5개:', products);
});
```

### React 컴포넌트 예시

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BestProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBestProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/wishlists/popular?limit=10');
        
        if (response.data.resultType === 'SUCCESS') {
          setProducts(response.data.success.products);
        } else {
          setError(response.data.error.reason);
        }
      } catch (err) {
        setError('베스트 상품을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBestProducts();
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div className="best-products">
      <h2>네이버 쇼핑 베스트 상품</h2>
      <div className="products-grid">
        {products.map((product, index) => (
          <div key={index} className="product-card">
            <div className="rank">#{product.rank}</div>
            <img src={product.productImageUrl} alt={product.productName} />
            <h3>{product.productName}</h3>
            <p className="price">{product.price.toLocaleString()}원</p>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              상품 보기
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BestProductsList;
```

## 크롤링 방식

1. **Puppeteer (우선순위 1)**: 브라우저 자동화로 동적 콘텐츠 크롤링
   - JavaScript로 렌더링된 콘텐츠도 수집 가능
   - 약 10-15초 소요

2. **Axios + Cheerio (우선순위 2)**: 정적 HTML 파싱
   - 빠른 속도 (1-3초)
   - 동적 콘텐츠는 수집 불가

3. **더미 데이터 (대체)**: 크롤링 실패 시 제공
   - 일관된 응답 보장
   - 개발/테스트 환경에서 유용

## 성능 최적화

- 크롤링 결과 캐싱 (선택사항)
- 요청 간격 제한
- 타임아웃 설정 (30초)
- 재시도 메커니즘

## 주의사항

1. **크롤링 시간**: 첫 번째 요청은 10-15초 정도 소요될 수 있습니다.
2. **rate limiting**: 너무 빈번한 요청은 피해주세요.
3. **로봇 차단**: 네이버에서 크롤링을 차단할 수 있습니다.
4. **데이터 정확성**: 실시간 데이터이므로 빠르게 변경될 수 있습니다.

## 테스트

```bash
# 테스트 실행
npm run test:popular

# 서버 실행 후 브라우저에서 확인
http://localhost:3000/api-docs
```

## 관련 API

- **위시리스트 등록**: `POST /api/wishlists` (기존 네이버 쇼핑 API 검색 방식 유지)
- **위시리스트 조회**: `GET /api/wishlists`
- **API 문서**: `GET /api-docs`
