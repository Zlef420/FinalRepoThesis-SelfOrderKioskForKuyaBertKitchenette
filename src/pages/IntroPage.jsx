import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircleChevronLeft, CircleChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient"; // Import Supabase client

function IntroPage() {
  const [advertisementImages, setAdvertisementImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  const [resetTimer, setResetTimer] = useState(0); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAds = async () => {
      setIsLoadingAds(true);
      try {
        const { data, error } = await supabase
          .from('intro_advertisements') // Corrected table name
          .select('slot_id, image_url')   // Corrected column names
          .not('image_url', 'is', null) // Filter out null or empty image_urls
          .neq('image_url', '')
          .order('slot_id', { ascending: true }); // Order by slot_id for consistent display

        if (error) {
          console.error("Error fetching intro advertisement images from Supabase:", error);
          throw error; // Re-throw to be caught by the outer catch
        }
        
        // Ensure data is not null and filter out any ads that might still have null/empty image_url
        const validAds = data ? data.filter(ad => ad.image_url) : [];

        const formattedAds = validAds.map(ad => ({
          id: `intro-ad-${ad.slot_id}`, // Use slot_id for a unique key
          image: ad.image_url          // Use image_url for the image source
        }));
        setAdvertisementImages(formattedAds);
      } catch (error) { // This catch will now handle errors from the query or if data is null/falsy
        console.error("Error in fetchAds logic or Supabase query processing:", error);
        setAdvertisementImages([]); // Set to empty array on error
      } finally {
        setIsLoadingAds(false);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    if (advertisementImages.length === 0) return;
    const interval = setInterval(() => {
      goToNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [resetTimer, advertisementImages.length]);

  const goToNext = () => {
    if (advertisementImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % advertisementImages.length);
    setResetTimer((prev) => prev + 1);
  };

  const goToPrevious = () => {
    if (advertisementImages.length === 0) return;
    setCurrentIndex((prev) =>
      prev === 0 ? advertisementImages.length - 1 : prev - 1
    );
    setResetTimer((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center text-white">
      <Header />
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-[85%] h-[75vh] mx-auto overflow-hidden rounded-lg -mt-3.5">
          <div
            className="absolute inset-0 flex transition-transform duration-[1500ms] ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {isLoadingAds ? (
              <div className="w-full h-full flex-shrink-0 flex items-center justify-center">
                <p className="text-xl text-white">Loading advertisements...</p>
              </div>
            ) : advertisementImages.length > 0 ? (
              advertisementImages.map((item, index) => (
                <div key={item.id} className="w-full h-full flex-shrink-0">
                  <img
                    src={item.image}
                    alt="Advertisement"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex-shrink-0 flex items-center justify-center bg-gray-700">
                <img src="/images/photos/KBcover.png" alt="Kuya Bert Kiosk" className="w-full h-full object-contain"/>
              </div>
            )}
          </div>
        </div>
        {advertisementImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 sm:left-6 md:left-8 lg:left-10 bg-transparent border-black px-0 py-0 rounded-full hover:bg-[#d94e1e] transition z-10"
            >
              <CircleChevronLeft className="size-8 sm:size-10 md:size-12" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 sm:right-6 md:right-8 lg:right-10 bg-transparent border-black px-0 py-0 rounded-full hover:bg-[#d94e1e] transition z-10"
            >
              <CircleChevronRight className="size-8 sm:size-10 md:size-12" />
            </button>
          </>
        )}
      </div>
      <div className="flex justify-center -mt-3">
        <button
          onClick={() => navigate("/home")}
          className="bg-[#EF5C28] text-white w-[65%] px-10 sm:px-20 md:px-40 lg:px-60 py-3 rounded-lg text-lg font-bold hover:bg-[#d94e1e] transition -mb-3 z-40"
        >
          Tap to Order
        </button>
      </div>
      <div className="flex-none mt-4">
        <Footer />
      </div>
    </div>
  );
}

export default IntroPage;
