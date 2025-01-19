import React from "react";

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
              backgroundColor: "#ff6b6b",
              color: "#ffffff",
              border: "none",
              borderRadius: "20px",
              padding: "5px 15px",
              fontSize: "0.9rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.3s, transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#ff4c4c")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#ff6b6b")}
            onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
          >
            close
          </button>
        </div>

        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#eaeff1",
              padding: "20px",
              borderRadius: "12px",
              width: "600px",
              maxWidth: "90%",
              height: "80%",
              overflow: "hidden",
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
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#000000" }}>Recent Local News</h2>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: "#ff6b6b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "5px 15px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.3s, transform 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#ff4c4c")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#ff6b6b")}
                onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
              >
                Close
              </button>
            </div>

            <div
              style={{
                overflowY: "auto",
                flex: 1,
                padding: "20px",
              }}
            >
              {news.map((article, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "20px",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#2c3e50",
                      marginBottom: "10px",
                    }}
                  >
                    {article.title || "Untitled Article"}
                  </h3>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#4a5568",
                      lineHeight: "1.6",
                      marginBottom: "15px",
                    }}
                  >
                    {article.description || "No description available."}
                  </p>
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title || "Article"}
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                        borderRadius: "12px", // Rounded corners for images
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#ff6b6b",
                        textDecoration: "none",
                        fontSize: "1rem",
                        fontWeight: "bold",
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
      </div>
    </div>
  );
}

export default NewsModal;
