import React from "react";
import "./NewsModal.css";

function NewsModal({ isOpen, news, onClose }) {
  if (!isOpen || !news || news.length === 0) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Recent Local News</h2>
          <button
            onClick={onClose}
            className="close-button"
          >
            close
          </button>
        </div>

        <div className="modal-backdrop-no-bg">
          <div className="modal-no-bg">
            <div className="modal-header">
              <h2 className="modal-title">Recent Local News</h2>
              <button onClick={onClose} className="close-button">
                Close
              </button>
            </div>

            <div className="article-list">
              {news.map((article, index) => (
                <div key={index} className="article">
                  <h3 className="article-title">{article.title || "Untitled Article"}</h3>
                  <p className="article-description">{article.description || "No description available."}</p>
                  {article.image_url && (
                    <img src={article.image_url} alt={article.title || "Article"} className="article-image" />
                  )}
                  <div className="article-footer">
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-link">
                      Read more →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsModal;
