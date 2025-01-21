# CrisisLens 🌍📹

<div style="display: flex; gap: 10px; flex-wrap: nowrap;">
  <img src="https://github.com/user-attachments/assets/b7a9422a-fe9b-4cad-b0b4-62629fd76b99" alt="Screen Recording 1" width="200">
  <img src="https://github.com/user-attachments/assets/ac70e879-5780-4fa2-b621-7b803b38f688" alt="Screen Recording 2" width="200">
  <img src="https://github.com/user-attachments/assets/bb113a28-f79a-4b9d-9256-18e875480e35" alt="Screen Recording 3" width="200">
  <img src="https://github.com/user-attachments/assets/3a7283ab-12ff-42a3-92a6-77dea1fcafca" alt="Screen Recording 4" width="200">
</div>


## 🌟 **Inspiration**

CrisisLens was inspired by two pivotal global trends:

- 🚨 **The Evolving Social Media Landscape**: The ongoing discussions around the TikTok ban and Meta’s shifting policies on censorship highlighted the importance of alternative platforms for open, user-driven content sharing. Peer-to-peer video streaming felt like the ideal solution to ensure transparency and authenticity.
- 🌿 **Climate Change and Natural Disasters**: The devastating wildfires in Los Angeles and the rising frequency of natural disasters due to climate change motivated us to build a tool that could empower communities with real-time crisis information.

We realized that decentralized video sharing could play a vital role in crisis information dissemination—putting the power of communication directly into the hands of people on the ground. 🌟

---

## 📖 **What We Learned**

Creating CrisisLens offered us incredible insights across technology, design, and human-centered problem-solving:

- **Decentralized Video Streaming**: Leveraging Livepeer taught us how to handle real-time, peer-to-peer video streaming in a decentralized way, enabling seamless, scalable video sharing. 🎥🔗
- **Designing for Mobile**: Prioritizing a mobile-first design was critical. We ensured the platform was responsive and intuitive, acknowledging that users in high-stakes scenarios rely heavily on smartphones. 📱✨

- **Human Behavior in High-Stakes Situations**: Understanding user needs during crises was pivotal. We designed interfaces and workflows to reduce cognitive load, enabling quick and efficient access to life-saving information. 🌍🤝

---

## 🛠️ **How We Built It**

Our tech stack was meticulously chosen to handle the challenges of real-time decentralized streaming, dynamic mapping, and content management:

### **Tech Stack** 🛠️

- **Vite**: Development server for a fast, modern frontend build experience ⚡
- **Node.js**: Backend runtime environment to handle scalable server-side operations 🌐
- **Livepeer**: Decentralized video infrastructure for real-time peer-to-peer streaming 📹
- **Mapbox**: Map SDK to visualize crisis locations and regions dynamically on an interactive map 🗺️
- **Google Firebase**: Database to manage and store real-time user data efficiently 🔥
- **TheNewsAPI**: To retrieve and filter topic-specific news stories based on stream locations 📰

### **Key Features**

1. **Decentralized Video Streaming**: Using **Livepeer**, we enabled seamless, peer-to-peer video sharing, allowing users to capture and upload events directly from their devices.
2. **Dynamic Zone Mapping**: Implemented with **Mapbox**, this feature visualizes geolocated video uploads and overlays them with crisis zones in real-time.
3. **Topic-Specific News Integration**: Leveraged **TheNewsAPI** to fetch relevant news articles dynamically based on user-submitted stream locations.
4. **Mobile-Optimized Design**: Built using **Vite** and tailored to mobile devices for usability in high-stakes emergency scenarios.
5. **Real-Time Data Storage**: Integrated **Google Firebase** to store video metadata, user interactions, and map coordinates.

---

## 🚧 **Challenges We Faced**

- **Leveraging Livepeer**: Implementing decentralized video streaming required understanding how to optimize performance and reliability across diverse network conditions.
- **Topic-Specific News Retrieval**: Building an algorithm to pull relevant news based on stream locations presented challenges in filtering and ranking results efficiently.
- **Zone Mapping Complexity**: The convex hull algorithm used for mapping zones added computational challenges, especially in dynamically changing environments.

---

## 🚀 **The Vision Ahead**

CrisisLens is just the beginning. We aim to further enhance the platform by:

- Integrating **AI-driven content verification** for reliable, real-time updates.
- Exploring partnerships with emergency services to improve disaster response.
- Enabling offline-first functionality for use in areas with limited connectivity.

With CrisisLens, we hope to redefine how communities connect, share, and respond in times of crisis. 🌟
