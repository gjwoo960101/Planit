interface AchievementSectionProps {
  achievementPercentage: number;
  remainingPercentage: number;
  isFiltered: boolean;
  selectedCategory: string;
  totalAchievementPercentage: number;
  animateIn: boolean;
}

export const AchievementSection = ({
  achievementPercentage,
  remainingPercentage,
  isFiltered,
  selectedCategory,
  totalAchievementPercentage,
  animateIn,
}: AchievementSectionProps) => {
  return (
    <div className="achievement-section">
      <div className="achievement-details">
        <p>
          {isFiltered ? `${selectedCategory} 카테고리 ` : "전체 "}
          달성률 {achievementPercentage}%
        </p>
        <div className="progress-bar-placeholder">
          <div
            className="progress-fill"
            style={{
              width: animateIn ? `${achievementPercentage}%` : "0%",
            }}
          ></div>
        </div>
        <p>남은 일정 {remainingPercentage}%</p>
        <div className="progress-bar-placeholder">
          <div
            className="progress-fill"
            style={{
              width: animateIn ? `${remainingPercentage}%` : "0%",
            }}
          ></div>
        </div>
        {isFiltered && (
          <div className="total-achievement-info">
            <p className="total-achievement-text">
              오늘 전체 달성률: {totalAchievementPercentage}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
