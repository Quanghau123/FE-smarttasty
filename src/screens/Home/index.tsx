import SlideHeader from "@/components/layouts/SlideHeader";
import Body from "@/components/layouts/Body";
import Menu from "@/components/layouts/Menu";
// import RestaurantRating from "@/components/Test/RestaurantRating";
import Chatbot from "@/components/features/Chatbot/ChatBot";
import Notification from "@/components/Test/Notification";

const index = () => {
  return (
    <>
      <SlideHeader />
      <Menu />
      <Notification />
      {/* <RestaurantRating restaurantId="2" /> */}
      <Chatbot />
      <Body />
    </>
  );
};
export default index;
