import SlideHeader from "@/components/layouts/SlideHeader";
//import Test from "@/components/Test";
import Body from "@/components/layouts/Body";
import Menu from "@/components/layouts/Menu";
import ChatBot from "@/components/features/Chatbot/ChatBot";

const index = () => {
  return (
    <>
      <SlideHeader />
      <Menu />
      <ChatBot />
      <Body />
    </>
  );
};
export default index;
