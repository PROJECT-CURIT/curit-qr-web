export type ProductDetail = {
  description: string
  beginning: string
  concept: string
  quote: string
  composition: string
  care: string
  tags: string[]
}

export const productDetails: Record<string, ProductDetail> = {
  "0-0": {
    description: "따뜻한 한 잔을 위한, 손으로 빚은 머그",
    beginning:
      "매일 가장 먼저 손이 가는 그릇을 만들고 싶었어요. 커피 한 잔을 마시는 짧은 시간이 조금 더 편안해지길 바라며 빚었습니다.",
    concept:
      "화이트와 그레이의 차분한 색에 흙의 결을 남겼습니다. 손으로 빚어 조금씩 다른 모양이 이 머그만의 표정이에요.",
    quote: "당신이 쉬어가는 한 잔의 시간에 함께하고 싶어요.",
    composition: "머그컵 1개",
    care: "부드러운 스펀지로 세척하고 충격을 피해 주세요.",
    tags: ["머그컵", "화이트·그레이", "핸드메이드", "테이블웨어"],
  },
  "0-1": {
    description: "두 개의 그릇으로 완성하는, 작은 식탁",
    beginning:
      "함께 밥을 먹는 시간에는 그릇도 서로 어울렸으면 했어요. 나란히 놓았을 때 편안한 한 쌍이 되도록 두 개의 볼을 만들었습니다.",
    concept:
      "샐러드와 과일, 가벼운 한 끼를 담아 보세요. 같은 손끝에서 태어났지만 조금씩 다른 두 그릇이 식탁에 자연스러운 리듬을 더합니다.",
    quote: "함께 놓였을 때 더 따뜻해지는 그릇을 만들고 싶었어요.",
    composition: "볼 2개 · 세트 상품",
    care: "볼 사이에 부드러운 천을 두고 보관해 주세요.",
    tags: ["볼 세트", "2개 구성", "핸드메이드", "식탁"],
  },
  "0-2": {
    description: "좋아하는 디저트를 위한, 작은 여백",
    beginning:
      "카페에서 만난 디저트 한 조각의 기분을 집에서도 이어가고 싶었어요. 음식이 주인공이 되는 담백한 접시를 생각했습니다.",
    concept:
      "케이크나 구움과자를 한 조각 올려 보세요. 흙의 자연스러운 결이 담긴 접시가 티타임에 조용한 온기를 더합니다.",
    quote: "작은 디저트 하나에도 여유를 담을 수 있기를.",
    composition: "디저트 플레이트 1개",
    care: "가장자리에 충격을 주지 말고 부드럽게 세척해 주세요.",
    tags: ["디저트 접시", "티타임", "핸드메이드", "도예"],
  },
}

export const projects = [
  {
    id: 0,
    title: "흙의 기억",
    artist: "김서연",
    handle: "@soyeon_craft",
    desc: "손으로 빚은 계절의 흔적들",
    status: "매칭 모집 중",
    img: "/artworks/reference-0.jpg",
    price: "35,000–82,000원",
    location: "서울·경기",
    tags: ["우드톤", "미니멀", "자연", "테이블웨어"],
    likes: 128,
    views: 1043,
    whyStart:
      "제주 이주 후 돌밭의 흙을 처음 만지던 날을 잊지 못해요. 섬의 계절이 손끝에서 그릇이 됩니다.",
    concept:
      "2019년 제주 이주 후 만지기 시작한 흙이 지금의 작업이 되었어요. 섬의 계절을 담은 그릇들은 온기를 오래 품습니다. 이번 시즌은 가을·겨울의 깊은 색감으로 구성했습니다.",
    goods: [
      {
        name: "머그컵 (화이트·그레이)",
        price: 35000,
        stock: 12,
        img: "/artworks/reference-1.jpg",
      },
      {
        name: "볼 세트 (2개)",
        price: 82000,
        stock: 6,
        img: "/artworks/bowl-set.jpg",
      },
      {
        name: "디저트 플레이트",
        price: 55000,
        stock: 8,
        img: "/artworks/dessert-plate.jpg",
      },
    ],
    spaces: ["내추럴 우드 카페", "독립서점", "디저트 카페", "수제 베이커리"],
    spaceAvoid: "야외 공간, 클럽 분위기 업장은 어렵습니다",
    installImg:
      "https://images.unsplash.com/photo-1785302710677-69cc4ea97bee?w=800&h=500&fit=crop&auto=format",
    installNote:
      "충격에 취약하므로 안정적인 선반 위에 배치해 주세요. 직사광선은 피해 주시면 좋아요.",
    deliveryInfo: "서울·경기 직접 배송 가능 (왕복 포함). 타 지역은 포장 배송.",
    communityPosts: [
      {
        text: "초벌구이 마치고 꺼낸 그릇들. 이번 시즌 색감이 더 깊게 나왔어요.",
        img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop&auto=format",
        likes: 64,
        time: "2일 전",
      },
      {
        text: "성수 서점 설치 완료! 나무 선반 위에 잘 어울려요.",
        img: "https://images.unsplash.com/photo-1785302710677-69cc4ea97bee?w=400&h=300&fit=crop&auto=format",
        likes: 43,
        time: "5일 전",
      },
    ],
    dna: {
      moods: ["따뜻함", "정적인", "자연적"],
      colors: ["아이보리", "딥 그레이", "테라코타"],
      materials: ["세라믹", "제주 흙", "유약"],
      emotions: ["안도", "여유", "온기"],
      seasons: ["가을", "겨울"],
      spaceTypes: ["우드톤 카페", "독립서점"],
    },
  },
  {
    id: 1,
    title: "새벽의 형태",
    artist: "이하늘",
    handle: "@hanuel_print",
    desc: "도시 새벽을 담은 흑백 판화 시리즈",
    status: "매칭 완료",
    img: "/artworks/reference-4.jpg",
    price: "45,000–220,000원",
    location: "서울 전역",
    tags: ["모노크롬", "모던", "감각적", "프린트"],
    likes: 87,
    views: 740,
    whyStart:
      "새벽 5시 을지로의 골목길에서 빛이 사라지는 순간을 포착하고 싶었어요.",
    concept:
      "서울 새벽 거리를 오가며 관찰한 빛과 그림자의 기록. 흑백이지만 공간에서는 생각보다 훨씬 따뜻하게 느껴진다는 말을 자주 들어요.",
    goods: [
      {
        name: "A4 판화 (을지로 시리즈)",
        price: 45000,
        stock: 20,
        img: "/artworks/reference-5.jpg",
      },
      {
        name: "A3 판화 (한정판)",
        price: 90000,
        stock: 5,
        img: "/artworks/reference-5.jpg",
      },
      {
        name: "프레임 세트 (A4+)",
        price: 220000,
        stock: 3,
        img: "/artworks/reference-5.jpg",
      },
    ],
    spaces: ["감각적인 카페바", "갤러리 숍", "편집샵", "아트 카페"],
    spaceAvoid: "강렬한 원색 인테리어 공간에는 어울리지 않을 수 있어요",
    installImg:
      "https://images.unsplash.com/photo-1780345493801-d343616b49b1?w=800&h=500&fit=crop&auto=format",
    installNote: "벽면에 핀 또는 전용 액자 걸이 사용. 직사광선 피해 주세요.",
    deliveryInfo: "튜브 포장 배송 가능. 프레임 세트는 직접 배달 권장.",
    communityPosts: [
      {
        text: "을지로 새벽 시리즈 마지막 컷. 흑백이지만 공간에서는 따뜻해요.",
        img: "https://images.unsplash.com/photo-1621341104121-d610c0dc4228?w=400&h=300&fit=crop&auto=format",
        likes: 43,
        time: "1일 전",
      },
    ],
    dna: {
      moods: ["감각적", "도시적", "절제된"],
      colors: ["흑", "백", "다크 그레이"],
      materials: ["판화", "한지", "잉크"],
      emotions: ["긴장감", "적막", "세련됨"],
      seasons: ["봄", "가을"],
      spaceTypes: ["갤러리", "카페바"],
    },
  },
  {
    id: 2,
    title: "고요한 초록",
    artist: "박수아",
    handle: "@sua_textile",
    desc: "이끼와 식물에서 영감받은 패브릭 굿즈",
    status: "전시·판매 중",
    img: "https://images.unsplash.com/photo-1611489704434-2612dc89c992?w=600&h=600&fit=crop&auto=format",
    price: "18,000–45,000원",
    location: "서울·경기·인천",
    tags: ["파스텔", "보태니컬", "포근함", "패브릭"],
    likes: 204,
    views: 1521,
    whyStart:
      "산책하며 만난 이끼와 잎들을 패브릭으로 옮기고 싶었어요. 공간 한 켠에 작은 숲이 생기길 바랍니다.",
    concept:
      "식물이 가진 조용한 에너지를 천에 담았어요. 계절마다 다른 녹색의 농도를 표현합니다.",
    goods: [
      {
        name: "식물 자수 파우치",
        price: 18000,
        stock: 30,
        img: "/artworks/reference-3.jpg",
      },
      {
        name: "린넨 쿠션커버",
        price: 45000,
        stock: 15,
        img: "https://images.unsplash.com/photo-1611489704434-2612dc89c992?w=600&h=600&fit=crop&auto=format",
      },
      {
        name: "에코백 (그린·세이지)",
        price: 28000,
        stock: 20,
        img: "/artworks/reference-3.jpg",
      },
    ],
    spaces: ["식물 카페", "플라워 숍", "라이프스타일 숍", "요가 스튜디오"],
    spaceAvoid: "주류 중심 업장이나 어두운 조명 공간은 피해 주세요",
    installImg:
      "https://images.unsplash.com/photo-1785302710677-69cc4ea97bee?w=800&h=500&fit=crop&auto=format",
    installNote:
      "선반 위 진열 또는 벽면 행거 걸이 사용. 세탁 불가한 제품은 직사광선 주의.",
    deliveryInfo: "일반 택배 가능. 부피 작아 파손 위험 낮음.",
    communityPosts: [
      {
        text: "성수 독립서점 납품 완료! 선반 위에 놓이니 더 예뻐요.",
        img: "https://images.unsplash.com/photo-1785302710677-69cc4ea97bee?w=400&h=300&fit=crop&auto=format",
        likes: 118,
        time: "6시간 전",
      },
    ],
    dna: {
      moods: ["포근한", "자연적", "여유로운"],
      colors: ["세이지 그린", "베이지", "크림"],
      materials: ["면", "린넨", "자수실"],
      emotions: ["평안", "포근함", "생동감"],
      seasons: ["봄", "여름"],
      spaceTypes: ["식물 카페", "플라워 숍"],
    },
  },
  {
    id: 3,
    title: "점토의 온도",
    artist: "최민준",
    handle: "@minjun_clay",
    desc: "오래 두고 싶은 일상의 그릇들",
    status: "매칭 모집 중",
    img: "/artworks/reference-6.jpg",
    price: "35,000–120,000원",
    location: "서울",
    tags: ["테라코타", "핸드메이드", "온기", "도예"],
    likes: 91,
    views: 882,
    whyStart:
      "빚을 때 남는 손자국이 작품이 되는 순간이 좋았어요. 완벽하지 않아도 괜찮다는 걸 그릇으로 전하고 싶어요.",
    concept:
      "손자국이 남은 그릇이 오히려 더 오래 곁에 두고 싶어집니다. 이번 시즌은 테라코타 계열의 따뜻한 색감으로.",
    goods: [
      {
        name: "작은 볼 (테라코타)",
        price: 35000,
        stock: 10,
        img: "/artworks/reference-2.jpg",
      },
      {
        name: "핸드 주전자",
        price: 120000,
        stock: 4,
        img: "/artworks/reference-2.jpg",
      },
      {
        name: "컵받침 세트 (3개)",
        price: 48000,
        stock: 7,
        img: "/artworks/reference-1.jpg",
      },
    ],
    spaces: ["우드톤 카페", "빈티지 서점", "수제 베이커리", "디저트 카페"],
    spaceAvoid: "컨셉이 너무 강한 테마 카페는 작품과 어울리지 않을 수 있어요",
    installImg:
      "https://images.unsplash.com/photo-1787755416818-eb38ae7d9a1e?w=800&h=500&fit=crop&auto=format",
    installNote:
      "평평한 선반 필수. 손잡이 부분에 충격 주의. 가급적 눈높이 배치.",
    deliveryInfo: "뽁뽁이 이중 포장. 직접 설치 가능 (서울 한정).",
    communityPosts: [
      {
        text: "오늘 새벽 가마에서 꺼낸 주전자. 이번 시즌 최애 아이템이에요.",
        img: "https://images.unsplash.com/photo-1557644978-f61037cfbe49?w=400&h=300&fit=crop&auto=format",
        likes: 31,
        time: "3일 전",
      },
    ],
    dna: {
      moods: ["소박한", "따뜻한", "손맛"],
      colors: ["테라코타", "베이지", "번트 오렌지"],
      materials: ["점토", "유약", "핸드빌딩"],
      emotions: ["편안함", "인간적", "온기"],
      seasons: ["가을", "겨울"],
      spaceTypes: ["우드톤 카페", "베이커리"],
    },
  },
]
