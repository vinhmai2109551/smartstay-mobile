export const HeroImage = require('@/assets/images/hero-hotel.jpg');

export const DemoRoomImageByName: Record<string, number> = {
  'Deluxe View Biển': require('@/assets/images/room-deluxe.jpg'),
  'Suite Gia Đình': require('@/assets/images/room-suite.jpg'),
  'Bungalow Vườn': require('@/assets/images/room-garden.jpg'),
  'Dorm 6 Giường': require('@/assets/images/room-dorm.jpg'),
};

type TFunction = (key: string) => string;

/** Slides for the home-screen hero carousel. Built from a `t` function so the copy follows the app language. */
export function getHomeHeroSlides(t: TFunction) {
  return [
    { image: HeroImage, eyebrow: t('home.hero1Eyebrow'), title: t('home.hero1Title') },
    { image: DemoRoomImageByName['Deluxe View Biển'], eyebrow: t('home.hero2Eyebrow'), title: t('home.hero2Title') },
    { image: DemoRoomImageByName['Bungalow Vườn'], eyebrow: t('home.hero3Eyebrow'), title: t('home.hero3Title') },
    { image: DemoRoomImageByName['Suite Gia Đình'], eyebrow: t('home.hero4Eyebrow'), title: t('home.hero4Title') },
  ];
}

/** Slides for the search-screen header. */
export function getSearchHeroSlides(t: TFunction) {
  return [
    { image: DemoRoomImageByName['Suite Gia Đình'], eyebrow: t('search.hero1Eyebrow'), title: t('search.hero1Title') },
    {
      image: DemoRoomImageByName['Deluxe View Biển'],
      eyebrow: t('search.hero2Eyebrow'),
      title: t('search.hero2Title'),
    },
    { image: HeroImage, eyebrow: t('search.hero3Eyebrow'), title: t('search.hero3Title') },
  ];
}
