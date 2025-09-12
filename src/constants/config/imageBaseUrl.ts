const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/hoangphat11/SmartTasty_Fontend/main/src/assets/Image/";

export const getImageUrl = (filename: string) => `${IMAGE_BASE_URL}${filename}`;

export default IMAGE_BASE_URL;
