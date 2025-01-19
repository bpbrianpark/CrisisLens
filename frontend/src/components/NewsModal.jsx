import PropTypes from "prop-types";

function NewsModal({ isOpen, news, onClose }) {
  if (!isOpen || !news || news.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "600px",
          maxWidth: "90%",
          height: "80%",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #ddd",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Recent Local News</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ✖
          </button>
        </div>
        <div
          style={{
            overflowY: "auto",
            flex: 1,
          }}
        >
          {news.map((article, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "20px",
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: "15px",
              }}
            >
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title || "Article"}
                  style={{
                    width: "100px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    margin: 0,
                    marginBottom: "5px",
                    color: "#333",
                  }}
                >
                  {article.title || "Untitled Article"}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  {article.description || "No description available."}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007BFF",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  Read more →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewsModal;
