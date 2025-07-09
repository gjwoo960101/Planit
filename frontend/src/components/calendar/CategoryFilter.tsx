import { CATEGORIES } from "../../utils/calendarConstants";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  return (
    <div className="category-filter-section">
      <div className="category-buttons">
        <button
          className={`category-button ${
            selectedCategory === "전체" ? "active" : ""
          }`}
          onClick={() => onCategoryChange("전체")}
        >
          전체
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            className={`category-button ${
              selectedCategory === category.name ? "active" : ""
            }`}
            style={{ borderColor: category.color }}
            onClick={() => onCategoryChange(category.name)}
          >
            <span
              className="category-color-indicator"
              style={{ backgroundColor: category.color }}
            ></span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};
