export function PopcornRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number | null
  onChange?: (next: number | null) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-center gap-1" role={readOnly ? 'img' : 'radiogroup'} aria-label="爆谷評分">
      {[1, 2, 3, 4, 5].map((score) => {
        const filled = (value ?? 0) >= score
        if (readOnly) {
          return (
            <span key={score} className={`text-xl ${filled ? 'opacity-100' : 'opacity-25'}`} aria-hidden>
              🍿
            </span>
          )
        }
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} 爆谷`}
            className={`text-2xl transition ${filled ? 'scale-105' : 'opacity-35'}`}
            onClick={() => onChange?.(value === score ? null : score)}
          >
            🍿
          </button>
        )
      })}
      {!readOnly && (
        <span className="ml-1 text-xs text-mute">{value ? `${value} 爆谷` : '暫不評分'}</span>
      )}
    </div>
  )
}
