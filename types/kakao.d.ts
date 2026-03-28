// 카카오 우편번호 서비스 공유 타입 선언
// members/new, members/[id] 등 여러 파일에서 재사용

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;       // 우편번호
          roadAddress: string;    // 도로명 주소
          jibunAddress?: string;  // 지번 주소 (옵셔널)
        }) => void;
      }) => { open: () => void };
    };
  }
}

export {};
