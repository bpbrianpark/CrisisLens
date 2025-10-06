import PropTypes from "prop-types";

const CRISIS_TYPES = [
  { id: "fire", label: "Wildfire" },
  { id: "flood", label: "Flood" },
  { id: "earthquake", label: "Earthquake" },
  { id: "storm", label: "Storm" },
  { id: "landslide", label: "Landslide" },
  { id: "volcano", label: "Volcano" },
  { id: "other", label: "Other" },
];

export default function CrisisTypeModal({ isOpen, onConfirm, defaultType = "fire" }) {
  if (!isOpen) return null;

  return (
    <div className="crisis-modal">
      <div className="crisis-modal-content">
        {CRISIS_TYPES.map((type) => (
          <button
            key={type.id}
            className={`crisis-button ${defaultType === type.id ? "selected" : ""}`}
            onClick={() => onConfirm(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

CrisisTypeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  defaultType: PropTypes.string,
};
