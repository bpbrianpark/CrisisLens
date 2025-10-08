import { useState } from "react";

export const useNewsModal = () => {
  const [selectedNews, setSelectedNews] = useState(null);
  const [locationNames, setLocationNames] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (news, names) => {
    setSelectedNews(news);
    setLocationNames(names);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNews(null);
    setLocationNames(null);
    setIsModalOpen(false);
  };

  return {
    selectedNews,
    locationNames,
    isModalOpen,
    openModal,
    closeModal,
  };
};
