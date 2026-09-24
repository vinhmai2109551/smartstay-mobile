export const HeroImage = require('@/assets/images/hero-hotel.jpg');

export const DemoRoomImageByName: Record<string, number> = {
  'Deluxe View Biển': require('@/assets/images/room-deluxe.jpg'),
  'Suite Gia Đình': require('@/assets/images/room-suite.jpg'),
  'Bungalow Vườn': require('@/assets/images/room-garden.jpg'),
  'Dorm 6 Giường': require('@/assets/images/room-dorm.jpg'),
};

/** Slides for the home-screen hero carousel. */
export const HomeHeroSlides = [
  { image: HeroImage, eyebrow: 'SMARTSTAY ĐÀ NẴNG', title: 'Kỳ nghỉ của bạn\nbắt đầu từ đây' },
  { image: DemoRoomImageByName['Deluxe View Biển'], eyebrow: 'HƯỚNG BIỂN', title: 'Thức dậy cùng\nbình minh biển' },
  { image: DemoRoomImageByName['Bungalow Vườn'], eyebrow: 'XANH MÁT', title: 'Bình yên giữa\nkhu vườn nhiệt đới' },
  { image: DemoRoomImageByName['Suite Gia Đình'], eyebrow: 'CHO GIA ĐÌNH', title: 'Rộng rãi cho\ncả nhà sum vầy' },
];

/** Slides for the search-screen header. */
export const SearchHeroSlides = [
  { image: DemoRoomImageByName['Suite Gia Đình'], eyebrow: 'ĐẶT PHÒNG', title: 'Chọn ngày,\nchọn phòng ưng ý' },
  { image: DemoRoomImageByName['Deluxe View Biển'], eyebrow: 'ƯU ĐÃI MỖI NGÀY', title: 'Giá tốt nhất khi\nđặt trực tiếp' },
  { image: HeroImage, eyebrow: 'XÁC NHẬN TỨC THÌ', title: 'Nhận mã đặt phòng\nngay sau khi đặt' },
];
