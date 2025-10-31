import SlideHeader from "@/components/layouts/SlideHeader";
//import Test from "@/components/Test";
import Body from "@/components/layouts/Body";
import Menu from "@/components/layouts/Menu";
import Test from "@/components/Test";

const index = () => {
  return (
    <>
      <SlideHeader />
      <Menu />
      <Test restaurantId="2" />
      <Body />
    </>
  );
};
export default index;
