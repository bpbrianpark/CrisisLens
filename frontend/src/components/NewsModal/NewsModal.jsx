import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { CRISIS_BY_ID } from "../../constants/crisisTypes";
import "./NewsModal.css";

function NewsModal({ isOpen, news, onClose, locationName }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [localNews, setLocalNews] = useState(news);
  const [localLocationName, setLocalLocationName] = useState(locationName);

  // Keep a local copy of news and locationName so they don't disappear during closing
  useEffect(() => {
    if (news && news.length > 0) {
      setLocalNews(news);
      setLocalLocationName(locationName);
    }
  }, [news, locationName]);

  useEffect(() => {
    if (isOpen && !shouldRender) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else if (!isOpen && shouldRender) {
      setAnimate(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, animate]);

  if (!shouldRender || !localNews || localNews.length === 0) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`news-modal-backdrop ${animate ? 'visible' : ''}`} 
      onClick={handleBackdropClick}
      style={{
        opacity: animate ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      <div 
        className={`news-modal ${animate ? 'visible' : ''}`}
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'translateY(0) scale(1)' : 'translateY(-50px) scale(0.85)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="news-modal-header">
          <h2 className="news-modal-title">
            📰 Local News{localLocationName ? ` - ${localLocationName}` : ''}
            <span className="news-count">({localNews.length} article{localNews.length !== 1 ? 's' : ''})</span>
          </h2>
          <button onClick={onClose} className="news-modal-close" aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="news-modal-content">
          <div className="news-articles">
            {localNews.map((article, index) => {
              const hasCrisisType = article.crisisType && CRISIS_BY_ID[article.crisisType]?.icon;
              return (
                <div key={index} className="news-article-wrapper">
                  <div className="crisis-emoji-container" title={article.crisisType ? CRISIS_BY_ID[article.crisisType]?.label : 'No crisis type'}>
                    {hasCrisisType ? CRISIS_BY_ID[article.crisisType].icon : '📰'}
                  </div>
                <article className="news-article">
                  {article.image_url && (
                    <div className="news-article-image-container">
                      <img 
                        src={article.image_url} 
                        alt={article.title || "Article"} 
                        className="news-article-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="news-article-content">
                    <h3 className="news-article-title">
                      {article.title || "Untitled Article"}
                    </h3>
                  <p className="news-article-description">
                    {article.description || "No description available."}
                  </p>
                  <div className="news-article-meta">
                    {article.published_at && (
                      <span className="news-article-date">
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    )}
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="news-article-link"
                    >
                      Read Full Article →
                    </a>
                  </div>
                </div>
                </article>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

NewsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  news: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
  locationName: PropTypes.string,
};

export default NewsModal;
