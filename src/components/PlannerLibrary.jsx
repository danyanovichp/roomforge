import React, { useState } from 'react';
import { Plus, X, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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
  title = 'Библиотека предметов',
  addButtonLabel = '+',
}) {
  const [expandedItemId, setExpandedItemId] = useState(null);

  const toggleExpand = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Filter and Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        {/* Search input */}
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            data-testid="planner-library-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Поиск оборудования..."
            style={{
              width: '100%',
              padding: '0.4rem 0.6rem 0.4rem 2rem',
              borderRadius: '8px',
              border: '1px solid var(--panel-border)',
              background: 'var(--control-background)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Toggle recommended button */}
        <button
          type="button"
          className={`filter-chip ${recommendedOnly ? 'active' : ''}`}
          data-testid="planner-library-recommended-toggle"
          onClick={() => onRecommendedOnlyChange(!recommendedOnly)}
          style={{ minHeight: '32px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Sparkles size={11} />
          <span>Рекомендуемое</span>
        </button>

        {/* Tier dropdown (Standard/Premium variant) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select
            className="pill"
            value={tier}
            onChange={(e) => onTierChange(e.target.value)}
            style={{ 
              minHeight: '32px', 
              padding: '0.15rem 0.4rem', 
              fontSize: '0.75rem', 
              outline: 'none', 
              border: '1px solid var(--panel-border)', 
              background: 'var(--control-background)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="Standard">Стандарт</option>
            <option value="Premium">Премиум</option>
          </select>
        </div>
      </div>

      {/* Horizontal Category Switcher Tab-List */}
      <div 
        className="category-chip-row" 
        role="tablist" 
        aria-label="Категории библиотеки"
        style={{
          marginTop: 0,
          marginBottom: '0.75rem',
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          maxHeight: 'none',
          borderBottom: '1px solid var(--panel-border)'
        }}
      >
        <button
          type="button"
          className={`filter-chip ${categoryId === 'recommended' ? 'active' : ''}`}
          data-testid="planner-library-category-recommended"
          onClick={() => onCategoryChange('recommended')}
          style={{ minHeight: '28px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
        >
          Все категории
        </button>
        {catalogCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`filter-chip ${categoryId === category.id ? 'active' : ''}`}
            data-testid={`planner-library-category-${category.id}`}
            onClick={() => onCategoryChange(category.id)}
            style={{ minHeight: '28px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            {getRussianCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* Main Items Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeRoom ? (
          filteredItems.length ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredItems.map((item) => {
                const previewVariant = item.variants.find((v) => v.tier === tier) ?? item.variants[1] ?? item.variants[0];
                const footprint = previewVariant;
                const isExpanded = expandedItemId === item.id;

                return (
                  <div key={item.id} className="library-item-row" data-testid={`planner-library-card-${item.id}`}>
                    <div className="library-item-row-header" onClick={() => toggleExpand(item.id)}>
                      {/* Thumbnail Preview */}
                      <div className="library-item-thumbnail">
                        <ItemVariantPreview 
                          variant={previewVariant} 
                          color={item.defaultColor} 
                          style={{ width: '100%', height: '100%', maxWidth: '34px' }} 
                        />
                      </div>
                      
                      {/* Item copy */}
                      <div className="library-item-row-info">
                        <strong>{getRussianItemLabel(item)}</strong>
                        <span>
                          {footprint.width.toFixed(1)} × {footprint.depth.toFixed(1)} м · {getRussianCategoryLabel({ id: item.categoryId, label: item.categoryLabel })}
                        </span>
                      </div>

                      {/* Info toggle chevron */}
                      <div style={{ color: 'var(--text-subtle)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>

                      {/* Direct + Button */}
                      <button
                        type="button"
                        className="library-item-add-btn"
                        data-testid={`planner-library-add-${item.id}`}
                        onClick={(event) => {
                          event.stopPropagation(); // prevent expanding row when clicking add
                          onAddItem(item.id);
                        }}
                        title={`Поставить в «${getRussianRoomLabel(activeRoom)}»`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Expandable detailed drawer */}
                    {isExpanded && (
                      <div className="library-item-details">
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                          {getRussianItemDescription(item)}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                          <span>Выделенная мощность: <strong>{item.powerkW ? `${item.powerkW} кВт` : 'н/д'}</strong></span>
                          <span>Стоимость: <strong>{previewVariant.price ? `${previewVariant.price.toLocaleString('ru-RU')} ₽` : 'н/д'}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-panel" style={{ padding: '1rem', borderStyle: 'dashed', textAlign: 'center' }}>
              <strong style={{ fontSize: '0.85rem' }}>Ничего не найдено</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>Смените категорию или отключите фильтр рекомендуемого.</p>
            </div>
          )
        ) : (
          <div className="empty-panel" style={{ padding: '1rem', borderStyle: 'dashed', textAlign: 'center' }}>
            <strong style={{ fontSize: '0.85rem' }}>Сначала выберите комнату</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>Каталог покажет подходящие предметы и разместит их именно в ней.</p>
          </div>
        )}
      </div>
    </div>
  );
}
