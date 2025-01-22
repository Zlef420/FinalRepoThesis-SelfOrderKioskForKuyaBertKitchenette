// src/context/SharedStateContext.jsx
import React, { createContext, useState, useContext } from "react";

const SharedStateContext = createContext();

export const SharedStateProvider = ({ children }) => {
  const [uploadedImages, setUploadedImages] = useState([
    { id: 1, image: "/images/photos/sisig.png" },
    { id: 2, image: "/images/photos/sinigang.png" },
    { id: 3, image: "/images/photos/kare-kare.png" },
  ]);

  return (
    <SharedStateContext.Provider value={{ uploadedImages, setUploadedImages }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = () => useContext(SharedStateContext);
