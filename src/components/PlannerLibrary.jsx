import React from 'react';
import ItemVariantPreview from './ItemVariantPreview';
import { getRussianCategoryLabel, getRussianItemDescription, getRussianItemLabel, getRussianRoomLabel } from '../lib/russian';

export default function PlannerLibrary({
  activeRoom,
  catalogCategories,
  filteredItems,
  categoryId,
  onCategoryChange,
  query,
  onQueryChange,
  tier,
  onTierChange,
  recommendedOnly,
  onRecommendedOnlyChange,
  onAddItem,
  title = 'Furniture library',
  subtitle,
  searchPlaceholder = 'Search furniture, decor, or fixtures',
  addButtonLabel,
}) {
  return (
    <div className="panel compact-panel">
      <div className="panel-header">
        <span>{title}</span>
        <small>{subtitle ?? (activeRoom ? `Для комнаты «${getRussianRoomLabel(activeRoom)}»` : 'Выберите комнату, чтобы размещать предметы')}</small>
      </div>

      <div className="control-stack library-controls">
        <label className="select-field">
          <span>Поиск</span>
          <input
            data-testid="planner-library-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>

        <div className="library-toolbar">
          <label className="select-field library-tier-select">
            <span>Уровень варианта</span>
            <select data-testid="planner-library-tier" value={tier} onChange={(event) => onTierChange(event.target.value)}>
              {['Compact', 'Standard', 'Premium', 'Minimal', 'Statement'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={`filter-chip ${recommendedOnly ? 'active' : ''}`}
            data-testid="planner-library-recommended-toggle"
            onClick={() => onRecommendedOnlyChange(!recommendedOnly)}
          >
            Рекомендуемое
          </button>
        </div>
      </div>

      <div className="category-chip-row" role="tablist" aria-label="Категории библиотеки">
        <button
          type="button"
          className={`filter-chip ${categoryId === 'recommended' ? 'active' : ''}`}
          data-testid="planner-library-category-recommended"
          onClick={() => onCategoryChange('recommended')}
        >
          Рекомендуемое
        </button>
        {catalogCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`filter-chip ${categoryId === category.id ? 'active' : ''}`}
            data-testid={`planner-library-category-${category.id}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {getRussianCategoryLabel(category)}
          </button>
        ))}
      </div>

      {activeRoom ? (
        filteredItems.length ? (
          <div className="library-card-grid">
            {filteredItems.map((item) => {
              const previewVariant = item.variants.find((variant) => variant.tier === tier) ?? item.variants[1] ?? item.variants[0];

              return (
                <article key={item.id} className="library-card" data-testid={`planner-library-card-${item.id}`}>
                  <ItemVariantPreview variant={previewVariant} color={item.defaultColor} className="library-card-preview" />
                  <div className="library-card-copy">
                    <strong>{getRussianItemLabel(item)}</strong>
                    <small>{getRussianCategoryLabel({ id: item.categoryId, label: item.categoryLabel })}</small>
                    <p>{getRussianItemDescription(item)}</p>
                  </div>
                  <button
                    type="button"
                    className="primary-button library-add-button"
                    data-testid={`planner-library-add-${item.id}`}
                    onClick={() => onAddItem(item.id)}
                  >
                    {addButtonLabel ?? `Добавить в «${getRussianRoomLabel(activeRoom)}»`}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>Ничего не найдено</strong>
            <p>Попробуйте более общий запрос, смените категорию или отключите фильтр рекомендуемого.</p>
          </div>
        )
      ) : (
        <div className="empty-panel">
          <strong>Сначала выберите комнату</strong>
          <p>Библиотека подскажет подходящие категории для активной комнаты и будет размещать новые предметы именно в ней.</p>
        </div>
      )}
    </div>
  );
}
